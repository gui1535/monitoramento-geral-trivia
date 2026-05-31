import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  INTERACTION_MODE,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_WHEEL_FACTOR,
} from './constants'
import {
  computeFitTransform,
  getPointerPairMetrics,
  zoomAtViewportPoint,
} from './interaction'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function useViewport(mode = INTERACTION_MODE.NAVIGATION) {
  const modeRef = useRef(mode)
  modeRef.current = mode

  const isNavigation = mode === INTERACTION_MODE.NAVIGATION

  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
  })
  const [isPanning, setIsPanning] = useState(false)

  const transformRef = useRef(transform)
  transformRef.current = transform

  const pointersRef = useRef(new Map())
  const panRef = useRef(null)
  const pinchRef = useRef(null)
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

  const applyTransform = useCallback(
    (next) => {
      const clamped = clampTranslate(next.x, next.y, next.scale)
      setTransform({ x: clamped.x, y: clamped.y, scale: next.scale })
    },
    [clampTranslate],
  )

  const fitToViewport = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const next = computeFitTransform(
      viewport.clientWidth,
      viewport.clientHeight,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      { minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM },
    )

    if (next) {
      setTransform(next)
    }
  }, [])

  const clearInteraction = useCallback(() => {
    pointersRef.current.clear()
    panRef.current = null
    pinchRef.current = null
    setIsPanning(false)
  }, [])

  const beginPinch = useCallback((viewport) => {
    const rect = viewport.getBoundingClientRect()
    const metrics = getPointerPairMetrics(pointersRef.current, rect)
    if (!metrics || metrics.distance < 2) return

    panRef.current = null
    setIsPanning(false)

    pinchRef.current = {
      startDistance: metrics.distance,
      startCenterX: metrics.centerX,
      startCenterY: metrics.centerY,
      startTransform: { ...transformRef.current },
    }
  }, [])

  const handlePointerDown = useCallback(
    (event) => {
      if (modeRef.current !== INTERACTION_MODE.NAVIGATION) return
      if (event.pointerType === 'mouse' && event.button !== 0) return

      event.preventDefault()

      const viewport = viewportRef.current
      if (!viewport) return

      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      })

      if (pointersRef.current.size === 1) {
        pinchRef.current = null
        panRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          originX: transformRef.current.x,
          originY: transformRef.current.y,
        }
        setIsPanning(true)
        return
      }

      if (pointersRef.current.size === 2) {
        beginPinch(viewport)
      }
    },
    [beginPinch],
  )

  const handlePointerMove = useCallback(
    (event) => {
      if (modeRef.current !== INTERACTION_MODE.NAVIGATION) return
      if (!pointersRef.current.has(event.pointerId)) return

      event.preventDefault()

      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      })

      const viewport = viewportRef.current
      if (!viewport) return

      if (pointersRef.current.size >= 2) {
        if (!pinchRef.current) {
          beginPinch(viewport)
        }

        const pinch = pinchRef.current
        if (!pinch) return

        const rect = viewport.getBoundingClientRect()
        const metrics = getPointerPairMetrics(pointersRef.current, rect)
        if (!metrics || metrics.distance < 2) return

        const nextScale = clamp(
          pinch.startTransform.scale *
            (metrics.distance / pinch.startDistance),
          MIN_ZOOM,
          MAX_ZOOM,
        )

        const zoomed = zoomAtViewportPoint(
          pinch.startTransform,
          metrics.centerX,
          metrics.centerY,
          nextScale,
        )

        const panDx = metrics.centerX - pinch.startCenterX
        const panDy = metrics.centerY - pinch.startCenterY

        applyTransform({
          x: zoomed.x + panDx,
          y: zoomed.y + panDy,
          scale: nextScale,
        })
        return
      }

      const pan = panRef.current
      if (!pan || pan.pointerId !== event.pointerId) return

      const dx = event.clientX - pan.startX
      const dy = event.clientY - pan.startY
      const next = clampTranslate(
        pan.originX + dx,
        pan.originY + dy,
        transformRef.current.scale,
      )

      setTransform((prev) => ({ ...prev, x: next.x, y: next.y }))
    },
    [applyTransform, beginPinch, clampTranslate],
  )

  const handlePointerUp = useCallback((event) => {
    pointersRef.current.delete(event.pointerId)

    const pan = panRef.current
    if (pan?.pointerId === event.pointerId) {
      panRef.current = null
      setIsPanning(false)
    }

    if (pointersRef.current.size < 2) {
      pinchRef.current = null
    }

    if (pointersRef.current.size === 1) {
      const [remainingId, remaining] = [...pointersRef.current.entries()][0]
      panRef.current = {
        pointerId: remainingId,
        startX: remaining.x,
        startY: remaining.y,
        originX: transformRef.current.x,
        originY: transformRef.current.y,
      }
      setIsPanning(true)
      return
    }

    if (pointersRef.current.size === 0) {
      panRef.current = null
      pinchRef.current = null
      setIsPanning(false)
    }
  }, [])

  useEffect(() => {
    if (isNavigation) return
    clearInteraction()
  }, [isNavigation, clearInteraction])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    function handleWheel(event) {
      if (modeRef.current !== INTERACTION_MODE.NAVIGATION) return

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

        const zoomed = zoomAtViewportPoint(prev, pointerX, pointerY, nextScale)
        const next = clampTranslate(zoomed.x, zoomed.y, nextScale)

        return { x: next.x, y: next.y, scale: nextScale }
      })
    }

    viewport.addEventListener('wheel', handleWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', handleWheel)
  }, [clampTranslate])

  const panHandlers = isNavigation
    ? {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onPointerCancel: handlePointerUp,
      }
    : {}

  return {
    transform,
    isPanning: isNavigation && isPanning,
    viewportRef,
    fitToViewport,
    handlers: panHandlers,
  }
}
