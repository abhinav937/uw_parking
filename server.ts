import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { UW_PARKING_SOURCE_URL, fetchParkingFacilities } from './lib/uwParking';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';
const modulePath = fileURLToPath(import.meta.url);
const rootDir = path.dirname(modulePath);

async function createApp() {
  const app = express();

  app.get('/api/uw-parking', async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    try {
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
    const vite = await createViteServer({
      root: rootDir,
      server: {
        middlewareMode: true,
        host: HOST,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    console.log(`UW Parking app listening on http://${HOST}:${PORT}`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  void createApp();
}
