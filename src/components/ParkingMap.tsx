import { useMemo, useRef, useState } from 'react';
import { LocateFixed } from 'lucide-react';
import MapGL, { Layer, Marker, Source } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type {
  FillExtrusionLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from 'mapbox-gl';
import { createMapStyle } from '../mapStyle';
import { getAvailabilityColor } from '../design';
import type { ParkingFacility } from '../types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
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
        }}
      >
        P
      </div>
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
  return <GarageMarker color={color} isSelected={isSelected} isDarkMode={isDarkMode} code={facility.code} />;
}

function UserLocationMarker({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className={`user-location-marker${isDarkMode ? '' : ' light'}`}>
      <div className="user-location-marker-dot" />
    </div>
  );
}

// ── Map component ─────────────────────────────────────────────────────────────

interface ParkingMapProps {
  facilities: ParkingFacility[];
  selectedId: number | null;
  isDarkMode: boolean;
  showAvailabilityTooltip: boolean;
  userLocation: { lat: number; lng: number; accuracy: number } | null;
  locationPermission?: 'unknown' | 'granted' | 'prompt' | 'denied';
  onSelect: (id: number | null) => void;
  onRequestLocation?: () => void;
}

const INTERACTIVE_LAYERS = ['parking-garage-fill', 'parking-garage-extrusion', 'parking-surface-fill'];

export const ParkingMap = ({
  facilities,
  selectedId,
  isDarkMode,
  showAvailabilityTooltip,
  userLocation,
  locationPermission = 'unknown',
  onSelect,
  onRequestLocation,
}: ParkingMapProps) => {
  const mapRef = useRef<MapRef | null>(null);
  const mapStyle = useMemo(() => createMapStyle(isDarkMode), [isDarkMode]);

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
      f.type === 'garage' ||
      f.type === 'underground' ||
      (f.type === 'surface' && !f.geometry)
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

  // No text labels on map for maximum simplicity (Tesla-style)

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

  // Lot labels removed for maximum simplicity (Tesla-style minimal map)

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center text-sm ${
          isDarkMode ? 'bg-[#0f1720] text-slate-400' : 'bg-stone-100 text-stone-600'
        }`}
      >
        Missing VITE_MAPBOX_TOKEN — add it to .env
      </div>
    );
  }

  return (
    <MapGL
      ref={mapRef as any}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: -89.4085,
        latitude: 43.0746,
        zoom: 15.5,
        pitch: 52,
        bearing: -15,
      }}
      minZoom={13}
      maxZoom={18}
      mapStyle={mapStyle}
      style={{ width: '100%', height: '100%' }}
      interactiveLayerIds={INTERACTIVE_LAYERS}
      onClick={event => {
        const clicked = event.features?.find(f => INTERACTIVE_LAYERS.includes(f.layer.id));
        const clickedId = clicked ? Number(clicked.properties?.id) : null;
        onSelect(clickedId != null && Number.isFinite(clickedId) ? clickedId : null);
      }}
    >
      {locationPermission !== 'denied' && (
        <button
          className={`map-locate-btn${isDarkMode ? '' : ' light'}`}
          onClick={() => {
            if (userLocation) {
              mapRef.current?.flyTo({
                center: [userLocation.lng, userLocation.lat],
                zoom: Math.max(mapRef.current?.getZoom() ?? 15.5, 16),
                duration: 900,
                essential: true,
              });
            } else {
              onRequestLocation?.();
            }
          }}
          aria-label="Locate my position"
          type="button"
        >
          <LocateFixed size={16} />
        </button>
      )}

      {/* Surface lots */}
      {surfaceCollection.features.length > 0 && (
        <Source id="parking-surface" type="geojson" data={surfaceCollection}>
          <Layer {...surfaceFillLayer} />
          <Layer {...surfaceOutlineLayer} />
        </Source>
      )}

      {/* Garages — 3D extruded footprints */}
      {garageCollection.features.length > 0 && (
        <Source id="parking-garages" type="geojson" data={garageCollection}>
          <Layer {...garageFillLayer} />
          <Layer {...garageExtrusionLayer} />
          <Layer {...garageOutlineLayer} />
          <Layer {...garageSelectedLayer} />
        </Source>
      )}

      {/* Markers */}
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

      {userLocation && (
        <Marker
          longitude={userLocation.lng}
          latitude={userLocation.lat}
          anchor="center"
        >
          <UserLocationMarker isDarkMode={isDarkMode} />
        </Marker>
      )}
    </MapGL>
  );
};
