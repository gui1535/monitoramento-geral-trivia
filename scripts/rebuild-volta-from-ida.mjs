import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const configPaths = [
  path.join(root, 'config-fibra.json'),
  path.join(root, 'data/config-fibra.json'),
  path.join(root, 'public/config-fibra.json'),
  path.join(root, 'docs/config-fibra.json'),
]

function getLinkIda(link) {
  if (!link) return []
  if (Array.isArray(link.ida) && link.ida.length > 0) return link.ida
  return link.derruba ?? []
}

function rebuildVoltaFromIda(network) {
  const links = network.links
    .filter((link) => link?.id)
    .map((link) => {
      const ida = getLinkIda(link)
      const voltaManual = Array.isArray(link.volta) ? [...link.volta] : []
      return {
        ...link,
        ida: [...ida],
        derruba: [...ida],
        volta: voltaManual,
      }
    })

  const byId = new Map(links.map((link) => [link.id, link]))

  for (const link of links) {
    for (const nextId of link.ida) {
      const next = byId.get(nextId)
      if (!next || next.volta.includes(link.id)) continue
      next.volta.push(link.id)
    }
  }

  return { ...network, links }
}

function formatLink(link) {
  const ida = link.ida ?? link.derruba ?? []
  return {
    id: link.id,
    nome: link.nome ?? link.id,
    from: link.from ?? '',
    to: link.to ?? '',
    principal: Boolean(link.principal),
    ida: [...ida],
    volta: [...(link.volta ?? [])],
    derruba: [...ida],
    fim: Boolean(link.fim),
    radios: link.radios ?? { lines: [], textos: [], imgs: [] },
    equipamentosAfetados: link.equipamentosAfetados ?? [],
    observacao: link.observacao ?? '',
  }
}

for (const filePath of configPaths) {
  if (!fs.existsSync(filePath)) {
    console.log(`Ignorado (não existe): ${filePath}`)
    continue
  }

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const rebuilt = rebuildVoltaFromIda(raw)
  const output = {
    nodes: rebuilt.nodes ?? [],
    links: rebuilt.links.map(formatLink),
  }

  fs.writeFileSync(filePath, `${JSON.stringify(output, null, 2)}\n`, 'utf-8')

  const comVolta = output.links.filter((l) => l.volta.length > 0).length
  console.log(`${filePath}: ${comVolta} cabos com volta`)
}
