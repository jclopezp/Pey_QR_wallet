import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Only the API talks to Pey; the browser reaches it through this proxy.
    proxy: {
      '/api': { target: 'http://127.0.0.1:3001', rewrite: (path) => path.replace(/^\/api/, '') },
    },
  },
});
