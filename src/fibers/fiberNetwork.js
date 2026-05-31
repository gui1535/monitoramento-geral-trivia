import { withBaseUrl } from '../utils/baseUrl'
import { FIBER_ID_PATTERN } from './fibers'

export const FIBER_CONFIG_API = withBaseUrl('api/config-fibra')
export const FIBER_CONFIG_STATIC = withBaseUrl('config-fibra.json')
export const FIBER_CONFIG_FILE_PATH = 'data/config-fibra.json'

export const NODE_TYPES = [
  'equipamento',
  'difusao',
  'caixa',
  'switch',
  'outro',
]

export function createEmptyLink(id) {
  return {
    id,
    nome: id,
    from: '',
    to: '',
    principal: false,
    derruba: [],
    fim: false,
    radios: { lines: [], textos: [], imgs: [] },
    equipamentosAfetados: [],
    observacao: '',
  }
}

export function createEmptyNetwork(fiberIds = []) {
  return {
    nodes: [],
    links: fiberIds.map((id) => createEmptyLink(id)),
  }
}

export function normalizeNetwork(raw, fiberIds = []) {
  const network = {
    nodes: Array.isArray(raw?.nodes) ? [...raw.nodes] : [],
    links: Array.isArray(raw?.links) ? [...raw.links] : [],
  }

  const linkMap = new Map(
    network.links.map((link) => [link.id, { ...createEmptyLink(link.id), ...link }]),
  )

  fiberIds.forEach((id) => {
    if (!linkMap.has(id)) {
      linkMap.set(id, createEmptyLink(id))
    }
  })

  network.links = [...linkMap.values()].sort(
    (a, b) => Number(a.id.replace('cabo-', '')) - Number(b.id.replace('cabo-', '')),
  )

  return network
}

async function fetchConfigJson() {
  try {
    const response = await fetch(FIBER_CONFIG_API)

    if (response.ok) {
      return response.json()
    }
  } catch {
    // API só existe com `npm run dev`; em preview usa o JSON estático.
  }

  const staticResponse = await fetch(FIBER_CONFIG_STATIC)

  if (staticResponse.ok) {
    return staticResponse.json()
  }

  return { nodes: [], links: [] }
}

export async function fetchFiberNetwork(fiberIds = []) {
  try {
    const raw = await fetchConfigJson()
    return normalizeNetwork(raw, fiberIds)
  } catch {
    return createEmptyNetwork(fiberIds)
  }
}

export async function persistFiberNetwork(network) {
  const body = JSON.stringify(network, null, 2)

  try {
    const response = await fetch(FIBER_CONFIG_API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body,
    })

    if (response.ok) {
      return { saved: true, path: FIBER_CONFIG_FILE_PATH }
    }
  } catch {
    // Sem API (build/preview): não grava no disco pelo navegador.
  }

  return { saved: false, path: FIBER_CONFIG_FILE_PATH }
}

export function exportFiberNetwork(network) {
  return JSON.stringify(network, null, 2)
}

export async function importFiberNetwork(jsonText, fiberIds = []) {
  const parsed = JSON.parse(jsonText)
  const network = normalizeNetwork(parsed, fiberIds)
  await persistFiberNetwork(network)
  return network
}

export function getNetworkLink(network, linkId) {
  return network.links.find((link) => link.id === linkId) ?? null
}

export function upsertNetworkNode(network, node) {
  const index = network.nodes.findIndex((item) => item.id === node.id)
  const next = { ...network }

  if (index === -1) {
    next.nodes = [...next.nodes, node]
  } else {
    next.nodes = next.nodes.map((item, i) =>
      i === index ? { ...item, ...node } : item,
    )
  }

  return next
}

export function salvarConfiguracaoCabo(caboId, dadosNovos, network) {
  const index = network.links.findIndex((link) => link.id === caboId)
  if (index === -1) return null

  return {
    ...network,
    links: network.links.map((link) => {
      if (link.id !== caboId) return link

      return {
        ...link,
        id: caboId,
        derruba: Array.isArray(dadosNovos.derruba)
          ? [...new Set(dadosNovos.derruba)]
          : link.derruba ?? [],
        fim: Boolean(dadosNovos.fim),
        radios: dadosNovos.radios
          ? {
              lines: [...new Set(dadosNovos.radios.lines ?? [])],
              textos: [...new Set(dadosNovos.radios.textos ?? [])],
              imgs: [...new Set(dadosNovos.radios.imgs ?? [])],
            }
          : link.radios ?? { lines: [], textos: [], imgs: [] },
      }
    }),
  }
}

function coletarProximaOnda(link, network, processados, afetadosCabos, afetadosNodes) {
  const proximaOnda = []

  if (!link) return proximaOnda

  if (Array.isArray(link.derruba)) {
    link.derruba.forEach((id) => {
      afetadosCabos.add(id)
      if (!processados.has(id)) proximaOnda.push(id)
    })
  }

  if (!link.to) return proximaOnda

  const filaNodes = [link.to]
  const nodesVisitados = new Set()

  while (filaNodes.length > 0) {
    const nodeAtual = filaNodes.shift()
    if (!nodeAtual || nodesVisitados.has(nodeAtual)) continue

    nodesVisitados.add(nodeAtual)
    afetadosNodes.add(nodeAtual)

    network.links
      .filter((item) => item.from === nodeAtual)
      .forEach((prox) => {
        afetadosCabos.add(prox.id)
        if (!processados.has(prox.id)) proximaOnda.push(prox.id)

        if (prox.to && !nodesVisitados.has(prox.to)) {
          filaNodes.push(prox.to)
        }
      })
  }

  return proximaOnda
}

