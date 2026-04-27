# UW Parking

Campus parking map for UW-Madison with lot search and verified building highlights for mapped parking structures.

## Run locally

Prerequisites: Node.js 20+

1. Install dependencies:
   `npm install`
2. Create `.env` with your MapTiler key:
   `VITE_MAPTILER_KEY=your_maptiler_key`
3. Start the app:
   `npm run dev`

## Deploy to Vercel

- Set the framework preset to `Vite` if Vercel does not auto-detect it.
- Set the build command to `npm run build`.
- Set the output directory to `dist`.
- Add `VITE_MAPTILER_KEY` as an environment variable in Vercel.
- The live parking scrape is served by the Vercel function at `/api/uw-parking`.

## Notes

- The map requires `VITE_MAPTILER_KEY`.
- The UI fetches live visitor parking availability from UW Transportation Services through a local `/api/uw-parking` scrape endpoint.
- If the UW source is unavailable, the app falls back to the bundled seed dataset.
- Only parking structures with verified polygon data are highlighted as building footprints.
- Underground-only garages without a mapped polygon remain point markers until more geometry is provided.
