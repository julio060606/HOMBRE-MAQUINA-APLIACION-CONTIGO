import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
const apiProxy = {
  '/api/v1': { target: 'http://127.0.0.1:8081', changeOrigin: true, timeout: 0, proxyTimeout: 0 },
};
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3001,
    host: '0.0.0.0',
    open: false,
    strictPort: true,
    proxy: apiProxy,
  },
  preview: { port: 3001, host: '0.0.0.0', strictPort: true, proxy: apiProxy },
});
