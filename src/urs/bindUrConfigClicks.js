import { getUrButtonId } from './urs'

const urClickHandlers = new WeakMap()

function getSvgScope(svgRoot) {
  return svgRoot instanceof SVGSVGElement
    ? svgRoot
    : svgRoot?.querySelector('svg')
}

export function bindUrConfigClicks(svgRoot, { enabled = false, onUrClick } = {}) {
  if (!svgRoot) return

  const scope = getSvgScope(svgRoot)
  if (!scope) return

  for (let ur = 1; ur <= 39; ur += 1) {
    const group = scope.querySelector(`#${CSS.escape(getUrButtonId(ur))}`)
    if (!group) continue

    const existingHandler = urClickHandlers.get(group)
    if (existingHandler) {
      group.removeEventListener('click', existingHandler)
      urClickHandlers.delete(group)
    }

    if (!enabled) continue

    group.style.pointerEvents = 'auto'
    group.style.cursor = 'pointer'

    group.querySelectorAll('rect').forEach((rect) => {
      rect.style.pointerEvents = 'auto'
      rect.style.cursor = 'pointer'
    })

    const handler = (event) => {
      event.stopPropagation()
      event.preventDefault()
      onUrClick?.(ur)
    }

    group.addEventListener('click', handler)
    urClickHandlers.set(group, handler)
  }
}
