import { FIBER_STATUS, FIBER_STATUS_COLORS, normalizeCableId } from './fibers'

export const FIBER_FALL_CLASS = 'fibra-caida'
export const FIBER_REAL_FALL_CLASS = 'fibra-queda-real'
export const NODE_OFFLINE_CLASS = 'equipamento-sem-comunicacao'

const FIBER_ALERT_CLASSES = [FIBER_FALL_CLASS, FIBER_REAL_FALL_CLASS]

function getSvgScope(svgRoot) {
  return svgRoot instanceof SVGSVGElement
    ? svgRoot
    : svgRoot?.querySelector('svg')
}

function getElementById(svgRoot, id) {
  const scope = getSvgScope(svgRoot)
  if (!scope || !id) return null

  return scope.querySelector(`#${CSS.escape(id)}`)
}

function storeOriginalNodePresentation(element) {
  if (element.dataset.originalOpacity === undefined) {
    element.dataset.originalOpacity = element.style.opacity || ''
  }
  if (element.dataset.originalFilter === undefined) {
    element.dataset.originalFilter = element.style.filter || ''
  }
}

export function collectFibersRealFall(svgRoot) {
  const scope = getSvgScope(svgRoot)
  if (!scope) return []

  const ids = []
  scope.querySelectorAll(`.${FIBER_REAL_FALL_CLASS}`).forEach((element) => {
    if (element.id) ids.push(element.id)
  })

  return ids
}

/** Cabos em alerta (trecho afetado ou queda real). */
export function collectFibersInAlert(svgRoot) {
  const scope = getSvgScope(svgRoot)
  if (!scope) return []

  const ids = []
  FIBER_ALERT_CLASSES.forEach((className) => {
    scope.querySelectorAll(`.${className}`).forEach((element) => {
      if (element.id) ids.push(element.id)
    })
  })

  return [...new Set(ids)]
}

export function applyFiberFailureVisual(svgRoot, { cabos = [], nodes = [] } = {}) {
  if (!svgRoot) return

  cabos.forEach((fiberId) => {
    const element = getElementById(svgRoot, normalizeCableId(fiberId))
    if (!element) return

    if (!element.dataset.originalStroke) {
      element.dataset.originalStroke = element.getAttribute('stroke') || ''
    }

    element.classList.add(FIBER_FALL_CLASS)
    element.setAttribute('stroke', FIBER_STATUS_COLORS[FIBER_STATUS.ALERT])
    element.style.setProperty('stroke', FIBER_STATUS_COLORS[FIBER_STATUS.ALERT], 'important')
  })

  nodes.forEach((nodeId) => {
    const element = getElementById(svgRoot, nodeId)
    if (!element) return

    storeOriginalNodePresentation(element)
    element.classList.add(NODE_OFFLINE_CLASS)
  })
}

export function clearFiberFailureVisual(svgRoot, { cabos = [], nodes = [] } = {}) {
  if (!svgRoot) return

  const scope = getSvgScope(svgRoot)

  FIBER_ALERT_CLASSES.forEach((className) => {
    scope?.querySelectorAll(`.${className}`).forEach((element) => {
      element.classList.remove(className)

      const original = element.dataset.originalStroke
      if (original) {
        element.setAttribute('stroke', original)
        element.style.setProperty('stroke', original, 'important')
      }
    })
  })

  if (nodes.length > 0) {
    nodes.forEach((nodeId) => {
      const element = getElementById(svgRoot, nodeId)
      if (!element) return

      element.classList.remove(NODE_OFFLINE_CLASS)

      if (element.dataset.originalOpacity !== undefined) {
        element.style.opacity = element.dataset.originalOpacity
      } else {
        element.style.removeProperty('opacity')
      }

      if (element.dataset.originalFilter !== undefined) {
        element.style.filter = element.dataset.originalFilter
      } else {
        element.style.removeProperty('filter')
      }
    })
  } else {
    scope?.querySelectorAll(`.${NODE_OFFLINE_CLASS}`).forEach((element) => {
      element.classList.remove(NODE_OFFLINE_CLASS)
      element.style.removeProperty('opacity')
      element.style.removeProperty('filter')
    })
  }
}
