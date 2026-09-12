import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { cycloneVoicePlugin } from './vite-voice-plugin.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cycloneVoicePlugin()],
  server: {
    proxy: {
      // Forward /api/* → FastAPI backend
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

