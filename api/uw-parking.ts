export const runtime = 'nodejs';

const UW_PARKING_SOURCE_URL =
  'https://transportation.wisc.edu/parking-lots/lot-occupancy-count/';

type ParkingAvailability = 'OPEN' | 'FULL' | number;

interface ScrapedFacility {
  code: string;
  name: string;
  region: string;
  availability: ParkingAvailability;
  directionsUrl: string | null;
}

function decodeHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '-')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseAvailability(value: string): ParkingAvailability {
  const normalized = decodeHtml(value).toUpperCase().replace(/,/g, '');

  if (normalized === 'OPEN') return 'OPEN';
  if (normalized === 'FULL' || normalized === 'CLOSED' || normalized === 'NOT AVAILABLE') return 'FULL';
  if (/^\d+$/.test(normalized)) return Number(normalized);

  throw new Error(`Unexpected availability value: ${value}`);
}

function parseDirectionsUrl(cellHtml: string): string | null {
  const match = cellHtml.match(/href=(['"])(.*?)\1/i);
  return match?.[2] ?? null;
}

function parseFacilities(html: string): ScrapedFacility[] {
  console.log('[uw-parking] parseFacilities:start', { htmlLength: html.length });

  const tableMatch = html.match(/<table[^>]*id=(['"])table_1\1[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tableMatch) {
    console.error('[uw-parking] parseFacilities:missing-table', {
      containsTableId: html.includes('table_1'),
      containsVisitorParking: html.includes('Visitor Parking Availability'),
      preview: html.slice(0, 300),
    });
    throw new Error('Unable to locate table_1 on UW Transportation page');
  }

  const facilities = [...tableMatch[2].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map(rowMatch => {
      const rowHtml = rowMatch[1];
      const cells = [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(cellMatch => cellMatch[1]);
      if (cells.length < 3) return null;

      const garageText = decodeHtml(cells[1]);
      const garageMatch = garageText.match(/^([A-Z0-9]+)\s+(.+)$/);
      if (!garageMatch) return null;

      return {
        code: garageMatch[1],
        name: garageMatch[2],
        region: decodeHtml(cells[2]),
        availability: parseAvailability(cells[0]),
        directionsUrl: cells[3] ? parseDirectionsUrl(cells[3]) : null,
      };
    })
    .filter((facility): facility is ScrapedFacility => facility !== null);

  console.log('[uw-parking] parseFacilities:done', {
    facilityCount: facilities.length,
    firstFacility: facilities[0]?.code ?? null,
  });

  return facilities;
}

async function fetchParkingFacilities(): Promise<ScrapedFacility[]> {
  console.log('[uw-parking] fetchParkingFacilities:start', { sourceUrl: UW_PARKING_SOURCE_URL });

  const response = await fetch(UW_PARKING_SOURCE_URL, {
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
    headers: {
      'user-agent': 'uw-parking-app/1.0',
      accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    console.error('[uw-parking] fetchParkingFacilities:bad-status', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
    });
    throw new Error(`UW Transportation page returned ${response.status}`);
  }

  const html = await response.text();
  console.log('[uw-parking] fetchParkingFacilities:fetched', {
    status: response.status,
    redirected: response.redirected,
    finalUrl: response.url,
    contentType: response.headers.get('content-type'),
    htmlLength: html.length,
  });

  const facilities = parseFacilities(html);
  console.log('[uw-parking] fetchParkingFacilities:done', { facilityCount: facilities.length });
  return facilities;
}

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
          'cache-control': 'no-store',
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
