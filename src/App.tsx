import { useCallback, useEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import { ChevronDown, ChevronUp, CircleAlert, GripHorizontal, MapPin, Moon, RefreshCw, Search, Sun } from 'lucide-react';
import { ParkingMap } from './components/ParkingMap';
import { FACILITIES } from './constants';
import {
  AVAILABILITY_COLORS,
  formatAvailability,
  getAvailabilityColor,
  getAvailabilityStatus,
} from './design';
import type { LiveParkingResponse } from './liveData';
import type { AvailabilityStatus, ParkingFacility, ParkingFacilityType, Region } from './types';

const ALL_TYPES: ParkingFacilityType[] = ['garage', 'underground', 'surface'];
const ALL_STATUSES: AvailabilityStatus[] = ['open', 'limited', 'full', 'unknown'];
const ALL_REGIONS: Region[] = ['Central', 'East', 'South', 'West'];
type FeedStatus = 'loading' | 'live' | 'stale' | 'fallback';
type MobilePanel = 'lots' | 'filters';
const THEME_STORAGE_KEY = 'uw-parking-theme';

function stripAvailability(facilities: ParkingFacility[]): ParkingFacility[] {
  return facilities.map(facility => ({
    ...facility,
    availability: null,
  }));
}

function applyLiveData(payload: LiveParkingResponse): ParkingFacility[] {
  const facilitiesByCode = new Map(payload.facilities.map(facility => [facility.code, facility]));

  return FACILITIES.map(facility => {
    const liveFacility = facilitiesByCode.get(facility.code);
    if (!liveFacility) {
      return {
        ...facility,
        availability: null,
      };
    }

    return {
      ...facility,
      availability: liveFacility.availability,
    };
  });
}

function formatUpdatedTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString();
}

function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return true;

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'light') return false;
  if (storedTheme === 'dark') return true;

  return true;
}

interface AppProps {
  initialPayload?: LiveParkingResponse | null;
}

interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
}

function getIsMobileExperience(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
}

// ── Facility type icon (shared by legend, list, and detail) ───────────────────

