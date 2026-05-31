import { useCallback, useEffect, useRef, useState } from 'react'
import { INTERACTION_MODE } from '../canvas/constants'
import {
  applyChaveUpright,
  bindChaves,
  CHAVE_NUMBERS,
  getChaveGroup,
  toggleChaveUpright,
} from './chaves'

export const UR_NUMBERS = Array.from({ length: 39 }, (_, index) => index + 1)

export const UR_CONNECT_DELAY_MS = 2000

export const UR_STATUS = {
  INACTIVE: 'inactive',
  CONNECTING: 'connecting',
  ACTIVE: 'active',
}

export const UR_COLORS = {
  [UR_STATUS.INACTIVE]: {
    fill: '#E62E2E',
    stroke: '#FF9999',
  },
  [UR_STATUS.CONNECTING]: {
    fill: '#E5DA55',
    stroke: '#F5E97A',
  },
  [UR_STATUS.ACTIVE]: {
    fill: '#009819',
    stroke: '#66BB6A',
  },
}

const clickHandlers = new WeakMap()

export function getUrButtonId(number) {
  return `btn-ur-${number}`
}

function getSvgScope(svgRoot) {
  return svgRoot instanceof SVGSVGElement
    ? svgRoot
    : svgRoot?.querySelector('svg')
}

export function getUrGroup(svgRoot, urNumber) {
  const scope = getSvgScope(svgRoot)
  if (!scope) return null

  return scope.querySelector(`#${CSS.escape(getUrButtonId(urNumber))}`)
}

export function getUrStatus(group) {
  if (!group) return UR_STATUS.INACTIVE

  const status = group.dataset.urStatus
  if (status === UR_STATUS.ACTIVE || status === UR_STATUS.CONNECTING) {
    return status
  }

  return UR_STATUS.INACTIVE
}

export function isUrActive(group) {
  return getUrStatus(group) === UR_STATUS.ACTIVE
}

function storeOriginalGroupFilter(group) {
  if (group.dataset.originalFilter === undefined) {
    group.dataset.originalFilter = group.getAttribute('filter') ?? ''
  }
}

function restoreGroupFilter(group) {
  storeOriginalGroupFilter(group)
  const originalFilter = group.dataset.originalFilter
  if (originalFilter) {
    group.setAttribute('filter', originalFilter)
  } else {
    group.removeAttribute('filter')
  }
}

function storeOriginalRectColors(rect) {
  if (rect.dataset.originalFill === undefined) {
    rect.dataset.originalFill = rect.getAttribute('fill') ?? ''
  }
  if (rect.dataset.originalStroke === undefined) {
    rect.dataset.originalStroke = rect.getAttribute('stroke') ?? ''
  }
}

function applyRectStatus(rect, status) {
  storeOriginalRectColors(rect)

  const colors = UR_COLORS[status] ?? UR_COLORS[UR_STATUS.INACTIVE]

  if (rect.hasAttribute('fill')) {
    rect.setAttribute('fill', colors.fill)
    rect.style.setProperty('fill', colors.fill, 'important')
  }

  if (rect.hasAttribute('stroke')) {
    rect.setAttribute('stroke', colors.stroke)
    rect.style.setProperty('stroke', colors.stroke, 'important')
  }
}

export function applyUrStatus(svgRoot, urNumber, status = UR_STATUS.INACTIVE) {
  const group = getUrGroup(svgRoot, urNumber)
  if (!group) return false

  restoreGroupFilter(group)

  group.querySelectorAll('rect').forEach((rect) => {
    applyRectStatus(rect, status)
  })

  group.dataset.urStatus = status
  group.dataset.urActive = status === UR_STATUS.ACTIVE ? 'true' : 'false'
  return true
}

export function applyUrActive(svgRoot, urNumber, active = true) {
  return applyUrStatus(
    svgRoot,
    urNumber,
    active ? UR_STATUS.ACTIVE : UR_STATUS.INACTIVE,
  )
}

export function toggleUrActive(svgRoot, urNumber) {
  const group = getUrGroup(svgRoot, urNumber)
  if (!group) return null

  const nextActive = !isUrActive(group)
  applyUrActive(svgRoot, urNumber, nextActive)
  return nextActive
}

function toggleChaveState(svgRoot, number, uprightChavesRef, callbacks) {
  const isUpright = toggleChaveUpright(svgRoot, number)
  if (isUpright === null) return

  if (isUpright) {
    uprightChavesRef.add(number)
  } else {
    uprightChavesRef.delete(number)
  }

  callbacks.onChaveToggle?.(number, isUpright)
}

function applyUrConnect(svgRoot, number, activeUrsRef, uprightChavesRef, callbacks = {}) {
  applyUrStatus(svgRoot, number, UR_STATUS.ACTIVE)
  activeUrsRef.add(number)
  callbacks.onUrClick?.(number, true)
  toggleChaveState(svgRoot, number, uprightChavesRef, callbacks)
}

function beginUrConnect(
  svgRoot,
  number,
  activeUrsRef,
  uprightChavesRef,
  callbacks,
  connectingTimeoutsRef,
) {
  applyUrStatus(svgRoot, number, UR_STATUS.CONNECTING)

  const existing = connectingTimeoutsRef.get(number)
  if (existing) clearTimeout(existing)

  const timeoutId = setTimeout(() => {
    connectingTimeoutsRef.delete(number)
    applyUrConnect(svgRoot, number, activeUrsRef, uprightChavesRef, callbacks)
  }, UR_CONNECT_DELAY_MS)

  connectingTimeoutsRef.set(number, timeoutId)
}

