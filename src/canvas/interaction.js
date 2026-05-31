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
