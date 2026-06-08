import { useCallback, useEffect, useRef, useState } from 'react'
import { hideElementIdLabels, showElementIdLabels } from '../canvas/idLabels'

export const FIBER_STATUS = {
  NORMAL: 'normal',
  ALERT: 'alert',
  FALLEN: 'fallen',
  OFFLINE: 'offline',
  ACTIVE: 'active',
  CUSTOM: 'custom',
}

/** Mesmo vermelho do alerta, um tom mais forte (Material Red 700). */
export const FIBER_FALLEN_COLOR = '#bf1515'

export const FIBER_STATUS_COLORS = {
  [FIBER_STATUS.NORMAL]: '#FF751F',
  [FIBER_STATUS.ALERT]: '#e53935',
  [FIBER_STATUS.FALLEN]: FIBER_FALLEN_COLOR,
  [FIBER_STATUS.OFFLINE]: '#9ca3af',
  [FIBER_STATUS.ACTIVE]: '#009819',
}

export const DEFAULT_FIBER_COLOR = FIBER_STATUS_COLORS[FIBER_STATUS.NORMAL]

export const FIBER_ID_PATTERN = /^cabo-\d+$/
export const MAX_FIBER_NUMBER = 82

export function getAllFiberIds() {
  return Array.from(
    { length: MAX_FIBER_NUMBER },
    (_, index) => `cabo-${index + 1}`,
  )
}

export function extractFiberIdsFromSvg(svgRoot) {
  if (!svgRoot) return []

  const ids = []
  svgRoot.querySelectorAll('[id]').forEach((element) => {
    if (FIBER_ID_PATTERN.test(element.id)) {
      ids.push(element.id)
    }
  })

  return ids.sort(
    (a, b) =>
      Number(a.replace('cabo-', '')) - Number(b.replace('cabo-', '')),
  )
}

export function normalizeFiberId(id) {
  if (!id) return ''
  return id.startsWith('#') ? id.slice(1) : id
}

export function resolveFiberColor({ color, status } = {}) {
  if (color) return color
  if (status && FIBER_STATUS_COLORS[status]) return FIBER_STATUS_COLORS[status]
  return DEFAULT_FIBER_COLOR
}

function getFiberElement(svgRoot, fiberId) {
  const id = normalizeFiberId(fiberId)
  const scope =
    svgRoot instanceof SVGSVGElement ? svgRoot : svgRoot.querySelector('svg')
  if (!scope) return null

  return scope.querySelector(`#${CSS.escape(id)}`)
}

export function applyFiberColor(svgRoot, fiberId, color) {
  if (!svgRoot) return false

  const element = getFiberElement(svgRoot, fiberId)
  if (!element) return false

  if (!element.dataset.originalStroke) {
    element.dataset.originalStroke = element.getAttribute('stroke') || ''
  }

  element.setAttribute('stroke', color)
  element.style.setProperty('stroke', color, 'important')
  return true
}

export function applyFiberUpdate(svgRoot, fiber) {
  return applyFiberColor(svgRoot, fiber.id, resolveFiberColor(fiber))
}

export function applyFibers(svgRoot, fibers = []) {
  if (!svgRoot) return []

  return fibers.map((fiber) => ({
    id: fiber.id,
    applied: applyFiberUpdate(svgRoot, fiber),
  }))
}

export function resetFibers(svgRoot, fiberIds = []) {
  fiberIds.forEach((id) => {
    const element = getFiberElement(svgRoot, id)
    if (!element) return

    const original = element.dataset.originalStroke
    if (original) {
      element.setAttribute('stroke', original)
      element.style.setProperty('stroke', original, 'important')
    }
  })
}

export function applyFibersInSequence(svgRoot, fibers = [], options = {}) {
  const { intervalMs = 400, onStep, onComplete } = options

  if (!svgRoot || fibers.length === 0) {
    onComplete?.()
    return () => {}
  }

  let index = 0
  let cancelled = false

  const timerId = window.setInterval(() => {
    if (cancelled) return

    if (index >= fibers.length) {
      window.clearInterval(timerId)
      onComplete?.()
      return
    }

    const fiber = fibers[index]
    applyFiberUpdate(svgRoot, fiber)
    onStep?.(fiber, index)
    index += 1
  }, intervalMs)

  return () => {
    cancelled = true
    window.clearInterval(timerId)
  }
}

export function useFiberDiagram() {
  const svgRef = useRef(null)
  const cancelSequenceRef = useRef(null)
  const pendingSequenceRef = useRef(null)
  const [fiberIds] = useState(getAllFiberIds)
  const appliedFibersRef = useRef([])
  const [cableIdLabelsVisible, setCableIdLabelsVisibleState] = useState(false)

  const setCableIdLabelsVisible = useCallback((visible) => {
    setCableIdLabelsVisibleState(visible)

    const svg = svgRef.current
    if (!svg) return 0

    if (visible) {
      return showElementIdLabels(svg, {
        idFilter: (id) => FIBER_ID_PATTERN.test(id),
      })
    }

    hideElementIdLabels(svg)
    return 0
  }, [])

  const registerSvg = useCallback((svgElement) => {
    svgRef.current = svgElement

    if (appliedFibersRef.current.length > 0) {
      applyFibers(svgElement, appliedFibersRef.current)
    }

    if (cableIdLabelsVisible) {
      showElementIdLabels(svgElement, {
        idFilter: (id) => FIBER_ID_PATTERN.test(id),
      })
    }

    if (!pendingSequenceRef.current) return

    const { fibers, options } = pendingSequenceRef.current
    pendingSequenceRef.current = null
    cancelSequenceRef.current?.()
    cancelSequenceRef.current = applyFibersInSequence(
      svgElement,
      fibers,
      options,
    )
  }, [cableIdLabelsVisible])

  const setFibers = useCallback((fibers) => {
    appliedFibersRef.current = fibers
    return applyFibers(svgRef.current, fibers)
  }, [])

  const runSequence = useCallback((fibers, options = {}) => {
    cancelSequenceRef.current?.()

    if (!svgRef.current) {
      pendingSequenceRef.current = { fibers, options }
      return () => {
        pendingSequenceRef.current = null
      }
    }

    cancelSequenceRef.current = applyFibersInSequence(
      svgRef.current,
      fibers,
      options,
    )
    return cancelSequenceRef.current
  }, [])

  const stopSequence = useCallback(() => {
    pendingSequenceRef.current = null
    cancelSequenceRef.current?.()
    cancelSequenceRef.current = null
  }, [])

  const reset = useCallback((fiberIds) => {
    resetFibers(svgRef.current, fiberIds)
  }, [])

  useEffect(() => {
    return () => stopSequence()
  }, [stopSequence])

  return {
    registerSvg,
    fiberIds,
    setFibers,
    runSequence,
    stopSequence,
    reset,
    getSvg: () => svgRef.current,
    cableIdLabelsVisible,
    setCableIdLabelsVisible,
  }
}
