import { UR_NUMBERS } from './urs'

export const UR_CABLE_ID_PATTERN = /^cabo-ur-\d+$/

/** Padrão operacional: grupos de UR → cabos que, ao caírem, derrubam o btn-ur. */
export const UR_FALL_PATTERN = [
  { urs: [2, 3], cabos: [54, 55] },
  { urs: [4, 5], cabos: [55, 56] },
  { urs: [6, 7], cabos: [57, 58] },
  { urs: [10, 11], cabos: [60, 61] },
  { urs: [12, 13, 14], cabos: [62, 63] },
  { urs: [15, 16], cabos: [63, 64] },
  { urs: [18, 19], cabos: [76, 33] },
  { urs: [20, 21], cabos: [33, 32] },
  { urs: [28, 29], cabos: [40, 41] },
  { urs: [30, 31, 32], cabos: [42, 43] },
  { urs: [33, 34], cabos: [43, 44] },
  { urs: [35, 36], cabos: [44, 45] },
  { urs: [37, 38], cabos: [47, 48] },
  { urs: [39], cabos: [48] },
]

export function buildUrRulesFromPattern() {
  const byUr = new Map()

  UR_FALL_PATTERN.forEach(({ urs, cabos }) => {
    const caboIds = cabos.map((n) => `cabo-${n}`)
    const min = caboIds.length

    urs.forEach((ur) => {
      byUr.set(ur, {
        ur,
        habilitado: true,
        minCabosVermelhos: min,
        cabos: [...caboIds],
      })
    })
  })

  UR_NUMBERS.forEach((ur) => {
    if (!byUr.has(ur)) {
      byUr.set(ur, {
        ur,
        habilitado: false,
        minCabosVermelhos: 2,
        cabos: [],
      })
    }
  })

  return [...byUr.values()].sort((a, b) => a.ur - b.ur)
}

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

  buildUrRulesFromPattern().forEach((rule) => {
    byUr.set(rule.ur, { ...rule })
  })

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
  const patternRule = buildUrRulesFromPattern().find((rule) => rule.ur === ur)
  const base =
    index >= 0
      ? rules[index]
      : (patternRule ??
        createDefaultUrRule(ur, extractUrCableIdsFromNetwork(network)))

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
