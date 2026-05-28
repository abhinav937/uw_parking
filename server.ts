import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '127.0.0.1';
const isProduction = process.env.NODE_ENV === 'production';
const modulePath = fileURLToPath(import.meta.url);
const rootDir = path.dirname(modulePath);

async function createApp() {
  console.log('[dev] Starting createApp()...');
  const app = express();
  console.log('[dev] Express app created');

  // Lazy load the parking scraper only when the route is hit
  app.get('/api/uw-parking', async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    try {
      const { UW_PARKING_SOURCE_URL, fetchParkingFacilities } = await import('./lib/uwParking');
      const facilities = await fetchParkingFacilities();
      res.json({
        fetchedAt: new Date().toISOString(),
        sourceUrl: UW_PARKING_SOURCE_URL,
        facilities,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown scrape failure';
      res.status(502).json({
        error: 'Unable to fetch UW parking availability',
        details: message,
      });
    }
  });

  if (isProduction) {
    const distDir = path.join(rootDir, 'dist');
    app.use(express.static(distDir));
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    console.log('[dev] Creating Vite dev server (middleware mode)...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: rootDir,
      server: {
        middlewareMode: true,
        host: HOST,
        // Disable watcher aggressively — VPNs often break chokidar
        watch: {
          ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
          usePolling: false,
        },
        hmr: false,
      },
      appType: 'spa',
    });
    console.log('[dev] Vite dev server created successfully');

    app.use(vite.middlewares);
  }

  console.log('[dev] Starting Express listener...');
  app.listen(PORT, HOST, () => {
    console.log(`UW Parking app listening on http://${HOST}:${PORT}`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  void createApp();
}
