import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fiberConfigApi } from './vite-plugin-fiber-config.js'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages: https://trivia-monitoramento.github.io/monitoramento/
  base: '/monitoramento/',
  plugins: [react(), fiberConfigApi()],
})
