import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { PRODUCT_NAME } from '../../packages/shared/src/index';

/** Replaces %PRODUCT_NAME% in index.html so the product name has a single source. */
function productName(): Plugin {
  return {
    name: 'product-name',
    transformIndexHtml: (html) => html.replaceAll('%PRODUCT_NAME%', PRODUCT_NAME),
  };
}

export default defineConfig(({ mode }) => {
  // Same root .env the API reads, so the proxy follows a custom PORT.
  const env = loadEnv(mode, '../..', '');
  const apiPort = env.PORT || '3001';

  return {
    plugins: [react(), productName()],
    server: {
      port: 5173,
      // Only the API talks to Pey; the browser reaches it through this proxy.
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${apiPort}`,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
