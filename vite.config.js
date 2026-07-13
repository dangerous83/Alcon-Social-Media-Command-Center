import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base: './'` on build emits relative asset paths so the app works under any
// subpath — e.g. a GitHub Pages project URL like /Alcon-Social-Media-Command-Center/.
// Dev stays at '/' so the hosted preview proxy can reach the server.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
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
}))
