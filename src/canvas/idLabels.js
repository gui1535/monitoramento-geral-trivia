export const ID_LABELS_LAYER_ID = 'monitoramento-id-labels'

const SVG_NS = 'http://www.w3.org/2000/svg'

function getSvgScope(svgRoot) {
  return svgRoot instanceof SVGSVGElement
    ? svgRoot
    : svgRoot?.querySelector('svg')
}

export function hideElementIdLabels(svgRoot) {
  const scope = getSvgScope(svgRoot)
  scope?.querySelector(`#${CSS.escape(ID_LABELS_LAYER_ID)}`)?.remove()
}

export function showElementIdLabels(svgRoot, { idFilter = () => true } = {}) {
  const scope = getSvgScope(svgRoot)
  if (!scope) return 0

  hideElementIdLabels(scope)

  const layer = document.createElementNS(SVG_NS, 'g')
  layer.id = ID_LABELS_LAYER_ID
  layer.setAttribute('pointer-events', 'none')

  let count = 0

  scope.querySelectorAll('[id]').forEach((element) => {
    if (element.id === ID_LABELS_LAYER_ID) return
    if (element.closest(`#${CSS.escape(ID_LABELS_LAYER_ID)}`)) return
    if (!idFilter(element.id)) return

    let bbox

    try {
      bbox = element.getBBox()
    } catch {
      return
    }

    if (bbox.width === 0 && bbox.height === 0) return

    const text = document.createElementNS(SVG_NS, 'text')
    const cx = bbox.x + bbox.width / 2
    const cy = bbox.y + bbox.height / 2

    text.setAttribute('x', String(cx))
    text.setAttribute('y', String(cy))
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('dominant-baseline', 'middle')
    text.setAttribute('font-size', '11')
    text.setAttribute('font-family', 'system-ui, sans-serif')
    text.setAttribute('font-weight', '600')
    text.setAttribute('fill', '#12141a')
    text.setAttribute('stroke', '#ffffff')
    text.setAttribute('stroke-width', '3')
    text.setAttribute('paint-order', 'stroke')
    text.setAttribute('pointer-events', 'none')
    text.textContent = element.id

    layer.appendChild(text)
    count += 1
  })

  scope.appendChild(layer)
  return count
}
