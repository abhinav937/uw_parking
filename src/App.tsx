import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleAlert, MapPin, Moon, Sun } from 'lucide-react';
import { ParkingMap } from './components/ParkingMap';
import { FACILITIES } from './constants';
import type { LiveParkingResponse } from './liveData';
import type { ParkingFacility } from './types';

const THEME_STORAGE_KEY = 'uw-parking-theme';
type FeedStatus = 'loading' | 'live' | 'stale' | 'fallback';

function stripAvailability(facilities: ParkingFacility[]): ParkingFacility[] {
  return facilities.map(facility => ({ ...facility, availability: null }));
}

function applyLiveData(payload: LiveParkingResponse): ParkingFacility[] {
  const facilitiesByCode = new Map(payload.facilities.map(f => [f.code, f]));
  return FACILITIES.map(facility => {
    const live = facilitiesByCode.get(facility.code);
    return live ? { ...facility, availability: live.availability } : { ...facility, availability: null };
  });
}

function formatUpdatedTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString();
}

function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light') return false;
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

export default function App({ initialPayload = null }: AppProps) {
  const [facilities, setFacilities] = useState<ParkingFacility[]>(() =>
    initialPayload ? applyLiveData(initialPayload) : stripAvailability(FACILITIES)
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialDarkMode);
  const [feedStatus, setFeedStatus] = useState<FeedStatus>(initialPayload ? 'live' : 'loading');
  const [lastUpdated, setLastUpdated] = useState<string | null>(
    initialPayload ? formatUpdatedTime(initialPayload.fetchedAt) : null
  );
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !isDarkMode);
    document.body.classList.toggle('light-mode', !isDarkMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      position => setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }),
      error => console.error('Unable to retrieve user location', error),
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 10_000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const refreshData = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    try {
      const response = await fetch('/api/uw-parking');
      if (!response.ok) throw new Error(`API ${response.status}`);
      const payload = await response.json() as LiveParkingResponse;
      setFacilities(applyLiveData(payload));
      setLastUpdated(formatUpdatedTime(payload.fetchedAt));
      setFeedStatus('live');
    } catch {
      setFeedStatus(lastUpdated ? 'stale' : 'fallback');
      if (!lastUpdated) setFacilities(stripAvailability(FACILITIES));
    } finally {
      isRefreshingRef.current = false;
    }
  }, [lastUpdated]);

  useEffect(() => {
    if (!initialPayload) void refreshData();
    const id = window.setInterval(() => void refreshData(), 60_000);
    return () => window.clearInterval(id);
  }, [initialPayload, refreshData]);

  const feedNote = {
    loading: 'Loading live parking data…',
    live: lastUpdated ? `Updated ${lastUpdated}` : 'Live data',
    stale: `Last updated ${lastUpdated}`,
    fallback: 'Live feed unavailable',
  }[feedStatus];

  return (
    <div className="app-shell">
      {/* Full-screen map */}
      <div className="map-main">
        <ParkingMap
          facilities={facilities}
          selectedId={selectedId}
          isDarkMode={isDarkMode}
          showAvailabilityTooltip
          userLocation={userLocation}
          onSelect={id => setSelectedId(id === selectedId ? null : id)}
        />
      </div>

      {/* Minimal floating overlay */}
      <div className="map-overlay">
        <div className="overlay-brand">
          <div className="overlay-icon">
            <MapPin size={13} />
          </div>
          <span className="overlay-title">UW PARKING</span>
          <button
            className="icon-btn"
            onClick={() => setIsDarkMode(v => !v)}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
        <div className="overlay-status" role="note">
          <CircleAlert size={12} />
          <span>{feedNote}</span>
        </div>
      </div>
    </div>
  );
}
