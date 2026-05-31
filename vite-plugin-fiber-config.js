import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONFIG_PATH = path.resolve(__dirname, 'data/config-fibra.json')
const PUBLIC_CONFIG_PATH = path.resolve(__dirname, 'public/config-fibra.json')
const API_PATH = '/api/config-fibra'

function readConfigFile() {
  try {
    return fs.readFileSync(CONFIG_PATH, 'utf-8')
  } catch {
    return JSON.stringify({ nodes: [], links: [] }, null, 2)
  }
}

function writeConfigFile(body) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true })
  const parsed = JSON.parse(body)
  const formatted = `${JSON.stringify(parsed, null, 2)}\n`
  fs.writeFileSync(CONFIG_PATH, formatted, 'utf-8')
  fs.writeFileSync(PUBLIC_CONFIG_PATH, formatted, 'utf-8')
  return formatted
}

export function fiberConfigApi() {
  return {
    name: 'fiber-config-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]

        if (url !== API_PATH) {
          next()
          return
        }

        if (req.method === 'GET') {
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(readConfigFile())
          return
        }

        if (req.method === 'PUT' || req.method === 'POST') {
          let body = ''

          req.on('data', (chunk) => {
            body += chunk
          })

          req.on('end', () => {
            try {
              writeConfigFile(body)
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, path: 'data/config-fibra.json' }))
            } catch (error) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: false, error: error.message }))
            }
          })

          return
        }

        next()
      })
    },
  }
}
