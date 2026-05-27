export const runtime = 'nodejs';

import {
  UW_PARKING_SOURCE_URL,
  fetchParkingFacilities,
} from '../lib/uwParking';

export async function GET() {
  console.log('[uw-parking-api] GET:start');

  try {
    const facilities = await fetchParkingFacilities();
    console.log('[uw-parking-api] GET:success', { facilityCount: facilities.length });

    return Response.json(
      {
        fetchedAt: new Date().toISOString(),
        sourceUrl: UW_PARKING_SOURCE_URL,
        facilities,
      },
      {
        headers: {
          // Cache on Vercel's edge for 60s; serve stale while revalidating for 30s after.
          // Only one request per minute actually hits the UW scraper.
          'cache-control': 's-maxage=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown scrape failure';
    console.error('[uw-parking-api] GET:error', {
      message,
      stack: error instanceof Error ? error.stack : null,
    });

    return Response.json(
      {
        error: 'Unable to fetch UW parking availability',
        details: message,
      },
      {
        status: 502,
        headers: {
          'cache-control': 'no-store',
        },
      }
    );
  }
}
