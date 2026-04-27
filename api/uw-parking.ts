import { UW_PARKING_SOURCE_URL, fetchParkingFacilities } from '../lib/uwParking';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const facilities = await fetchParkingFacilities();

    return Response.json(
      {
        fetchedAt: new Date().toISOString(),
        sourceUrl: UW_PARKING_SOURCE_URL,
        facilities,
      },
      {
        headers: {
          'cache-control': 'no-store',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown scrape failure';

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
