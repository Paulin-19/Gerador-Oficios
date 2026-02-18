import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    proxy: {
      '/bry-api': {
        target: 'https://fw2.bry.com.br', // ✅ Servidor correto
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/bry-api/, '')
      }
    }
  }
});