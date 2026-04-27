export const UW_PARKING_SOURCE_URL =
  'https://transportation.wisc.edu/parking-lots/lot-occupancy-count/';

type ParkingAvailability = 'OPEN' | 'FULL' | number;

export interface ScrapedFacility {
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

export function parseFacilities(html: string): ScrapedFacility[] {
  const tableMatch = html.match(/<table[^>]*id=(['"])table_1\1[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tableMatch) {
    throw new Error('Unable to locate table_1 on UW Transportation page');
  }

  return [...tableMatch[2].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
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
}

export async function fetchSourceHtml(): Promise<string> {
  const response = await fetch(UW_PARKING_SOURCE_URL, {
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
    headers: {
      'user-agent': 'uw-parking-app/1.0',
      accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`UW Transportation page returned ${response.status}`);
  }

  return response.text();
}

export async function fetchParkingFacilities(): Promise<ScrapedFacility[]> {
  const html = await fetchSourceHtml();
  return parseFacilities(html);
}
