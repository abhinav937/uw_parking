import type { ParkingAvailability } from './types';

export const STATUS_COLORS = {
  open: '#22c55e',
  caution: '#eab308',
  full: '#ef4444',
} as const;

export type AvailabilityTone = keyof typeof STATUS_COLORS;

export function getAvailabilityTone(availability: ParkingAvailability): AvailabilityTone {
  if (availability === 'OPEN') return 'open';
  if (availability === 'FULL') return 'full';
  if (availability > 100) return 'open';
  if (availability > 30) return 'caution';
  return 'full';
}

export function getAvailabilityColor(availability: ParkingAvailability): string {
  return STATUS_COLORS[getAvailabilityTone(availability)];
}