function TypeIcon({
  type, color, size = 16,
}: {
  type: ParkingFacilityType; color: string; size?: number;
}) {
  if (type === 'underground') {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', background: color, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: size * 0.55, fontWeight: 700,
      }}>↓</div>
    );
  }
  if (type === 'surface') {
    return (
      <div style={{
        width: size * 0.75, height: size * 0.75, background: color,
        transform: 'rotate(45deg)', flexShrink: 0,
      }} />
    );
  }
  // garage
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.25, background: color, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.55, fontWeight: 900,
    }}>P</div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App({ initialPayload = null }: AppProps) {
  const [facilities, setFacilities] = useState<ParkingFacility[]>(() =>
    initialPayload ? applyLiveData(initialPayload) : stripAvailability(FACILITIES)
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialDarkMode);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedStatus, setFeedStatus] = useState<FeedStatus>(initialPayload ? 'live' : 'loading');
  const [lastUpdated, setLastUpdated] = useState<string | null>(
    initialPayload ? formatUpdatedTime(initialPayload.fetchedAt) : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<Set<ParkingFacilityType>>(new Set(ALL_TYPES));
  const [statusFilter, setStatusFilter] = useState<Set<AvailabilityStatus>>(new Set(ALL_STATUSES));
  const [regionFilter, setRegionFilter] = useState<Region | ''>('');
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('lots');
  const [isMobileRailOpen, setIsMobileRailOpen] = useState(false);
  const [isMobileExperience, setIsMobileExperience] = useState<boolean>(getIsMobileExperience);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const mobileRailTouch = useRef({ active: false, startY: 0, lastY: 0 });

  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !isDarkMode);
    document.body.classList.toggle('light-mode', !isDarkMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 900px), (pointer: coarse)');
    const update = () => setIsMobileExperience(mediaQuery.matches);

    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      position => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      error => {
        console.error('Unable to retrieve user location', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15_000,
        timeout: 10_000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const response = await fetch('/api/uw-parking');
      if (!response.ok) {
        throw new Error(`Parking API returned ${response.status}`);
      }

      const payload = await response.json() as LiveParkingResponse;
      setFacilities(applyLiveData(payload));
      setLastUpdated(formatUpdatedTime(payload.fetchedAt));
      setFeedStatus('live');
    } catch (error) {
      console.error('Unable to refresh parking availability', error);
      setFeedStatus(currentStatus => (lastUpdated ? 'stale' : 'fallback'));
      if (!lastUpdated) setFacilities(stripAvailability(FACILITIES));
    } finally {
      setIsRefreshing(false);
    }
  }, [lastUpdated]);

  useEffect(() => {
    if (!initialPayload) {
      void refreshData();
    }
    const id = window.setInterval(() => void refreshData(), 60_000);
    return () => window.clearInterval(id);
  }, [initialPayload, refreshData]);

  const filteredFacilities = facilities.filter(f => {
    if (!typeFilter.has(f.type)) return false;
    if (!statusFilter.has(getAvailabilityStatus(f.availability))) return false;
    if (regionFilter && f.region !== regionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (![f.name, f.code, f.region, f.address].some(v => v.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  // Clear selection when the selected facility is filtered out
  useEffect(() => {
    if (selectedId !== null && !filteredFacilities.find(f => f.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredFacilities, selectedId]);

  useEffect(() => {
    if (
      selectedId !== null &&
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 900px)').matches
    ) {
      setIsMobileRailOpen(false);
    }
  }, [selectedId]);

  function toggleType(t: ParkingFacilityType) {
    setTypeFilter(prev => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  }

  function toggleStatus(s: AvailabilityStatus) {
    setStatusFilter(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }

  function handleMobileRailTouchStart(event: TouchEvent<HTMLButtonElement>) {
    if (event.touches.length !== 1) return;
    mobileRailTouch.current = {
      active: true,
      startY: event.touches[0].clientY,
      lastY: event.touches[0].clientY,
    };
  }

  function handleMobileRailTouchMove(event: TouchEvent<HTMLButtonElement>) {
    if (!mobileRailTouch.current.active || event.touches.length !== 1) return;
    mobileRailTouch.current.lastY = event.touches[0].clientY;
  }

  function handleMobileRailTouchEnd() {
    if (!mobileRailTouch.current.active) return;

    const deltaY = mobileRailTouch.current.lastY - mobileRailTouch.current.startY;
    mobileRailTouch.current.active = false;

    if (Math.abs(deltaY) < 28) return;
    if (deltaY > 0) {
      setIsMobileRailOpen(false);
    } else {
      setIsMobileRailOpen(true);
    }
  }

  const feedNote = {
    loading: 'Loading live visitor parking availability from UW Transportation Services.',
    live: 'Live visitor parking availability from UW Transportation Services.',
    stale: 'Live feed refresh failed. Showing the last successful UW Transportation snapshot.',
    fallback: 'Live feed unavailable. Availability is hidden until UW Transportation responds.',
  }[feedStatus];

  return (
    <div className="app-shell">
      {/* ── Left rail ──────────────────────────────────────────────────────── */}
      <aside className={`left-rail${isMobileRailOpen ? ' mobile-open' : ''}`}>
        <div className="mobile-drawer-handle-wrap">
          <button
            className="mobile-drawer-toggle"
            onClick={() => setIsMobileRailOpen(v => !v)}
            onTouchStart={handleMobileRailTouchStart}
            onTouchMove={handleMobileRailTouchMove}
            onTouchEnd={handleMobileRailTouchEnd}
            onTouchCancel={handleMobileRailTouchEnd}
            aria-expanded={isMobileRailOpen}
            aria-label={isMobileRailOpen ? 'Collapse mobile controls' : 'Expand mobile controls'}
          >
            <GripHorizontal size={16} />
            {isMobileRailOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {/* Header */}
        <div className="rail-header">
          <div className="rail-brand">
            <div className="brand-icon">
              <MapPin size={15} />
            </div>
            <div>
              <h1 className="brand-title">UW PARKING</h1>
              <p className="brand-sub">Campus Parking Map · Madison</p>
            </div>
          </div>
          <button
            className="icon-btn"
            onClick={() => setIsDarkMode(v => !v)}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        <div className="mobile-panel-switcher" role="tablist" aria-label="Mobile sections">
          <button
            className={`mobile-switch-btn${mobilePanel === 'lots' ? ' active' : ''}`}
            onClick={() => {
              setMobilePanel('lots');
              setIsMobileRailOpen(true);
            }}
            aria-pressed={mobilePanel === 'lots'}
          >
            Lots
          </button>
          <button
            className={`mobile-switch-btn${mobilePanel === 'filters' ? ' active' : ''}`}
            onClick={() => {
              setMobilePanel('filters');
              setIsMobileRailOpen(true);
            }}
            aria-pressed={mobilePanel === 'filters'}
          >
            Filters
          </button>
        </div>

        <div className={`rail-group rail-group-filters${mobilePanel === 'filters' ? ' mobile-active' : ''}`}>
          <div className="rail-section">
            <div className="data-note" role="note">
              <CircleAlert size={14} />
              <span>{feedNote}</span>
            </div>
          </div>

          {/* Availability filter */}
          <div className="rail-section">
            <p className="section-label">Availability</p>
            <div className="toggle-row">
              {ALL_STATUSES.map(s => (
                <button
                  key={s}
                  className={`toggle-chip${statusFilter.has(s) ? ' active' : ''}`}
                  style={statusFilter.has(s) ? { borderColor: AVAILABILITY_COLORS[s], color: AVAILABILITY_COLORS[s] } : {}}
                  onClick={() => toggleStatus(s)}
                >
                  <span className="status-dot" style={{ background: AVAILABILITY_COLORS[s] }} />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Region filter */}
          <div className="rail-section">
            <p className="section-label">Region</p>
            <select
              className="region-select"
              value={regionFilter}
              onChange={e => setRegionFilter(e.target.value as Region | '')}
            >
              <option value="">All Regions</option>
              {ALL_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Legend */}
          <div className="rail-section">
            <p className="section-label">Legend</p>
            <div className="legend-grid">
              <div className="legend-col">
                <div className="legend-row">
                  <TypeIcon type="garage" color="var(--text-secondary)" size={13} />
                  <span>Garage</span>
                </div>
              </div>
              <div className="legend-col">
                {(Object.entries(AVAILABILITY_COLORS) as [AvailabilityStatus, string][]).map(([s, color]) => (
                  <div key={s} className="legend-row">
                    <span className="legend-dot" style={{ background: color }} />
                    <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={`rail-group rail-group-lots${mobilePanel === 'lots' ? ' mobile-active' : ''}`}>
          {/* Search */}
          <div className="rail-section">
            <div className="search-wrap">
              <Search className="search-icon" size={13} />
              <input
                className="search-input"
                placeholder="Search facilities…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Facility list */}
          <div className="rail-list-header">
            <span className="section-label" style={{ margin: 0 }}>
              {filteredFacilities.length} / {facilities.length} facilities
            </span>
            <button
              className="icon-btn"
              onClick={() => void refreshData()}
              disabled={isRefreshing}
              aria-label="Refresh live parking data"
            >
              <RefreshCw size={12} className={isRefreshing ? 'spin' : ''} />
            </button>
          </div>

          <div className="facility-list">
            {filteredFacilities.length === 0 ? (
              <p className="empty-state">No matching facilities.</p>
            ) : (
              filteredFacilities.map(f => (
                <button
                  key={f.id}
                  className={`facility-row${selectedId === f.id ? ' selected' : ''}`}
                  onClick={() => setSelectedId(f.id === selectedId ? null : f.id)}
                >
                  <TypeIcon type={f.type} color={getAvailabilityColor(f.availability)} size={20} />
                  <div className="facility-row-info">
                    <p className="facility-name">{f.name}</p>
                    <p className="facility-meta">{f.region} · {f.code}</p>
                  </div>
                  <div className="facility-row-status" style={{ color: getAvailabilityColor(f.availability) }}>
                    {formatAvailability(f.availability)}
                    {typeof f.availability === 'number' && (
                      <span className="spots-label">spots</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* ── Map ────────────────────────────────────────────────────────────── */}
      <main className="map-main">
        <ParkingMap
          facilities={filteredFacilities}
          selectedId={selectedId}
          isDarkMode={isDarkMode}
          showAvailabilityTooltip
          userLocation={userLocation}
          onSelect={id => setSelectedId(id === selectedId ? null : id)}
        />
      </main>
    </div>
  );
}
