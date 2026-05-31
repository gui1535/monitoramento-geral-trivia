import { FIBER_ID_PATTERN } from './fibers'

const fiberClickHandlers = new WeakMap()

function getSvgScope(svgRoot) {
  return svgRoot instanceof SVGSVGElement
    ? svgRoot
    : svgRoot?.querySelector('svg')
}

export function bindFiberClicks(svgRoot, { enabled = false, onFiberClick } = {}) {
  if (!svgRoot) return

  const scope = getSvgScope(svgRoot)
  if (!scope) return

  scope.querySelectorAll('[id]').forEach((element) => {
    if (!FIBER_ID_PATTERN.test(element.id)) return

    const existingHandler = fiberClickHandlers.get(element)
    if (existingHandler) {
      element.removeEventListener('click', existingHandler)
      fiberClickHandlers.delete(element)
    }

    element.style.pointerEvents = enabled ? 'visibleStroke' : 'none'
    element.style.cursor = enabled ? 'pointer' : 'default'

    if (!enabled) return

    const handler = (event) => {
      event.stopPropagation()
      onFiberClick?.(element.id)
    }

    element.addEventListener('click', handler)
    fiberClickHandlers.set(element, handler)
  })
}
