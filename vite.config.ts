import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.DEV_API_PROXY_TARGET?.trim() || 'http://localhost:4000';

  return {
    plugins: [react()],
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          configure(proxy) {
            proxy.on('proxyReq', proxyRequest => {
              // Local QA can target Render without weakening production CORS.
              proxyRequest.removeHeader('origin');
            });
          },
        },
      },
    },
  };
});
