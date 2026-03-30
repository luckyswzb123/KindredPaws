import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      // Proxy /api requests to the Express backend
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${env.PORT || 3001}`,
          changeOrigin: true,
          secure: false,
          // 增加代理调试日志
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('[VITE PROXY ERROR]', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log(`[VITE PROXY REQUEST] ${req.method} ${req.url} -> ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log(`[VITE PROXY RESPONSE] Status: ${proxyRes.statusCode} for ${req.url}`);
            });
          },
        },
      },
    },
  };
});
