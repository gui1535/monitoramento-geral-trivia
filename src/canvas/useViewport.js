import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_WHEEL_FACTOR,
} from './constants'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function useViewport() {
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: DEFAULT_ZOOM,
  })
  const [isPanning, setIsPanning] = useState(false)

  const panRef = useRef(null)
  const viewportRef = useRef(null)

  const clampTranslate = useCallback((x, y, scale) => {
    const viewport = viewportRef.current
    if (!viewport) return { x, y }

    const vw = viewport.clientWidth
    const vh = viewport.clientHeight
    const worldW = CANVAS_WIDTH * scale
    const worldH = CANVAS_HEIGHT * scale

    const minX = worldW <= vw ? (vw - worldW) / 2 : vw - worldW
    const maxX = worldW <= vw ? (vw - worldW) / 2 : 0
    const minY = worldH <= vh ? (vh - worldH) / 2 : vh - worldH
    const maxY = worldH <= vh ? (vh - worldH) / 2 : 0

    return {
      x: clamp(x, minX, maxX),
      y: clamp(y, minY, maxY),
    }
  }, [])

  const handlePointerDown = useCallback((event) => {
    if (event.button !== 0) return

    event.currentTarget.setPointerCapture(event.pointerId)
    panRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: transform.x,
      originY: transform.y,
    }
    setIsPanning(true)
  }, [transform.x, transform.y])

  const handlePointerMove = useCallback(
    (event) => {
      const pan = panRef.current
      if (!pan || pan.pointerId !== event.pointerId) return

      const dx = event.clientX - pan.startX
      const dy = event.clientY - pan.startY
      const next = clampTranslate(
        pan.originX + dx,
        pan.originY + dy,
        transform.scale,
      )

      setTransform((prev) => ({ ...prev, x: next.x, y: next.y }))
    },
    [clampTranslate, transform.scale],
  )

  const handlePointerUp = useCallback((event) => {
    const pan = panRef.current
    if (!pan || pan.pointerId !== event.pointerId) return

    panRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
    setIsPanning(false)
  }, [])

  const centerView = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const scale = DEFAULT_ZOOM
    const x = (viewport.clientWidth - CANVAS_WIDTH * scale) / 2
    const y = (viewport.clientHeight - CANVAS_HEIGHT * scale) / 2

    setTransform({ x, y, scale })
  }, [])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    function handleWheel(event) {
      event.preventDefault()

      const rect = viewport.getBoundingClientRect()
      const pointerX = event.clientX - rect.left
      const pointerY = event.clientY - rect.top

      setTransform((prev) => {
        const nextScale = clamp(
          prev.scale * (1 - event.deltaY * ZOOM_WHEEL_FACTOR),
          MIN_ZOOM,
          MAX_ZOOM,
        )

        const worldX = (pointerX - prev.x) / prev.scale
        const worldY = (pointerY - prev.y) / prev.scale

        const rawX = pointerX - worldX * nextScale
        const rawY = pointerY - worldY * nextScale
        const next = clampTranslate(rawX, rawY, nextScale)

        return { x: next.x, y: next.y, scale: nextScale }
      })
    }

    viewport.addEventListener('wheel', handleWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', handleWheel)
  }, [clampTranslate])

  return {
    transform,
    isPanning,
    viewportRef,
    centerView,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
    },
  }
}
