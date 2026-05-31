import { FIBER_STATUS, FIBER_STATUS_COLORS, normalizeFiberId } from './fibers'

export const FIBER_FALL_CLASS = 'fibra-caida'
export const NODE_OFFLINE_CLASS = 'equipamento-sem-comunicacao'

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

export function collectFibersInAlert(svgRoot) {
  const scope = getSvgScope(svgRoot)
  if (!scope) return []

  const ids = []
  scope.querySelectorAll(`.${FIBER_FALL_CLASS}`).forEach((element) => {
    if (element.id) ids.push(element.id)
  })

  return ids
}

export function applyFiberFailureVisual(svgRoot, { cabos = [], nodes = [] } = {}) {
  if (!svgRoot) return

  cabos.forEach((fiberId) => {
    const element = getElementById(svgRoot, normalizeFiberId(fiberId))
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

  scope?.querySelectorAll(`.${FIBER_FALL_CLASS}`).forEach((element) => {
    element.classList.remove(FIBER_FALL_CLASS)

    const original = element.dataset.originalStroke
    if (original) {
      element.setAttribute('stroke', original)
      element.style.setProperty('stroke', original, 'important')
    }
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
