import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Allow docker-compose / CI to point the dev proxy at a non-localhost worker.
const workerTarget = process.env.VITE_WORKER_URL ?? 'http://127.0.0.1:8787';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: workerTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});
