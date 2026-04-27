import { useMemo } from 'react';
import MapGL, { Layer, Marker, Popup, Source } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type {
  FillExtrusionLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
} from 'maplibre-gl';
import { createMapStyle } from '../mapStyle';
import { formatAvailability, getAvailabilityColor } from '../design';
import type { ParkingFacility } from '../types';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
const GARAGE_HEIGHT = 24;

// ── Marker shapes ─────────────────────────────────────────────────────────────

interface MarkerShapeProps {
  color: string;
  isSelected: boolean;
  isDarkMode: boolean;
}

function GarageMarker({ color, isSelected, isDarkMode }: MarkerShapeProps) {
  const ring = isSelected ? (isDarkMode ? '#ffffff' : '#0f172a') : 'rgba(255,255,255,0.5)';
  return (
    <div
      style={{
        width: 26, height: 26,
        borderRadius: 6,
        background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 12, fontWeight: 900, letterSpacing: '-0.02em',
        border: `2px solid ${ring}`,
        boxShadow: isSelected
          ? `0 0 0 3px ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}, 0 4px 16px ${color}55`
          : `0 2px 10px ${color}55`,
        cursor: 'pointer',
      }}
    >
      P
    </div>
  );
}

function UndergroundMarker({ color, isSelected, isDarkMode }: MarkerShapeProps) {
  const ring = isSelected ? (isDarkMode ? '#ffffff' : '#0f172a') : 'rgba(255,255,255,0.5)';
  return (
    <div
      style={{
        width: 26, height: 26,
        borderRadius: '50%',
        background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 14, fontWeight: 700, lineHeight: 1,
        border: `2px solid ${ring}`,
        boxShadow: isSelected
          ? `0 0 0 3px ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}, 0 4px 16px ${color}55`
          : `0 2px 10px ${color}55`,
        cursor: 'pointer',
      }}
    >
      ↓
    </div>
  );
}

function SurfaceMarker({ color, isSelected, isDarkMode }: MarkerShapeProps) {
  const ring = isSelected ? (isDarkMode ? '#ffffff' : '#0f172a') : 'rgba(255,255,255,0.5)';
  return (
    <div
      style={{
        width: 18, height: 18,
        background: color,
        transform: 'rotate(45deg)',
        border: `2px solid ${ring}`,
        boxShadow: isSelected
          ? `0 0 0 3px ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}, 0 4px 16px ${color}55`
          : `0 2px 10px ${color}55`,
        cursor: 'pointer',
      }}
    />
  );
}

function FacilityMarker({
  facility, isSelected, isDarkMode,
}: {
  facility: ParkingFacility; isSelected: boolean; isDarkMode: boolean;
}) {
  const color = getAvailabilityColor(facility.availability);
  if (facility.type === 'underground') {
    return <UndergroundMarker color={color} isSelected={isSelected} isDarkMode={isDarkMode} />;
  }
  if (facility.type === 'surface') {
    return <SurfaceMarker color={color} isSelected={isSelected} isDarkMode={isDarkMode} />;
  }
  return <GarageMarker color={color} isSelected={isSelected} isDarkMode={isDarkMode} />;
}

// ── Map component ─────────────────────────────────────────────────────────────

interface ParkingMapProps {
  facilities: ParkingFacility[];
  selectedId: number | null;
  isDarkMode: boolean;
  showAvailabilityTooltip: boolean;
  onSelect: (id: number | null) => void;
}

const INTERACTIVE_LAYERS = ['parking-garage-fill', 'parking-garage-extrusion', 'parking-surface-fill'];

