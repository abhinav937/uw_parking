import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleAlert, MapPin, Moon, RefreshCw, Search, Sun, X } from 'lucide-react';
import { ParkingMap } from './components/ParkingMap';
import { FACILITIES } from './constants';
import {
  AVAILABILITY_COLORS,
  FACILITY_TYPE_LABELS,
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

  useEffect(() => {
    document.body.classList.toggle('light-mode', !isDarkMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

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

  const selectedFacility = filteredFacilities.find(f => f.id === selectedId) ?? null;

  // Clear selection when the selected facility is filtered out
  useEffect(() => {
    if (selectedId !== null && !filteredFacilities.find(f => f.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredFacilities, selectedId]);

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

  const feedNote = {
    loading: 'Loading live visitor parking availability from UW Transportation Services.',
    live: 'Live visitor parking availability from UW Transportation Services.',
    stale: 'Live feed refresh failed. Showing the last successful UW Transportation snapshot.',
    fallback: 'Live feed unavailable. Availability is hidden until UW Transportation responds.',
  }[feedStatus];

  return (
    <div className="app-shell">
      {/* ── Left rail ──────────────────────────────────────────────────────── */}
      <aside className="left-rail">

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

        <div className="rail-section">
          <div className="data-note" role="note">
            <CircleAlert size={14} />
            <span>{feedNote}</span>
          </div>
        </div>

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
      </aside>

      {/* ── Map ────────────────────────────────────────────────────────────── */}
      <main className="map-main">
        <ParkingMap
          facilities={filteredFacilities}
          selectedId={selectedId}
          isDarkMode={isDarkMode}
          onSelect={id => setSelectedId(id === selectedId ? null : id)}
        />
      </main>

      {/* ── Detail panel ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedFacility && (
          <motion.aside
            className="detail-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 38 }}
          >
            <div className="detail-header">
              <div style={{ minWidth: 0 }}>
                <span className="detail-type-badge">{FACILITY_TYPE_LABELS[selectedFacility.type]}</span>
                <h2 className="detail-name">{selectedFacility.name}</h2>
              </div>
              <button className="icon-btn" style={{ flexShrink: 0 }} onClick={() => setSelectedId(null)} aria-label="Close">
                <X size={15} />
              </button>
            </div>

            <div className="detail-body">
              <div className="detail-availability" style={{ color: getAvailabilityColor(selectedFacility.availability) }}>
                <span className="detail-avail-num">
                  {formatAvailability(selectedFacility.availability)}
                </span>
                <span className="detail-avail-label">
                  {typeof selectedFacility.availability === 'number'
                    ? 'spots available'
                    : selectedFacility.availability === null
                      ? 'live data unavailable'
                      : 'status'}
                </span>
              </div>

              <div className="detail-meta-grid">
                <div className="detail-meta-row">
                  <span className="detail-meta-key">Lot code</span>
                  <span className="detail-meta-val">{selectedFacility.code}</span>
                </div>
                <div className="detail-meta-row">
                  <span className="detail-meta-key">Type</span>
                  <span className="detail-meta-val">{FACILITY_TYPE_LABELS[selectedFacility.type]}</span>
                </div>
                <div className="detail-meta-row">
                  <span className="detail-meta-key">Region</span>
                  <span className="detail-meta-val">{selectedFacility.region}</span>
                </div>
                <div className="detail-meta-row">
                  <span className="detail-meta-key">Address</span>
                  <span className="detail-meta-val">{selectedFacility.address}</span>
                </div>
                <div className="detail-meta-row">
                  <span className="detail-meta-key">Geometry</span>
                  <span className="detail-meta-val">
                    {selectedFacility.geometry ? 'Verified footprint' : 'Centroid only'}
                  </span>
                </div>
                <div className="detail-meta-row">
                  <span className="detail-meta-key">Data source</span>
                  <span className="detail-meta-val">
                    {feedStatus === 'fallback' ? 'Unavailable' : 'UW Transportation Services'}
                  </span>
                </div>
                <div className="detail-meta-row">
                  <span className="detail-meta-key">Updated</span>
                  <span className="detail-meta-val">{lastUpdated ?? 'Unavailable'}</span>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
