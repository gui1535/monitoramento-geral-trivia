import { withBaseUrl } from '../utils/baseUrl'
import { normalizeUrRules, salvarConfiguracaoUr } from '../urs/urRules'

export { salvarConfiguracaoUr }
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
    ida: [],
    volta: [],
    derruba: [],
    fim: false,
    radios: { lines: [], textos: [], imgs: [] },
    equipamentosAfetados: [],
    observacao: '',
  }
}

export function createEmptyNetwork(fiberIds = [], urCableIds = []) {
  return normalizeNetwork({ nodes: [], links: [], urRules: [] }, fiberIds, urCableIds)
}

export function normalizeNetwork(raw, fiberIds = [], urCableIds = []) {
  const network = {
    nodes: Array.isArray(raw?.nodes) ? [...raw.nodes] : [],
    links: Array.isArray(raw?.links) ? [...raw.links] : [],
    urRules: normalizeUrRules(raw?.urRules, urCableIds),
  }

  const linkMap = new Map(
    network.links
      .filter((link) => link?.id)
      .map((link) => {
        const merged = { ...createEmptyLink(link.id), ...link }
        const ida =
          Array.isArray(merged.ida) && merged.ida.length > 0
            ? merged.ida
            : (merged.derruba ?? [])
        const normalized = {
          ...merged,
          ida: [...ida],
          volta: Array.isArray(merged.volta) ? [...merged.volta] : [],
          derruba: [...ida],
        }
        return [normalized.id, normalized]
      }),
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

/**
 * Complementa `volta` a partir da `ida` (inversa), sem apagar volta já cadastrada manualmente.
 */
export function rebuildVoltaFromIda(network) {
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

export async function fetchFiberNetwork(fiberIds = [], urCableIds = []) {
  try {
    const raw = await fetchConfigJson()
    return normalizeNetwork(raw, fiberIds, urCableIds)
  } catch {
    return createEmptyNetwork(fiberIds, urCableIds)
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

export async function importFiberNetwork(jsonText, fiberIds = [], urCableIds = []) {
  const parsed = JSON.parse(jsonText)
  const network = normalizeNetwork(parsed, fiberIds, urCableIds)
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
      if (!link?.id || link.id !== caboId) return link

      const ida = Array.isArray(dadosNovos.ida)
        ? [...new Set(dadosNovos.ida)]
        : Array.isArray(dadosNovos.derruba)
          ? [...new Set(dadosNovos.derruba)]
          : (link.ida ?? link.derruba ?? [])
      const volta = Array.isArray(dadosNovos.volta)
        ? [...new Set(dadosNovos.volta)]
        : (link.volta ?? [])

      return {
        ...link,
        id: caboId,
        ida,
        volta,
        derruba: ida,
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

function getLinkIda(link) {
  if (!link) return []
  if (Array.isArray(link.ida) && link.ida.length > 0) return link.ida
  return link.derruba ?? []
}

export function getLinkVolta(link) {
  if (!link) return []
  return Array.isArray(link.volta) ? link.volta.filter(Boolean) : []
}

/** Percorre o encadeamento `volta` a partir do cabo fim em direção à origem. */
export function buildCaminhoVoltaPercorrido(caboFim, raiz, network) {
  if (!caboFim || !network || caboFim === raiz) return []

  const caminho = []
  let current = caboFim
  const visitados = new Set([caboFim])

  while (current && current !== raiz) {
    const link = getNetworkLink(network, current)
    const proximo = getLinkVolta(link).find(
      (id) => id && id !== raiz && !visitados.has(id),
    )

    if (!proximo) break

    caminho.push(proximo)
    visitados.add(proximo)
    current = proximo
  }

  return caminho
}

/** Percorre todos os cabos em `volta` (BFS), não só o primeiro da lista. */
export function buildCaminhoVoltaDesdeRaiz(raiz, network) {
  if (!raiz || !network) return []

  const caminho = []
  const visitados = new Set([raiz])
  const fila = getLinkVolta(getNetworkLink(network, raiz)).filter(
    (id) => id && id !== raiz,
  )

  while (fila.length > 0) {
    const caboId = fila.shift()
    if (!caboId || visitados.has(caboId)) continue

    visitados.add(caboId)
    caminho.push(caboId)

    getLinkVolta(getNetworkLink(network, caboId)).forEach((proximo) => {
      if (proximo && proximo !== raiz && !visitados.has(proximo)) {
        fila.push(proximo)
      }
    })
  }

  return caminho
}

/**
 * Caminho de volta na simulação.
 * Com cabos já caídos, usa o retorno desde a origem (ex.: 40 → … → 37).
 */
export function buildCaminhoVoltaCompleto(raiz, caboFim, network, cabosJaEmErro = []) {
  if (!network || !raiz) return []

  if (cabosJaEmErro.length > 0) {
    return buildCaminhoVoltaDesdeRaiz(raiz, network)
  }

  if (caboFim && caboFim !== raiz) {
    const desdeFim = buildCaminhoVoltaPercorrido(caboFim, raiz, network)
    if (desdeFim.length > 0) return desdeFim
  }

  return buildCaminhoVoltaDesdeRaiz(raiz, network)
}

export function buildCaminhoVoltaParaRepintura(raiz, caboFim, network, cabosJaEmErro = []) {
  if (!network || !raiz) return []

  if (caboFim && caboFim !== raiz) {
    const desdeFim = buildCaminhoVoltaPercorrido(caboFim, raiz, network)
    if (desdeFim.length > 0) return desdeFim
  }

  return buildCaminhoVoltaCompleto(raiz, caboFim, network, cabosJaEmErro)
}

function buildOrdemVolta(ordemCascata, network) {
  const raiz = ordemCascata[0]
  const indiceFim = ordemCascata.findIndex(
    (id) => getNetworkLink(network, id)?.fim,
  )
  const caboFim = indiceFim >= 0 ? ordemCascata[indiceFim] : null

  const caminho = buildCaminhoVoltaCompleto(raiz, caboFim, network)
  if (caminho.length > 0) return caminho

  return ordemCascata.length > 1 ? [...ordemCascata.slice(1)].reverse() : []
}

/** Ramificações no hub de volta (ex.: cai o 76 → hub 37 → derruba 35, 36, 75). */
function coletarRamosDoHub(link, network, processados, afetadosCabos, proximaOnda) {
  if (!link) return

  getLinkVolta(link).forEach((hubId) => {
    const hub = getNetworkLink(network, hubId)
    if (!hub) return

    getLinkIda(hub).forEach((branchId) => {
      afetadosCabos.add(branchId)
      if (!processados.has(branchId)) proximaOnda.push(branchId)
    })
  })
}

function coletarProximaOnda(link, network, processados, afetadosCabos, afetadosNodes) {
  const proximaOnda = []

  if (!link) return proximaOnda

  getLinkIda(link).forEach((id) => {
    afetadosCabos.add(id)
    if (!processados.has(id)) proximaOnda.push(id)
  })

  // Cabos em `volta` no JSON = derrubam junto (ex.: 76 → 35, 36, 37, 75)
  getLinkVolta(link).forEach((id) => {
    afetadosCabos.add(id)
    if (!processados.has(id)) proximaOnda.push(id)
  })

  coletarRamosDoHub(link, network, processados, afetadosCabos, proximaOnda)

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

  ordemVolta = buildOrdemVolta(ordemCascata, network)

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
      ida: ['cabo-37', 'cabo-61'],
      volta: [],
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
      ida: ['cabo-7'],
      volta: [],
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
