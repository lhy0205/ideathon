import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND = process.env.VITE_API_URL || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    proxy: {
      '/auth': { target: BACKEND, changeOrigin: true },
      '/users': { target: BACKEND, changeOrigin: true },
      '/experiences': { target: BACKEND, changeOrigin: true },
      '/missions': { target: BACKEND, changeOrigin: true },
      '/community': { target: BACKEND, changeOrigin: true },
      '/notifications': { target: BACKEND, changeOrigin: true },
      '/pdf': { target: BACKEND, changeOrigin: true },
      '/ai': { target: BACKEND, changeOrigin: true },
      '/uploads': { target: BACKEND, changeOrigin: true },
      '/senior-personas': { target: BACKEND, changeOrigin: true },
      '/certifications': { target: BACKEND, changeOrigin: true },
      '/cert-proofs': { target: BACKEND, changeOrigin: true },
      '/report-settings': { target: BACKEND, changeOrigin: true },
      '/survival/': { target: BACKEND, changeOrigin: true },
    },
  },
})
