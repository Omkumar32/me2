import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      ignored: ['**/config.json']
    },
    proxy: {
      '/api': 'http://127.0.0.1:3000',
      '/admin': 'http://127.0.0.1:3000',
    },
  },
});