export const ParkingMap = ({
  facilities,
  selectedId,
  isDarkMode,
  showAvailabilityTooltip,
  onSelect,
}: ParkingMapProps) => {
  const mapStyle = useMemo(
    () => (MAPTILER_KEY ? createMapStyle(MAPTILER_KEY, isDarkMode) : null),
    [isDarkMode]
  );

  const garagesWithGeometry = useMemo(
    () => facilities.filter(f => f.type === 'garage' && f.geometry),
    [facilities]
  );
  const surfaceWithGeometry = useMemo(
    () => facilities.filter(f => f.type === 'surface' && f.geometry),
    [facilities]
  );
  const markerFacilities = useMemo(
    () => facilities.filter(f =>
      f.type === 'garage' ||         // P marker on every garage, incl. extruded ones
      f.type === 'underground' ||    // ↓ marker
      (f.type === 'surface' && !f.geometry) // ◆ marker for surface lots without polygon
    ),
    [facilities]
  );
  const selectedFacility = useMemo(
    () => facilities.find(facility => facility.id === selectedId) ?? null,
    [facilities, selectedId]
  );

  const garageCollection = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: garagesWithGeometry.map(f => ({
      ...f.geometry!,
      id: f.id,
      properties: { id: f.id, availabilityColor: getAvailabilityColor(f.availability) },
    })),
  }), [garagesWithGeometry]);

  const surfaceCollection = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: surfaceWithGeometry.map(f => ({
      ...f.geometry!,
      id: f.id,
      properties: { id: f.id, availabilityColor: getAvailabilityColor(f.availability) },
    })),
  }), [surfaceWithGeometry]);

  // Layer specs

  const garageFillLayer: Omit<FillLayerSpecification, 'source'> = {
    id: 'parking-garage-fill',
    type: 'fill',
    paint: {
      'fill-color': ['get', 'availabilityColor'] as any,
      'fill-opacity': 0.08,
    },
  };

  const garageExtrusionLayer: Omit<FillExtrusionLayerSpecification, 'source'> = {
    id: 'parking-garage-extrusion',
    type: 'fill-extrusion',
    paint: {
      'fill-extrusion-color': ['get', 'availabilityColor'] as any,
      'fill-extrusion-height': GARAGE_HEIGHT,
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': isDarkMode ? 0.88 : 0.74,
    },
  };

  const garageOutlineLayer: Omit<LineLayerSpecification, 'source'> = {
    id: 'parking-garage-outline',
    type: 'line',
    paint: {
      'line-color': ['get', 'availabilityColor'] as any,
      'line-width': 1.5,
      'line-opacity': 0.7,
    },
  };

  const garageSelectedLayer: Omit<LineLayerSpecification, 'source'> = {
    id: 'parking-garage-selected',
    type: 'line',
    filter: ['==', ['get', 'id'], selectedId ?? -1] as any,
    paint: {
      'line-color': isDarkMode ? '#ffffff' : '#0f172a',
      'line-width': 3,
      'line-opacity': 1,
    },
  };

  const surfaceFillLayer: Omit<FillLayerSpecification, 'source'> = {
    id: 'parking-surface-fill',
    type: 'fill',
    paint: {
      'fill-color': ['get', 'availabilityColor'] as any,
      'fill-opacity': isDarkMode ? 0.3 : 0.22,
    },
  };

  const surfaceOutlineLayer: Omit<LineLayerSpecification, 'source'> = {
    id: 'parking-surface-outline',
    type: 'line',
    paint: {
      'line-color': ['get', 'availabilityColor'] as any,
      'line-width': 1.5,
      'line-opacity': 0.8,
    },
  };

  if (!MAPTILER_KEY || !mapStyle) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center text-sm ${
          isDarkMode ? 'bg-[#0f1720] text-slate-400' : 'bg-stone-100 text-stone-600'
        }`}
      >
        Missing VITE_MAPTILER_KEY — add it to .env
      </div>
    );
  }

  return (
    <MapGL
      initialViewState={{
        longitude: -89.4085,
        latitude: 43.0746,
        zoom: 15.5,
        pitch: 52,
        bearing: -15,
      }}
      minZoom={13}
      maxZoom={18}
      mapStyle={mapStyle as any}
      style={{ width: '100%', height: '100%' }}
      interactiveLayerIds={INTERACTIVE_LAYERS}
      onClick={event => {
        const clicked = event.features?.find(f => INTERACTIVE_LAYERS.includes(f.layer.id));
        const clickedId = clicked ? Number(clicked.properties?.id) : null;
        onSelect(clickedId != null && Number.isFinite(clickedId) ? clickedId : null);
      }}
    >
      {/* Surface lots — flat polygon fill, no extrusion */}
      {surfaceCollection.features.length > 0 && (
        <Source id="parking-surface" type="geojson" data={surfaceCollection}>
          <Layer {...surfaceFillLayer} beforeId="place_label_other" />
          <Layer {...surfaceOutlineLayer} beforeId="place_label_other" />
        </Source>
      )}

      {/* Garages — 3D extruded footprints */}
      {garageCollection.features.length > 0 && (
        <Source id="parking-garages" type="geojson" data={garageCollection}>
          <Layer {...garageFillLayer} beforeId="place_label_other" />
          <Layer {...garageExtrusionLayer} beforeId="place_label_other" />
          <Layer {...garageOutlineLayer} beforeId="place_label_other" />
          <Layer {...garageSelectedLayer} />
        </Source>
      )}

      {/* Markers — garages without footprint, underground, surface without polygon */}
      {markerFacilities.map(facility => (
        <Marker
          key={facility.id}
          longitude={facility.centroid.lng}
          latitude={facility.centroid.lat}
          anchor="center"
          onClick={e => {
            e.originalEvent.stopPropagation();
            onSelect(facility.id === selectedId ? null : facility.id);
          }}
        >
          <FacilityMarker
            facility={facility}
            isSelected={selectedId === facility.id}
            isDarkMode={isDarkMode}
          />
        </Marker>
      ))}

      {showAvailabilityTooltip && selectedFacility && (
        <Popup
          longitude={selectedFacility.centroid.lng}
          latitude={selectedFacility.centroid.lat}
          anchor="bottom"
          closeButton={false}
          closeOnClick={false}
          offset={18}
          className="parking-tooltip-popup"
        >
          <div className="parking-tooltip">
            <div className="parking-tooltip-name">{selectedFacility.code}</div>
            <div
              className="parking-tooltip-value"
              style={{ color: getAvailabilityColor(selectedFacility.availability) }}
            >
              {formatAvailability(selectedFacility.availability)}
            </div>
          </div>
        </Popup>
      )}
    </MapGL>
  );
};
