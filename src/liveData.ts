import type { ParkingAvailability } from './types';

export interface LiveParkingFacility {
  code: string;
  name: string;
  region: string;
  availability: ParkingAvailability;
  directionsUrl: string | null;
}

export interface LiveParkingResponse {
  fetchedAt: string;
  sourceUrl: string;
  facilities: LiveParkingFacility[];
}
