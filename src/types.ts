import type { Feature, Polygon } from 'geojson';

export type ParkingFacilityType = 'garage' | 'underground' | 'surface';
export type ParkingAvailability = 'OPEN' | 'FULL' | number;
export type AvailabilityStatus = 'open' | 'limited' | 'full';
export type Region = 'Central' | 'East' | 'South' | 'West';

export interface ParkingFacility {
  id: number;
  code: string;
  name: string;
  type: ParkingFacilityType;
  address: string;
  region: Region;
  availability: ParkingAvailability;
  centroid: { lat: number; lng: number };
  geometry?: Feature<Polygon>; // verified footprint; facility type determines render mode
}
