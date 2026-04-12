import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// When VITE_API_URL points to Render, skip the local proxy.
// When developing locally (no env override), proxy to localhost:3001.
const localBackend = 'http://localhost:3001'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: process.env.VITE_API_URL ? undefined : {
      '/api': localBackend,
      '/socket.io': { target: localBackend, ws: true },
    },
  },
})
