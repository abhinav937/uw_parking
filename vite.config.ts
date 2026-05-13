import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
