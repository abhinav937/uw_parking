export const MAP_STYLE_TEMPLATE = {
  version: 8,
  name: 'UW Parking',
  metadata: {
    'mapbox:autocomposite': false,
    'maputnik:renderer': 'mbgljs',
    'openmaptiles:version': '3.x',
  },
  sources: {
    openmaptiles: {
      type: 'vector',
      url: 'https://api.maptiler.com/tiles/v3-openmaptiles/tiles.json?key={key}',
    },
  },
  glyphs: 'https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key={key}',
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': 'hsl(47, 26%, 88%)' } },
    {
      id: 'landuse-residential', type: 'fill', source: 'openmaptiles', 'source-layer': 'landuse',
      filter: ['all', ['==', '$type', 'Polygon'], ['==', 'class', 'residential']],
      layout: { visibility: 'visible' },
      paint: { 'fill-color': 'hsl(47, 13%, 86%)', 'fill-opacity': 0.7 },
    },
    {
      id: 'landcover_grass', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover',
      filter: ['==', 'class', 'grass'],
      paint: { 'fill-color': 'hsl(82, 46%, 72%)', 'fill-opacity': 0.45 },
    },
    {
      id: 'park', type: 'fill', source: 'openmaptiles', 'source-layer': 'park',
      paint: { 'fill-color': 'rgba(192, 216, 151, 0.53)', 'fill-opacity': 1 },
    },
    {
      id: 'landcover_wood', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover',
      filter: ['==', 'class', 'wood'],
      paint: { 'fill-color': 'hsl(82, 46%, 72%)', 'fill-opacity': { base: 1, stops: [[8, 0.6], [22, 1]] } },
    },
    {
      id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water',
      filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'brunnel', 'tunnel']],
      paint: { 'fill-color': 'hsl(205, 56%, 73%)' },
    },
    {
      id: 'landuse', type: 'fill', source: 'openmaptiles', 'source-layer': 'landuse',
      filter: ['==', 'class', 'agriculture'],
      layout: { visibility: 'visible' },
      paint: { 'fill-color': '#eae0d0' },
    },
    {
      id: 'landuse_overlay_national_park', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover',
      filter: ['==', 'class', 'national_park'],
      paint: { 'fill-color': '#E1EBB0', 'fill-opacity': { base: 1, stops: [[5, 0], [9, 0.75]] } },
    },
    {
      id: 'park_outline', type: 'line', source: 'openmaptiles', 'source-layer': 'park',
      layout: {},
      paint: { 'line-color': 'rgba(159, 183, 118, 0.69)', 'line-dasharray': [0.5, 1] },
    },
    {
      id: 'waterway_tunnel', type: 'line', source: 'openmaptiles', 'source-layer': 'waterway',
      filter: ['all', ['==', '$type', 'LineString'], ['==', 'brunnel', 'tunnel']],
      layout: { visibility: 'visible' },
      paint: {
        'line-color': 'hsl(205, 56%, 73%)', 'line-dasharray': [3, 3],
        'line-gap-width': { stops: [[12, 0], [20, 6]] }, 'line-opacity': 1,
        'line-width': { base: 1.4, stops: [[8, 1], [20, 2]] },
      },
    },
    {
      id: 'waterway', type: 'line', source: 'openmaptiles', 'source-layer': 'waterway',
      filter: ['all', ['==', '$type', 'LineString'], ['!=', 'intermittent', 1], ['!in', 'brunnel', 'tunnel', 'bridge']],
      layout: { visibility: 'none' },
      paint: { 'line-color': 'hsl(205, 56%, 73%)', 'line-opacity': 1, 'line-width': { base: 1.4, stops: [[8, 1], [20, 8]] } },
    },
    {
      id: 'road_area_pier', type: 'fill', metadata: {}, source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'Polygon'], ['==', 'class', 'pier']],
      layout: { visibility: 'visible' },
      paint: { 'fill-antialias': true, 'fill-color': 'hsl(47, 26%, 88%)' },
    },
    {
      id: 'road_bridge_area', type: 'fill', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'Polygon'], ['in', 'brunnel', 'bridge']],
      layout: {},
      paint: { 'fill-color': 'hsl(47, 26%, 88%)', 'fill-opacity': 0.5 },
    },
    {
      id: 'road_path', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['in', 'class', 'path', 'track']],
      layout: { 'line-cap': 'square', 'line-join': 'bevel' },
      paint: { 'line-color': 'hsl(0, 0%, 97%)', 'line-dasharray': [1, 1], 'line-width': { base: 1.55, stops: [[4, 0.25], [20, 10]] } },
    },
    {
      id: 'road_minor', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['in', 'class', 'minor', 'service']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': 'hsl(0, 0%, 97%)', 'line-width': { base: 1.55, stops: [[4, 0.25], [20, 30]] } },
    },
    {
      id: 'tunnel_minor', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['all', ['==', 'brunnel', 'tunnel'], ['==', 'class', 'minor_road']]],
      layout: { 'line-cap': 'butt', 'line-join': 'miter' },
      paint: { 'line-color': '#efefef', 'line-dasharray': [0.36, 0.18], 'line-width': { base: 1.55, stops: [[4, 0.25], [20, 30]] } },
    },
    {
      id: 'tunnel_major', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['all', ['==', 'brunnel', 'tunnel'], ['in', 'class', 'primary', 'secondary', 'tertiary', 'trunk']]],
      layout: { 'line-cap': 'butt', 'line-join': 'miter' },
      paint: { 'line-color': '#fff', 'line-dasharray': [0.28, 0.14], 'line-width': { base: 1.4, stops: [[6, 0.5], [20, 30]] } },
    },
    {
      id: 'road_trunk_primary', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['in', 'class', 'trunk', 'primary']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#fff', 'line-width': { base: 1.4, stops: [[6, 0.5], [20, 30]] } },
    },
    {
      id: 'road_secondary_tertiary', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['in', 'class', 'secondary', 'tertiary']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#fff', 'line-width': { base: 1.4, stops: [[6, 0.5], [20, 20]] } },
    },
    {
      id: 'road_major_motorway', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['==', 'class', 'motorway']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': 'hsl(0, 0%, 100%)', 'line-offset': 0, 'line-width': { base: 1.4, stops: [[8, 1], [16, 10]] } },
    },
    {
      id: 'railway_transit', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['all', ['==', 'class', 'transit'], ['!=', 'brunnel', 'tunnel']],
      layout: { visibility: 'visible' },
      paint: { 'line-color': 'hsl(34, 12%, 66%)', 'line-opacity': { base: 1, stops: [[11, 0], [16, 1]] } },
    },
    {
      id: 'railway', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['==', 'class', 'rail'],
      layout: { visibility: 'visible' },
      paint: { 'line-color': 'hsl(34, 12%, 66%)', 'line-opacity': { base: 1, stops: [[11, 0], [16, 1]] } },
    },
    {
      id: 'bridge_minor case', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['all', ['==', 'brunnel', 'bridge'], ['==', 'class', 'minor_road']]],
      layout: { 'line-cap': 'butt', 'line-join': 'miter' },
      paint: { 'line-color': '#dedede', 'line-gap-width': { base: 1.55, stops: [[4, 0.25], [20, 30]] }, 'line-width': { base: 1.6, stops: [[12, 0.5], [20, 10]] } },
    },
    {
      id: 'bridge_major case', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['all', ['==', 'brunnel', 'bridge'], ['in', 'class', 'primary', 'secondary', 'tertiary', 'trunk']]],
      layout: { 'line-cap': 'butt', 'line-join': 'miter' },
      paint: { 'line-color': '#dedede', 'line-gap-width': { base: 1.55, stops: [[4, 0.25], [20, 30]] }, 'line-width': { base: 1.6, stops: [[12, 0.5], [20, 10]] } },
    },
    {
      id: 'bridge_minor', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['all', ['==', 'brunnel', 'bridge'], ['==', 'class', 'minor_road']]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#efefef', 'line-width': { base: 1.55, stops: [[4, 0.25], [20, 30]] } },
    },
    {
      id: 'bridge_major', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['all', ['==', '$type', 'LineString'], ['all', ['==', 'brunnel', 'bridge'], ['in', 'class', 'primary', 'secondary', 'tertiary', 'trunk']]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#fff', 'line-width': { base: 1.4, stops: [[6, 0.5], [20, 30]] } },
    },
    {
      id: 'admin_sub', type: 'line', source: 'openmaptiles', 'source-layer': 'boundary',
      filter: ['in', 'admin_level', 4, 6, 8],
      layout: { visibility: 'visible' },
      paint: { 'line-color': 'hsl(0, 0%, 76%)', 'line-dasharray': [2, 1] },
    },
    {
      id: 'admin_country_z0-4', type: 'line', source: 'openmaptiles', 'source-layer': 'boundary',
      maxzoom: 5,
      filter: ['all', ['<=', 'admin_level', 2], ['==', '$type', 'LineString'], ['!has', 'claimed_by']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': 'hsla(0, 8%, 22%, 0.51)', 'line-width': { base: 1.3, stops: [[3, 0.5], [22, 15]] } },
    },
    {
      id: 'admin_country_z5-', type: 'line', source: 'openmaptiles', 'source-layer': 'boundary',
      minzoom: 5,
      filter: ['all', ['<=', 'admin_level', 2], ['==', '$type', 'LineString']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': 'hsla(0, 8%, 22%, 0.51)', 'line-width': { base: 1.3, stops: [[3, 0.5], [22, 15]] } },
    },
    {
      id: 'road_major_label', type: 'symbol', source: 'openmaptiles', 'source-layer': 'transportation_name',
      filter: ['==', '$type', 'LineString'],
      layout: {
        'symbol-placement': 'line',
        'text-field': '{name}',
        'text-font': ['Klokantech Noto Sans Regular'],
        'text-letter-spacing': 0.1,
        'text-rotation-alignment': 'map',
        'text-size': { base: 1.4, stops: [[10, 8], [20, 14]] },
        'text-transform': 'uppercase',
      },
      paint: { 'text-color': '#000', 'text-halo-color': 'hsl(0, 0%, 100%)', 'text-halo-width': 2 },
    },
    {
      id: 'building-3d', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building',
      filter: ['all', ['!has', 'hide_3d']],
      paint: {
        'fill-extrusion-base': { property: 'render_min_height', type: 'identity' },
        // Keep non-parking buildings neutral; OSM colour tags create random bright buildings in light mode.
        'fill-extrusion-color': 'hsl(39, 22%, 80%)',
        'fill-extrusion-height': { property: 'render_height', type: 'identity' },
        'fill-extrusion-opacity': 0.55,
      },
    },
    {
      id: 'place_label_other', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place',
      minzoom: 8,
      filter: ['all', ['==', '$type', 'Point'], ['all', ['!=', 'class', 'city']]],
      layout: {
        'text-anchor': 'center', 'text-field': '{name_en}',
        'text-font': ['Klokantech Noto Sans Regular'],
        'text-max-width': 6, 'text-size': { stops: [[6, 10], [12, 14]] }, visibility: 'visible',
      },
      paint: { 'text-color': 'hsl(0, 10%, 25%)', 'text-halo-blur': 0, 'text-halo-color': 'hsl(0, 0%, 100%)', 'text-halo-width': 2 },
    },
    {
      id: 'place_label_city', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place',
      maxzoom: 16,
      filter: ['all', ['==', '$type', 'Point'], ['==', 'class', 'city']],
      layout: { 'text-field': '{name_en}', 'text-font': ['Klokantech Noto Sans Regular'], 'text-max-width': 10, 'text-size': { stops: [[3, 12], [8, 16]] } },
      paint: { 'text-color': 'hsl(0, 0%, 0%)', 'text-halo-blur': 0, 'text-halo-color': 'hsla(0, 0%, 100%, 0.75)', 'text-halo-width': 2 },
    },
    {
      id: 'country_label', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place',
      maxzoom: 12,
      filter: ['all', ['==', '$type', 'Point'], ['==', 'class', 'country']],
      layout: { 'text-field': '{name}', 'text-font': ['Klokantech Noto Sans Bold'], 'text-max-width': 10, 'text-size': { stops: [[3, 12], [8, 22]] } },
      paint: { 'text-color': 'hsl(0, 0%, 13%)', 'text-halo-blur': 0, 'text-halo-color': 'rgba(255,255,255,0.75)', 'text-halo-width': 2 },
    },
  ],
  id: 'uw-parking',
} as const;

type MapStyle = {
  sources: { openmaptiles: { url: string } };
  glyphs: string;
  layers: Array<{ id: string; paint?: Record<string, unknown> }>;
};

// Dusk palette: slate-charcoal base, parking overlays are the strongest colors
const DUSK_OVERRIDES: Record<string, Record<string, unknown>> = {
  background: { 'background-color': '#0f1720' },
  'landuse-residential': { 'fill-color': '#182535', 'fill-opacity': 0.85 },
  landcover_grass: { 'fill-color': '#1a3328', 'fill-opacity': 0.5 },
  park: { 'fill-color': 'rgba(20, 58, 38, 0.45)' },
  landcover_wood: { 'fill-color': '#16302a', 'fill-opacity': 0.65 },
  water: { 'fill-color': '#17324a' },
  landuse: { 'fill-color': '#16202c' },
  landuse_overlay_national_park: { 'fill-color': '#1d3828', 'fill-opacity': 0.4 },
  park_outline: { 'line-color': 'rgba(80, 140, 100, 0.45)' },
  road_area_pier: { 'fill-color': '#0d1620' },
  road_bridge_area: { 'fill-color': '#0d1620', 'fill-opacity': 0.4 },
  road_path: { 'line-color': 'rgba(255, 255, 255, 0.12)' },
  road_minor: { 'line-color': 'rgba(255, 255, 255, 0.16)' },
  tunnel_minor: { 'line-color': 'rgba(255, 255, 255, 0.14)' },
  tunnel_major: { 'line-color': 'rgba(255, 255, 255, 0.22)' },
  road_trunk_primary: { 'line-color': 'rgba(255, 255, 255, 0.27)' },
  road_secondary_tertiary: { 'line-color': 'rgba(255, 255, 255, 0.22)' },
  road_major_motorway: { 'line-color': 'rgba(255, 255, 255, 0.27)' },
  railway_transit: { 'line-color': 'rgba(140, 165, 185, 0.32)' },
  railway: { 'line-color': 'rgba(140, 165, 185, 0.28)' },
  'bridge_minor case': { 'line-color': 'rgba(15, 23, 32, 0.9)' },
  'bridge_major case': { 'line-color': 'rgba(15, 23, 32, 0.9)' },
  bridge_minor: { 'line-color': 'rgba(255, 255, 255, 0.16)' },
  bridge_major: { 'line-color': 'rgba(255, 255, 255, 0.24)' },
  admin_sub: { 'line-color': 'rgba(95, 125, 148, 0.28)' },
  'admin_country_z0-4': { 'line-color': 'rgba(95, 125, 148, 0.38)' },
  'admin_country_z5-': { 'line-color': 'rgba(95, 125, 148, 0.38)' },
  road_major_label: {
    'text-color': 'rgba(195, 218, 238, 0.74)',
    'text-halo-color': 'rgba(15, 23, 32, 0.92)',
    'text-halo-width': 2,
  },
  'building-3d': {
    'fill-extrusion-color': '#1d2c40',
    'fill-extrusion-opacity': 0.38,
  },
  place_label_other: {
    'text-color': 'rgba(195, 218, 238, 0.72)',
    'text-halo-color': 'rgba(15, 23, 32, 0.92)',
    'text-halo-width': 2,
  },
  place_label_city: {
    'text-color': 'rgba(215, 232, 248, 0.85)',
    'text-halo-color': 'rgba(15, 23, 32, 0.94)',
    'text-halo-width': 2,
  },
  country_label: {
    'text-color': 'rgba(195, 218, 238, 0.72)',
    'text-halo-color': 'rgba(15, 23, 32, 0.92)',
    'text-halo-width': 2,
  },
};

function applyLayerPaint(style: MapStyle, layerId: string, overrides: Record<string, unknown>) {
  const layer = style.layers.find(l => l.id === layerId);
  if (!layer) return;
  layer.paint = { ...(layer.paint ?? {}), ...overrides };
}

export function createMapStyle(key: string, isDarkMode: boolean) {
  const style = JSON.parse(
    JSON.stringify(MAP_STYLE_TEMPLATE).replace(/\{key\}/g, key)
  ) as MapStyle;

  if (!isDarkMode) return style;

  for (const [layerId, overrides] of Object.entries(DUSK_OVERRIDES)) {
    applyLayerPaint(style, layerId, overrides);
  }

  return style;
}
