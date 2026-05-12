import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const CONTENT_PAGES = ['privacy', 'terms', 'about', 'how-to-play', 'faq', 'contact']

// Vite's default SPA fallback serves index.html for any non-matched route,
// which means public/<page>/index.html files at directory-style URLs (e.g.
// /privacy/) get shadowed by the root SPA. This plugin serves them directly
// during `vite dev` so the URL structure matches what Vercel serves in prod.
function serveContentPages() {
  return {
    name: 'serve-content-pages',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = (req.url || '').split('?')[0]
        const segment = rawUrl.replace(/^\//, '').replace(/\/$/, '')
        if (CONTENT_PAGES.includes(segment)) {
          const file = path.resolve(__dirname, 'public', segment, 'index.html')
          if (fs.existsSync(file)) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end(fs.readFileSync(file, 'utf-8'))
            return
          }
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), serveContentPages()],
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
