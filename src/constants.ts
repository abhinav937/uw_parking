import type { ParkingFacility } from './types';
import { FOOTPRINTS } from './data/parkingFootprints';

/** Verified building footprints for garages that have polygon geometry (underground + surface lots use point markers). */
export const FACILITIES: ParkingFacility[] = [
  {
    id: 1, code: '020', name: 'University Avenue Ramp', type: 'garage',
    address: '1390 University Ave, Madison, WI 53706', region: 'Central',
    availability: 'OPEN', centroid: { lat: 43.0741322, lng: -89.4087827 },
    geometry: FOOTPRINTS[1],
  },
  {
    id: 2, code: '027', name: 'Nancy Nicholas Hall Garage', type: 'garage',
    address: '1300 Linden Drive, Madison, WI 53706', region: 'Central',
    availability: 15, centroid: { lat: 43.0753889, lng: -89.4095705 },
    geometry: FOOTPRINTS[2],
  },
  {
    id: 3, code: '036', name: 'Observatory Drive Ramp', type: 'garage',
    address: '1645 Observatory Dr, Madison, WI 53706', region: 'Central',
    availability: 309, centroid: { lat: 43.0760675, lng: -89.414122 },
    geometry: FOOTPRINTS[3],
  },
  {
    id: 4, code: '067', name: 'Linden Drive Ramp', type: 'garage',
    address: '2002 Linden Dr, Madison, WI 53706', region: 'Central',
    availability: 272, centroid: { lat: 43.0759989, lng: -89.4196168 },
    geometry: FOOTPRINTS[4],
  },
  {
    id: 5, code: '006L', name: 'H.C. White Garage Lower', type: 'garage',
    address: '615 N Park Street, Madison, WI 53706', region: 'East',
    availability: 8, centroid: { lat: 43.076776, lng: -89.4009771 },
    geometry: FOOTPRINTS[5],
  },
  {
    id: 6, code: '006U', name: 'H.C. White Garage Upper', type: 'garage',
    address: '615 N Park Street, Madison, WI 53706', region: 'East',
    availability: 'FULL', centroid: { lat: 43.076876, lng: -89.4009771 },
    geometry: FOOTPRINTS[6],
  },
  {
    id: 7, code: '007', name: 'Grainger Hall Garage', type: 'garage',
    address: '325 N Brooks St, Madison, WI 53715', region: 'East',
    availability: 123, centroid: { lat: 43.0727789, lng: -89.4018132 },
    geometry: FOOTPRINTS[7],
  },
  {
    id: 8, code: '029', name: 'N Park Street Ramp', type: 'garage',
    address: '21 N Park St, Madison, WI 53715', region: 'East',
    availability: 189, centroid: { lat: 43.0682, lng: -89.4000 },
    geometry: FOOTPRINTS[8],
  },
  {
    id: 9, code: '046', name: 'Lake & Johnson Ramp', type: 'garage',
    address: '626 W Johnson St, Madison, WI 53703', region: 'East',
    availability: 379, centroid: { lat: 43.072319, lng: -89.3966468 },
    geometry: FOOTPRINTS[9],
  },
  {
    id: 10, code: '083', name: 'Fluno Center Garage', type: 'garage',
    address: '314 N Frances St, Madison, WI 53715', region: 'East',
    availability: 104, centroid: { lat: 43.0728, lng: -89.3965 },
    geometry: FOOTPRINTS[10],
  },
  {
    id: 11, code: '017', name: 'Engineering Drive Ramp', type: 'garage',
    address: '1525 Engineering Dr, Madison, WI 53706', region: 'South',
    availability: 'OPEN', centroid: { lat: 43.0717344, lng: -89.4123879 },
    geometry: FOOTPRINTS[11],
  },
  {
    id: 12, code: '080', name: 'Union South Garage', type: 'garage',
    address: '1308 W Dayton St, Madison, WI 53715', region: 'South',
    availability: 20, centroid: { lat: 43.0712331, lng: -89.4080381 },
  },
  {
    id: 13, code: '063', name: "Children's Hospital Garage", type: 'garage',
    address: '1675 Highland Ave, Madison, WI 53792', region: 'West',
    availability: 32, centroid: { lat: 43.0771195, lng: -89.4333936 },
    geometry: FOOTPRINTS[13],
  },
  {
    id: 14, code: '076', name: 'University Bay Drive Ramp', type: 'garage',
    address: '2501 University Bay Dr, Madison, WI 53705', region: 'West',
    availability: 1009, centroid: { lat: 43.0798759, lng: -89.4289474 },
    geometry: FOOTPRINTS[14],
  },
];