export function calcularQuedaEmCascata(caboRaizIds, network) {
  const afetadosCabos = new Set()
  const afetadosNodes = new Set()
  const ordem = []
  const processados = new Set()
  const fila = [...caboRaizIds]
  const raiz = caboRaizIds.length === 1 ? caboRaizIds[0] : caboRaizIds[0] ?? null

  while (fila.length > 0) {
    const caboId = fila.shift()
    if (!caboId || processados.has(caboId)) continue

    processados.add(caboId)
    afetadosCabos.add(caboId)
    ordem.push(caboId)

    const link = getNetworkLink(network, caboId)
    if (!link) continue

    if (Array.isArray(link.equipamentosAfetados)) {
      link.equipamentosAfetados.forEach((id) => afetadosNodes.add(id))
    }

    if (link.fim) {
      continue
    }

    const proximaOnda = coletarProximaOnda(
      link,
      network,
      processados,
      afetadosCabos,
      afetadosNodes,
    )

    fila.push(...proximaOnda)
  }

  const indicePrimeiroFim = ordem.findIndex(
    (id) => getNetworkLink(network, id)?.fim,
  )

  const ordemCascata =
    indicePrimeiroFim >= 0 ? ordem.slice(0, indicePrimeiroFim + 1) : ordem

  const cabosCascata = new Set(ordemCascata)

  let ordemVolta = []
  let caboFim = null
  let radiosEvidentes = null

  if (indicePrimeiroFim >= 0) {
    caboFim = ordemCascata[indicePrimeiroFim]
    const fimLink = getNetworkLink(network, caboFim)
    radiosEvidentes = fimLink?.radios ?? null
  }

  if (raiz && ordemCascata.length > 1) {
    ordemVolta = [...ordemCascata.slice(1)].reverse()
  }

  return {
    cabos: [...cabosCascata],
    nodes: [...afetadosNodes],
    ordem: ordemCascata,
    ordemVolta,
    raiz,
    caboFim,
    radiosEvidentes,
    cabosFinaisVermelhos: raiz ? [raiz] : [...caboRaizIds],
  }
}

export function getAfetados(caboCaidoId, network) {
  const cabo = getNetworkLink(network, caboCaidoId)
  if (!cabo) {
    return { cabos: [], nodes: [], ordem: [], ordemVolta: [] }
  }

  return calcularQuedaEmCascata([caboCaidoId], network)
}

export function mergeAfetados(results = []) {
  const cabos = new Set()
  const nodes = new Set()
  const ordem = []
  const ordemVolta = []

  results.forEach((result) => {
    result.ordem?.forEach((id) => {
      if (!ordem.includes(id)) ordem.push(id)
    })
    result.ordemVolta?.forEach((id) => {
      if (!ordemVolta.includes(id)) ordemVolta.push(id)
    })
    result.cabos.forEach((id) => cabos.add(id))
    result.nodes.forEach((id) => nodes.add(id))
  })

  return {
    cabos: [...cabos],
    nodes: [...nodes],
    ordem,
    ordemVolta,
    raiz: results[0]?.raiz ?? null,
  }
}

export function getAfetadosMultiplos(caboIds, network) {
  return calcularQuedaEmCascata(caboIds, network)
}

export function extractFiberIdsFromNetwork(network) {
  return network.links.map((link) => link.id).filter((id) => FIBER_ID_PATTERN.test(id))
}

export const EXAMPLE_FIBER_NETWORK = {
  nodes: [
    { id: 'BAS', nome: 'BAS', tipo: 'equipamento' },
    { id: 'PONTO_37', nome: 'Difusão cabo 37', tipo: 'difusao' },
    { id: 'NEC_11_EL_1', nome: 'NEC 11 EL', tipo: 'equipamento' },
    { id: 'SAGEM_11_1', nome: 'SAGEM 11', tipo: 'equipamento' },
    { id: 'SAGEM_11_2', nome: 'SAGEM 11 (2)', tipo: 'equipamento' },
  ],
  links: [
    {
      id: 'cabo-38',
      nome: 'cabo-38',
      from: 'BAS',
      to: 'PONTO_37',
      principal: true,
      derruba: ['cabo-37', 'cabo-61'],
      equipamentosAfetados: [],
      observacao: '',
    },
    {
      id: 'cabo-37',
      nome: 'cabo-37',
      from: 'PONTO_37',
      to: 'NEC_11_EL_1',
      principal: false,
      derruba: [],
      equipamentosAfetados: ['NEC_11_EL_1'],
      observacao: '',
    },
    {
      id: 'cabo-61',
      nome: 'cabo-61',
      from: 'PONTO_37',
      to: 'SAGEM_11_1',
      principal: false,
      derruba: ['cabo-7'],
      equipamentosAfetados: ['SAGEM_11_1'],
      observacao: '',
    },
    {
      id: 'cabo-7',
      nome: 'cabo-7',
      from: 'SAGEM_11_1',
      to: 'SAGEM_11_2',
      principal: false,
      derruba: [],
      equipamentosAfetados: ['SAGEM_11_2'],
      observacao: '',
    },
  ],
}

export async function loadExampleFiberNetwork(fiberIds = []) {
  const network = normalizeNetwork(EXAMPLE_FIBER_NETWORK, fiberIds)
  await persistFiberNetwork(network)
  return network
}
