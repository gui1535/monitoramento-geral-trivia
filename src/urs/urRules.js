import { UR_NUMBERS } from './urs'

export const UR_CABLE_ID_PATTERN = /^cabo-ur-\d+$/

export function getUrCableId(urNumber) {
  return `cabo-ur-${urNumber}`
}

export function extractUrCableIdsFromSvg(svgRoot) {
  const scope =
    svgRoot instanceof SVGSVGElement ? svgRoot : svgRoot?.querySelector('svg')
  if (!scope) return []

  const ids = []
  scope.querySelectorAll('[id]').forEach((element) => {
    if (UR_CABLE_ID_PATTERN.test(element.id)) {
      ids.push(element.id)
    }
  })

  return ids.sort(
    (a, b) =>
      Number(a.replace('cabo-ur-', '')) - Number(b.replace('cabo-ur-', '')),
  )
}

export function createDefaultUrRule(urNumber, availableCableIds = []) {
  const own = getUrCableId(urNumber)
  const prev = getUrCableId(urNumber - 1)
  const cabos = []

  if (availableCableIds.includes(prev)) cabos.push(prev)
  if (availableCableIds.includes(own) && !cabos.includes(own)) cabos.push(own)

  return {
    ur: urNumber,
    habilitado: false,
    minCabosVermelhos: 2,
    cabos,
  }
}

export function normalizeUrRules(rawRules, urCableIds = []) {
  const byUr = new Map()

  if (Array.isArray(rawRules)) {
    rawRules.forEach((rule) => {
      const ur = Number(rule?.ur)
      if (!Number.isFinite(ur) || ur < 1) return
      byUr.set(ur, normalizeSingleUrRule(rule, urCableIds))
    })
  }

  UR_NUMBERS.forEach((urNumber) => {
    if (!byUr.has(urNumber)) {
      byUr.set(urNumber, createDefaultUrRule(urNumber, urCableIds))
    }
  })

  return [...byUr.values()].sort((a, b) => a.ur - b.ur)
}

function normalizeSingleUrRule(rule, urCableIds) {
  const ur = Number(rule.ur)
  const cabos = Array.isArray(rule.cabos)
    ? [...new Set(rule.cabos.filter(Boolean))]
    : []

  return {
    ur,
    habilitado: Boolean(rule.habilitado),
    minCabosVermelhos: Math.max(1, Number(rule.minCabosVermelhos) || 2),
    cabos,
  }
}

export function getUrRuleFromNetwork(network, urNumber) {
  return network?.urRules?.find((rule) => rule.ur === urNumber) ?? null
}

/** URs cuja regra foi atingida (cabos vermelhos >= limite). */
export function evaluateUrFallsFromRedFibers(vermelhos, urRules = []) {
  const vermelhoSet = vermelhos instanceof Set ? vermelhos : new Set(vermelhos)
  const fallen = []

  urRules.forEach((rule) => {
    if (!rule?.habilitado) return

    const min = Math.max(1, rule.minCabosVermelhos ?? 2)
    const monitorados = rule.cabos ?? []
    const count = monitorados.filter((id) => vermelhoSet.has(id)).length

    if (count >= min) {
      fallen.push(rule.ur)
    }
  })

  return fallen
}

export function salvarConfiguracaoUr(urNumber, dadosNovos, network) {
  const ur = Number(urNumber)
  if (!Number.isFinite(ur)) return null

  const rules = Array.isArray(network.urRules) ? [...network.urRules] : []
  const index = rules.findIndex((rule) => rule.ur === ur)
  const base =
    index >= 0
      ? rules[index]
      : createDefaultUrRule(ur, extractUrCableIdsFromNetwork(network))

  const nextRule = {
    ...base,
    ur,
    habilitado: Boolean(dadosNovos.habilitado),
    minCabosVermelhos: Math.max(
      1,
      Number(dadosNovos.minCabosVermelhos) || base.minCabosVermelhos || 2,
    ),
    cabos: Array.isArray(dadosNovos.cabos)
      ? [...new Set(dadosNovos.cabos)]
      : base.cabos,
  }

  if (index >= 0) {
    rules[index] = nextRule
  } else {
    rules.push(nextRule)
  }

  rules.sort((a, b) => a.ur - b.ur)

  return { ...network, urRules: rules }
}

function extractUrCableIdsFromNetwork(network) {
  const fromRules = (network.urRules ?? []).flatMap((rule) => rule.cabos ?? [])
  return [...new Set(fromRules.filter((id) => UR_CABLE_ID_PATTERN.test(id)))]
}
