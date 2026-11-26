import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
    hmr: false,
    watch: {
      ignored: ['**/dist/**']
    }
  }
});
