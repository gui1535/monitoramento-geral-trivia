import { INTERACTION_MODE } from './constants'

export function getCanvasCursor(mode, isPanning) {
  if (mode === INTERACTION_MODE.ACTION) {
    return 'default'
  }

  return isPanning ? 'grabbing' : 'grab'
}

export function computeFitTransform(
  viewportWidth,
  viewportHeight,
  worldWidth,
  worldHeight,
  { minZoom, maxZoom },
) {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return null
  }

  const scale = Math.min(
    viewportWidth / worldWidth,
    viewportHeight / worldHeight,
  )

  const clampedScale = Math.min(maxZoom, Math.max(minZoom, scale))
  const x = (viewportWidth - worldWidth * clampedScale) / 2
  const y = (viewportHeight - worldHeight * clampedScale) / 2

  return { x, y, scale: clampedScale }
}

/** Zoom mantendo o ponto (px no viewport) fixo no mundo. */
export function zoomAtViewportPoint(transform, viewportX, viewportY, nextScale) {
  const worldX = (viewportX - transform.x) / transform.scale
  const worldY = (viewportY - transform.y) / transform.scale

  return {
    x: viewportX - worldX * nextScale,
    y: viewportY - worldY * nextScale,
    scale: nextScale,
  }
}

export function getPointerPairMetrics(pointers, viewportRect) {
  if (pointers.size < 2) return null

  const [first, second] = [...pointers.values()]
  const ax = first.x - viewportRect.left
  const ay = first.y - viewportRect.top
  const bx = second.x - viewportRect.left
  const by = second.y - viewportRect.top

  return {
    distance: Math.hypot(bx - ax, by - ay),
    centerX: (ax + bx) / 2,
    centerY: (ay + by) / 2,
  }
}
