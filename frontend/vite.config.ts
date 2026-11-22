import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config'; // <-- Utiliser vitest/config au lieu de vite

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
