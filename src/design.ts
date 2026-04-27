import type { AvailabilityStatus, ParkingAvailability, ParkingFacilityType } from './types';

export const AVAILABILITY_COLORS: Record<AvailabilityStatus, string> = {
  open: '#22c55e',
  limited: '#f59e0b',
  full: '#ef4444',
};

export const FACILITY_TYPE_LABELS: Record<ParkingFacilityType, string> = {
  garage: 'Garage',
  underground: 'Underground',
  surface: 'Surface Lot',
};

export function getAvailabilityStatus(availability: ParkingAvailability): AvailabilityStatus {
  if (availability === 'FULL' || availability === 0) return 'full';
  if (availability === 'OPEN') return 'open';
  if ((availability as number) <= 30) return 'limited';
  return 'open';
}

export function getAvailabilityColor(availability: ParkingAvailability): string {
  return AVAILABILITY_COLORS[getAvailabilityStatus(availability)];
}

export function formatAvailability(availability: ParkingAvailability): string {
  if (availability === 'OPEN') return 'Open';
  if (availability === 'FULL') return 'Full';
  return String(availability);
}
