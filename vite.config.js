import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fiberConfigApi } from './vite-plugin-fiber-config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const devIndex = resolve(__dirname, 'index.dev.html')

/** Em dev, a raiz do repo tem index.html de produção; servimos index.dev.html em /. */
function devHtmlEntry() {
  return {
    name: 'dev-html-entry',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const [pathname, search = ''] = (req.url ?? '').split('?')
        if (pathname === '/' || pathname === '/index.html') {
          req.url = `/index.dev.html${search ? `?${search}` : ''}`
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Produção: defina VITE_BASE_PATH no CI (ex.: /monitoramento-geral-trivia/)
  // Dev: http://localhost:5173/
  base: process.env.VITE_BASE_PATH ?? (command === 'serve' ? '/' : '/'),
  plugins: [react(), fiberConfigApi(), command === 'serve' ? devHtmlEntry() : null].filter(
    Boolean,
  ),
  build: {
    rollupOptions: {
      input: devIndex,
    },
  },
}))
