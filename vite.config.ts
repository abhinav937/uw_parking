import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Precache all build assets; update silently in the background
      workbox: {
        // Cache the app shell aggressively; parking API is always network-only
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            // Mapbox map tiles — cache-first, long TTL (tiles don't change)
            urlPattern: /^https:\/\/[a-z]\.tiles\.mapbox\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapbox-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Mapbox API calls (style, glyphs, sprites) — stale-while-revalidate
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'mapbox-api',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts — cache-first
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // /api/uw-parking is intentionally excluded — always fetched live
        ],
      },
      manifest: {
        name: 'UW Parking',
        short_name: 'UW Parking',
        description: 'Real-time parking availability for UW–Madison garages and lots',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f1720',
        theme_color: '#c5050c',
        orientation: 'portrait-primary',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify — file watching is disabled to prevent flickering during agent edits.
    hmr: process.env.DISABLE_HMR !== 'true',
  },
  build: {
    // Target modern browsers — smaller output, no legacy polyfills.
    target: 'esnext',
    // Split mapbox-gl and react into stable long-cached chunks.
    // App code changes often; vendor chunks stay cached across deploys.
    rollupOptions: {
      output: {
        manualChunks: {
          'mapbox': ['mapbox-gl'],
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
});
