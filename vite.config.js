import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2015',
    minify: 'esbuild',
    chunkSizeWarningLimit: 600,
    cssCodeSplit: true,
    sourcemap: false,
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  },
});
