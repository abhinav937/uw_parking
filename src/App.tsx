import { useCallback, useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { ParkingMap } from './components/ParkingMap';
import { ParkingDetailCard } from './components/ParkingDetailCard';
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

interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
}

type LocationPermission = 'unknown' | 'granted' | 'prompt' | 'denied';

export default function App() {
  const [facilities, setFacilities] = useState<ParkingFacility[]>(() =>
    stripAvailability(FACILITIES)
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialDarkMode);
  const [feedStatus, setFeedStatus] = useState<FeedStatus>('loading');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationPermission, setLocationPermission] = useState<LocationPermission>('unknown');
  const watchIdRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !isDarkMode);
    document.body.classList.toggle('light-mode', !isDarkMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const startWatchingLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    if (watchIdRef.current !== null) return; // already watching
    watchIdRef.current = navigator.geolocation.watchPosition(
      position => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationPermission('granted');
      },
      error => {
        console.error('Unable to retrieve user location', error);
        if (error.code === error.PERMISSION_DENIED) setLocationPermission('denied');
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 10_000 },
    );
  }, []);

  // On mount: check existing permission state — only start watching if already granted,
  // otherwise wait for an explicit user action so we never cold-prompt on load.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    const cleanup = () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };

    if (!navigator.permissions) {
      // Permissions API not available — fall back to immediate watch (legacy browsers)
      startWatchingLocation();
      return cleanup;
    }

    let permissionStatus: PermissionStatus | null = null;
    navigator.permissions.query({ name: 'geolocation' }).then(status => {
      permissionStatus = status;
      setLocationPermission(status.state as LocationPermission);
      if (status.state === 'granted') startWatchingLocation();

      status.addEventListener('change', () => {
        setLocationPermission(status.state as LocationPermission);
        if (status.state === 'granted') startWatchingLocation();
        if (status.state === 'denied') {
          cleanup();
          setUserLocation(null);
        }
      });
    }).catch(() => {
      // If query fails, fall back to immediate watch
      startWatchingLocation();
    });

    return () => {
      permissionStatus?.removeEventListener('change', () => {});
      cleanup();
    };
  }, [startWatchingLocation]);

  const refreshData = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    try {
      const response = await fetch('/api/uw-parking', {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`API ${response.status}`);
      const payload = await response.json() as LiveParkingResponse;
      setFacilities(applyLiveData(payload));
      setLastUpdated(formatUpdatedTime(payload.fetchedAt));
      setFeedStatus('live');
    } catch {
      setFeedStatus(prev => (prev === 'live' || prev === 'stale') ? 'stale' : 'fallback');
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void refreshData();
    const id = window.setInterval(() => void refreshData(), 60_000);
    return () => window.clearInterval(id);
  }, [refreshData]);

  const feedNote = {
    loading: 'Loading live parking data…',
    live: lastUpdated ? `Updated ${lastUpdated}` : 'Live data',
    stale: lastUpdated ? `Last updated ${lastUpdated}` : 'Feed unavailable',
    fallback: 'Live feed unavailable',
  }[feedStatus];

  const selectedFacility = facilities.find(f => f.id === selectedId) ?? null;

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
          locationPermission={locationPermission}
          onSelect={id => setSelectedId(id === selectedId ? null : id)}
          onRequestLocation={startWatchingLocation}
        />
      </div>

      {/* Ultra-minimal floating overlay — Tesla language */}
      <div className="map-overlay">
        <div className="overlay-brand">
          <div className="overlay-p-badge">P</div>

          <button
            className="icon-btn"
            onClick={() => setIsDarkMode(v => !v)}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {/* Very subtle status — only shows when relevant */}
        <div className="overlay-status" role="note">
          <span>{feedNote}</span>
        </div>
      </div>

      {/* Tesla-style bottom detail card (replaces old popup) */}
      <ParkingDetailCard
        facility={selectedFacility}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
