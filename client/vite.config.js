import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/'))   return 'react-vendor'
            if (id.includes('framer-motion'))                         return 'motion-vendor'
            if (id.includes('socket.io-client') || id.includes('engine.io-client')) return 'socket-vendor'
            if (id.includes('leaflet'))                               return 'leaflet-vendor'
            if (id.includes('react-icons'))                           return 'icons-vendor'
          }
        },
      },
    },
  },
})
