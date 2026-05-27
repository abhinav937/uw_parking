# fix: defer geolocation permission prompt until user interaction

**Date:** 2026-05-27  
**Category:** fix  
**Files:** `src/App.tsx`, `src/components/ParkingMap.tsx`

## Problem

`navigator.geolocation.watchPosition` was called unconditionally on component
mount, which caused the browser's location-permission dialog to appear the
moment the app loaded — before the user had any context about why location
access was needed.

## Solution

- On mount, query `navigator.permissions` for the current `geolocation` state
  instead of calling `watchPosition` directly.
  - **`granted`** — start watching immediately (no dialog, already permitted).
  - **`prompt`** — do nothing; wait for an explicit user action.
  - **`denied`** — do nothing; hide the locate button.
- The locate button (`LocateFixed`) is now visible whenever permission is not
  explicitly denied. Clicking it while location is unknown triggers
  `watchPosition` as a user gesture, which is the only time the browser dialog
  should appear.
- A `change` listener on `PermissionStatus` auto-starts watching if the user
  grants access in browser settings after the page loads.
- Legacy browsers without the Permissions API fall back to the previous
  behaviour (immediate `watchPosition`).

## UX impact

First-time visitors no longer see a cold permission prompt on load or while
typing. The prompt only appears when the user actively clicks "locate me".
Returning visitors who already granted location see their dot appear silently
as before.
