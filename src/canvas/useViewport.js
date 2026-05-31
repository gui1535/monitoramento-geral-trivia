import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  getTouchPairMetrics,
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

  const viewportRef = useRef(null)
  const touchSurfaceRef = useRef(null)
  const panRef = useRef(null)
  const pinchRef = useRef(null)

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
    panRef.current = null
    pinchRef.current = null
    setIsPanning(false)
  }, [])

  const startPinch = useCallback((touchList, viewport) => {
    const rect = viewport.getBoundingClientRect()
    const metrics = getTouchPairMetrics(touchList, rect)
    if (!metrics || metrics.distance < 4) return false

    panRef.current = null
    setIsPanning(false)
    pinchRef.current = {
      startDistance: metrics.distance,
      startCenterX: metrics.centerX,
      startCenterY: metrics.centerY,
      startTransform: { ...transformRef.current },
    }
    return true
  }, [])

  const updatePinch = useCallback(
    (touchList, viewport) => {
      const pinch = pinchRef.current
      if (!pinch) return

      const rect = viewport.getBoundingClientRect()
      const metrics = getTouchPairMetrics(touchList, rect)
      if (!metrics || metrics.distance < 4) return

      const nextScale = clamp(
        pinch.startTransform.scale * (metrics.distance / pinch.startDistance),
        MIN_ZOOM,
        MAX_ZOOM,
      )

      const zoomed = zoomAtViewportPoint(
        pinch.startTransform,
        metrics.centerX,
        metrics.centerY,
        nextScale,
      )

      applyTransform({
        x: zoomed.x + (metrics.centerX - pinch.startCenterX),
        y: zoomed.y + (metrics.centerY - pinch.startCenterY),
        scale: nextScale,
      })
    },
    [applyTransform],
  )

  const startPan = useCallback((clientX, clientY) => {
    pinchRef.current = null
    panRef.current = {
      startX: clientX,
      startY: clientY,
      originX: transformRef.current.x,
      originY: transformRef.current.y,
    }
    setIsPanning(true)
  }, [])

  const updatePan = useCallback(
    (clientX, clientY) => {
      const pan = panRef.current
      if (!pan) return

      const next = clampTranslate(
        pan.originX + (clientX - pan.startX),
        pan.originY + (clientY - pan.startY),
        transformRef.current.scale,
      )

      setTransform((prev) => ({ ...prev, x: next.x, y: next.y }))
    },
    [clampTranslate],
  )

  useLayoutEffect(() => {
    if (!isNavigation) return

    const surface = touchSurfaceRef.current
    const viewport = viewportRef.current
    if (!surface || !viewport) return

    function onTouchStart(event) {
      if (modeRef.current !== INTERACTION_MODE.NAVIGATION) return

      event.preventDefault()

      if (event.touches.length >= 2) {
        startPinch(event.touches, viewport)
        return
      }

      if (event.touches.length === 1) {
        const touch = event.touches[0]
        startPan(touch.clientX, touch.clientY)
      }
    }

    function onTouchMove(event) {
      if (modeRef.current !== INTERACTION_MODE.NAVIGATION) return

      if (event.touches.length >= 2) {
        event.preventDefault()

        if (!pinchRef.current) {
          startPinch(event.touches, viewport)
        }

        updatePinch(event.touches, viewport)
        return
      }

      if (event.touches.length === 1 && panRef.current && !pinchRef.current) {
        event.preventDefault()
        const touch = event.touches[0]
        updatePan(touch.clientX, touch.clientY)
      }
    }

    function onTouchEnd(event) {
      if (event.touches.length >= 2) {
        startPinch(event.touches, viewport)
        return
      }

      if (event.touches.length === 1) {
        pinchRef.current = null
        const touch = event.touches[0]
        startPan(touch.clientX, touch.clientY)
        return
      }

      clearInteraction()
    }

    surface.addEventListener('touchstart', onTouchStart, { passive: false })
    surface.addEventListener('touchmove', onTouchMove, { passive: false })
    surface.addEventListener('touchend', onTouchEnd, { passive: false })
    surface.addEventListener('touchcancel', onTouchEnd, { passive: false })

    return () => {
      surface.removeEventListener('touchstart', onTouchStart)
      surface.removeEventListener('touchmove', onTouchMove)
      surface.removeEventListener('touchend', onTouchEnd)
      surface.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [
    isNavigation,
    clearInteraction,
    startPan,
    startPinch,
    updatePan,
    updatePinch,
  ])

  const handlePointerDown = useCallback(
    (event) => {
      if (modeRef.current !== INTERACTION_MODE.NAVIGATION) return
      if (event.pointerType === 'touch') return
      if (event.button !== 0) return

      event.preventDefault()
      startPan(event.clientX, event.clientY)
    },
    [startPan],
  )

  const handlePointerMove = useCallback(
    (event) => {
      if (modeRef.current !== INTERACTION_MODE.NAVIGATION) return
      if (event.pointerType === 'touch') return
      if (!panRef.current) return

      event.preventDefault()
      updatePan(event.clientX, event.clientY)
    },
    [updatePan],
  )

  const handlePointerUp = useCallback((event) => {
    if (event.pointerType === 'touch') return
    clearInteraction()
  }, [clearInteraction])

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

  const mouseHandlers = isNavigation
    ? {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onPointerCancel: handlePointerUp,
        onPointerLeave: handlePointerUp,
      }
    : {}

  return {
    transform,
    isPanning: isNavigation && isPanning,
    viewportRef,
    touchSurfaceRef,
    fitToViewport,
    mouseHandlers,
    showTouchSurface: isNavigation,
  }
}
