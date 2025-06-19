import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api/netlify': {
        target: 'https://api.netlify.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/netlify/, ''),
        headers: {
          'User-Agent': 'Vite-Proxy-Client'
        }
      }
    }
  }
});
