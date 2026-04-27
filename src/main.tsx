import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import type { LiveParkingResponse } from './liveData';
import './index.css';

async function prefetchLiveParking(): Promise<LiveParkingResponse | null> {
  try {
    const response = await fetch('/api/uw-parking', {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return null;
    return await response.json() as LiveParkingResponse;
  } catch (error) {
    console.error('Initial parking prefetch failed', error);
    return null;
  }
}

async function main() {
  const initialPayload = await prefetchLiveParking();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App initialPayload={initialPayload} />
    </StrictMode>,
  );
}

void main();
