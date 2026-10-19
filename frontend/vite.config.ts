/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 7300,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:7800',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:7800',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
  },
})
