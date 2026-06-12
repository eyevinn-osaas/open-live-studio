import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  // OSC_ removed — secrets (OSC_PAT) are runtime-only via window._env_, never baked into the bundle
  envPrefix: ['OPEN_LIVE_'],
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api/v1': 'http://localhost:8080',
    },
  },
})
