import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Bind to all interfaces and accept any Host header so the hosted web
// preview proxy can reach the dev server (it forwards a non-localhost host).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
})
