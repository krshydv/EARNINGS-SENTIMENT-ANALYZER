import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || /[\\/]react([\\/]|$)/.test(id) || id.includes('scheduler') || id.includes('react-is') || id.includes('use-sync-external-store')) {
              return 'react-vendor'
            }
            if (id.includes('framer-motion')) {
              return 'motion-vendor'
            }
            if (id.includes('recharts') || id.includes('d3') || id.includes('victory')) {
              return 'charts-vendor'
            }
          }
        }
      },
    },
  },
})
