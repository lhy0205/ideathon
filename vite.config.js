import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND = 'https://impurity-richly-bonding.ngrok-free.dev'
const AI_BACKEND = 'https://28c9-203-255-221-68.ngrok-free.app'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': { target: BACKEND, changeOrigin: true },
      '/users': { target: BACKEND, changeOrigin: true },
      '/experiences': { target: BACKEND, changeOrigin: true },
      '/missions': { target: BACKEND, changeOrigin: true },
      '/community': { target: BACKEND, changeOrigin: true },
      '/notifications': { target: BACKEND, changeOrigin: true },
      '/pdf': { target: BACKEND, changeOrigin: true },
      '/ai': { target: AI_BACKEND, changeOrigin: true },
      '/uploads': { target: BACKEND, changeOrigin: true },
    },
  },
})
