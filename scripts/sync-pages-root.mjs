import { cp, rm, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')

const rootFiles = [
  'index.html',
  '404.html',
  'favicon.svg',
  'icon_energia.png',
  'config-fibra.json',
  'esquema-gerencia.svg',
  'logotipo-azul.png',
  'logotipo-branco.png',
  '.nojekyll',
]

await mkdir(dist, { recursive: true }).catch(() => {})

for (const file of rootFiles) {
  await cp(resolve(dist, file), resolve(root, file), { force: true }).catch(() => {})
}

await rm(resolve(root, 'assets'), { recursive: true, force: true })
await cp(resolve(dist, 'assets'), resolve(root, 'assets'), { recursive: true, force: true })

console.log('Raiz do repo atualizada com o build (GitHub Pages em main /).')
