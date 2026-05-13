import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/users': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/experiences': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/missions': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/community': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/notifications': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/pdf': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/uploads': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
})
