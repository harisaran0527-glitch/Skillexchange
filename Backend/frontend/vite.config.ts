import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    watch: {
      usePolling: true,
      interval: 100,
    },
    proxy: {
      // Proxy all /api requests to the Express backend during development
      '/api': {
        target: 'http://127.0.0.1:5005',
        changeOrigin: true,
        secure: false,
      },
      // Proxy socket.io connections
      '/socket.io': {
        target: 'http://127.0.0.1:5005',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  preview: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5005',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5005',
        ws: true,
        changeOrigin: true,
      }
    }
  }
})