function applyUrDisconnect(svgRoot, number, activeUrsRef, uprightChavesRef, callbacks = {}) {
  applyUrStatus(svgRoot, number, UR_STATUS.INACTIVE)
  activeUrsRef.delete(number)
  callbacks.onUrClick?.(number, false)
  toggleChaveState(svgRoot, number, uprightChavesRef, callbacks)
}

export function bindUrButtons(svgRoot, { enabled = false, onUrClickRequest } = {}) {
  if (!svgRoot) return

  UR_NUMBERS.forEach((number) => {
    const group = getUrGroup(svgRoot, number)
    if (!group) return

    const existingHandler = clickHandlers.get(group)
    if (existingHandler) {
      group.removeEventListener('click', existingHandler)
      clickHandlers.delete(group)
    }

    group.style.pointerEvents = enabled ? 'auto' : 'none'
    group.style.cursor = enabled ? 'pointer' : 'default'

    group.querySelectorAll('rect').forEach((rect) => {
      rect.style.pointerEvents = enabled ? 'auto' : 'none'
    })

    if (!enabled) return

    const handler = (event) => {
      event.stopPropagation()
      event.preventDefault()
      onUrClickRequest?.(number, event)
    }

    group.addEventListener('click', handler)
    clickHandlers.set(group, handler)
  })
}

export function useUrDiagram(interactionMode) {
  const svgRef = useRef(null)
  const onUrClickRef = useRef(null)
  const onChaveClickRef = useRef(null)
  const activeUrsRef = useRef(new Set())
  const uprightChavesRef = useRef(new Set())
  const connectingTimeoutsRef = useRef(new Map())
  const [urConfirm, setUrConfirm] = useState(null)

  const registerSvg = useCallback((svgElement) => {
    svgRef.current = svgElement
    bindChaves(svgElement)

    const isFirstInit = activeUrsRef.current.size === 0

    UR_NUMBERS.forEach((number) => {
      if (!getUrGroup(svgElement, number)) return

      const active = isFirstInit || activeUrsRef.current.has(number)
      applyUrActive(svgElement, number, active)

      if (active) {
        activeUrsRef.current.add(number)
      } else {
        activeUrsRef.current.delete(number)
      }
    })

    CHAVE_NUMBERS.forEach((number) => {
      if (!getChaveGroup(svgElement, number)) return

      const upright = isFirstInit || uprightChavesRef.current.has(number)
      applyChaveUpright(svgElement, number, upright)

      if (upright) {
        uprightChavesRef.current.add(number)
      } else {
        uprightChavesRef.current.delete(number)
      }
    })
  }, [])

  const setOnUrClick = useCallback((callback) => {
    onUrClickRef.current = callback
  }, [])

  const setOnChaveClick = useCallback((callback) => {
    onChaveClickRef.current = callback
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const enabled = interactionMode === INTERACTION_MODE.ACTION

    bindChaves(svg)

    bindUrButtons(svg, {
      enabled,
      onUrClickRequest: (number, event) => {
        const group = getUrGroup(svg, number)
        const status = getUrStatus(group)

        if (status === UR_STATUS.CONNECTING) return

        if (status === UR_STATUS.INACTIVE) {
          setUrConfirm({
            number,
            x: event.clientX,
            y: event.clientY,
            action: 'connect',
          })
          return
        }

        setUrConfirm({
          number,
          x: event.clientX,
          y: event.clientY,
          action: 'disconnect',
        })
      },
    })

    return () => {
      bindUrButtons(svg, { enabled: false })
      bindChaves(svg)
    }
  }, [interactionMode])

  useEffect(() => {
    const timeouts = connectingTimeoutsRef.current
    return () => {
      timeouts.forEach((timeoutId) => clearTimeout(timeoutId))
      timeouts.clear()
    }
  }, [])

  const confirmUrAction = useCallback(() => {
    if (!urConfirm || !svgRef.current) return

    const callbacks = {
      onUrClick: (number, isActive) => onUrClickRef.current?.(number, isActive),
      onChaveToggle: (number, isUpright) =>
        onChaveClickRef.current?.(number, isUpright),
    }

    if (urConfirm.action === 'connect') {
      const number = urConfirm.number
      setUrConfirm(null)
      beginUrConnect(
        svgRef.current,
        number,
        activeUrsRef.current,
        uprightChavesRef.current,
        callbacks,
        connectingTimeoutsRef.current,
      )
      return
    } else {
      applyUrDisconnect(
        svgRef.current,
        urConfirm.number,
        activeUrsRef.current,
        uprightChavesRef.current,
        callbacks,
      )
    }

    setUrConfirm(null)
  }, [urConfirm])

  const cancelUrAction = useCallback(() => {
    setUrConfirm(null)
  }, [])

  return {
    registerSvg,
    setOnUrClick,
    setOnChaveClick,
    urConfirm,
    confirmUrAction,
    cancelUrAction,
    toggleUrActive: (number) => toggleUrActive(svgRef.current, number),
    applyUrActive: (number, active = true) =>
      applyUrActive(svgRef.current, number, active),
    toggleChaveUpright: (number) =>
      toggleChaveUpright(svgRef.current, number),
    getActiveUrs: () => [...activeUrsRef.current],
    getUprightChaves: () => [...uprightChavesRef.current],
  }
}
