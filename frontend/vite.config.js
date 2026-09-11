import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward /voice/* (including WebSockets) → token-server.mjs
      '/voice': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
      // Forward /api/* → FastAPI backend
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
