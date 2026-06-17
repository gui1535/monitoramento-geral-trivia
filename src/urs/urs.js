import { useCallback, useEffect, useRef, useState } from 'react'
import { INTERACTION_MODE } from '../canvas/constants'
import {
  applyChaveUpright,
  bindChaves,
  CHAVE_NUMBERS,
  getChaveGroup,
  toggleChaveUpright,
} from './chaves'
import {
  serializeSemEnergiaPorUr,
  syncUrEnergyIcons,
} from './urEnergyIcon'
import { UR_ENERGY_TYPE, UR_ENERGY_TYPES } from './urEnergyIcon.constants'
import { evaluateUrFallsFromRedFibers } from './urRules'

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

export function normalizeUrNumber(urNumber) {
  const ur = Number(urNumber)
  if (!Number.isFinite(ur) || ur < 1) return null
  return ur
}

function getEnergyTiposForUr(map, urNumber) {
  const ur = normalizeUrNumber(urNumber)
  if (!ur) return new Set()

  const tipos = new Set([
    ...(map.get(ur) ?? []),
    ...(map.get(String(ur)) ?? []),
  ])

  return tipos
}

function writeEnergyTiposForUr(map, urNumber, tipos) {
  const ur = normalizeUrNumber(urNumber)
  if (!ur) return null

  map.delete(String(ur))
  if (tipos.size > 0) {
    map.set(ur, tipos)
  } else {
    map.delete(ur)
  }

  return ur
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

export function hasBothEnergyFailures(tipos) {
  if (!tipos) return false
  const types = tipos instanceof Set ? tipos : new Set(tipos)
  return (
    types.has(UR_ENERGY_TYPE.FALTA_1) && types.has(UR_ENERGY_TYPE.FALTA_2)
  )
}

export function shouldUrBeInactiveFromEnergy(tipos, fallenFromFiber = false) {
  if (fallenFromFiber) return true
  return hasBothEnergyFailures(tipos)
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

  const scope = getSvgScope(svgRoot)
  if (scope) {
    scope.classList.toggle('monitoramento-modo-acao', enabled)
    if (!enabled) {
      scope.style.removeProperty('pointer-events')
    }
  }

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
      if (enabled) {
        rect.style.cursor = 'pointer'
      } else {
        rect.style.removeProperty('cursor')
      }
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
  const interactionModeRef = useRef(interactionMode)
  interactionModeRef.current = interactionMode
  const onUrClickRef = useRef(null)
  const onChaveClickRef = useRef(null)
  const activeUrsRef = useRef(new Set())
  const uprightChavesRef = useRef(new Set())
  const semEnergiaPorUrRef = useRef(new Map())
  const ursCaidasPorFibraRef = useRef(new Set())
  const connectingTimeoutsRef = useRef(new Map())
  const [urConfirm, setUrConfirm] = useState(null)
  const [semEnergiaPorUr, setSemEnergiaPorUr] = useState({})

  const publishSemEnergia = useCallback(() => {
    setSemEnergiaPorUr(serializeSemEnergiaPorUr(semEnergiaPorUrRef.current))
  }, [])

  const syncEnergyIcons = useCallback(() => {
    if (!svgRef.current) return
    syncUrEnergyIcons(svgRef.current, {
      semEnergiaPorUr: semEnergiaPorUrRef.current,
    })
  }, [])

  const syncUrButtonFromEnergyState = useCallback((urNumber) => {
    const ur = normalizeUrNumber(urNumber)
    const svg = svgRef.current
    if (!ur || !svg || !getUrGroup(svg, ur)) return

    const tipos = getEnergyTiposForUr(semEnergiaPorUrRef.current, ur)
    const fallenFromFiber = ursCaidasPorFibraRef.current.has(ur)
    const shouldBeInactive = shouldUrBeInactiveFromEnergy(tipos, fallenFromFiber)

    if (shouldBeInactive) {
      applyUrStatus(svg, ur, UR_STATUS.INACTIVE)
      activeUrsRef.current.delete(ur)
      return
    }

    applyUrActive(svg, ur, true)
    activeUrsRef.current.add(ur)
  }, [])

  const syncAllUrButtonsFromEnergyState = useCallback(() => {
    UR_NUMBERS.forEach((urNumber) => {
      syncUrButtonFromEnergyState(urNumber)
    })
  }, [syncUrButtonFromEnergyState])

  useEffect(() => {
    syncEnergyIcons()
    syncAllUrButtonsFromEnergyState()
  }, [syncEnergyIcons, syncAllUrButtonsFromEnergyState, semEnergiaPorUr])

  const syncUrActionBindings = useCallback((svg) => {
    if (!svg) return

    const enabled = interactionModeRef.current === INTERACTION_MODE.ACTION

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
  }, [])

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

    syncUrEnergyIcons(svgElement, {
      semEnergiaPorUr: semEnergiaPorUrRef.current,
    })

    syncAllUrButtonsFromEnergyState()
    syncUrActionBindings(svgElement)
  }, [syncAllUrButtonsFromEnergyState, syncUrActionBindings])

  const setOnUrClick = useCallback((callback) => {
    onUrClickRef.current = callback
  }, [])

  const setOnChaveClick = useCallback((callback) => {
    onChaveClickRef.current = callback
  }, [])

  useEffect(() => {
    syncUrActionBindings(svgRef.current)

    return () => {
      if (svgRef.current) {
        bindUrButtons(svgRef.current, { enabled: false })
        bindChaves(svgRef.current)
      }
    }
  }, [interactionMode, syncUrActionBindings])

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

  const setUrSemEnergia = useCallback(
    (urNumber, type, ativo = true) => {
      const ur = normalizeUrNumber(urNumber)
      if (!ur || !UR_ENERGY_TYPES.includes(type)) return

      const tipos = getEnergyTiposForUr(semEnergiaPorUrRef.current, ur)

      if (ativo) {
        tipos.add(type)
      } else {
        tipos.delete(type)
      }

      writeEnergyTiposForUr(semEnergiaPorUrRef.current, ur, tipos)
      publishSemEnergia()
      syncUrButtonFromEnergyState(ur)
    },
    [publishSemEnergia, syncUrButtonFromEnergyState],
  )

  const setUrSemEnergiaBatch = useCallback(
    (urNumber, energyTypes, ativo = true) => {
      const ur = normalizeUrNumber(urNumber)
      if (!ur) return

      const types = (Array.isArray(energyTypes) ? energyTypes : []).filter((type) =>
        UR_ENERGY_TYPES.includes(type),
      )
      if (types.length === 0) return

      const tipos = getEnergyTiposForUr(semEnergiaPorUrRef.current, ur)

      types.forEach((type) => {
        if (ativo) {
          tipos.add(type)
        } else {
          tipos.delete(type)
        }
      })

      writeEnergyTiposForUr(semEnergiaPorUrRef.current, ur, tipos)
      publishSemEnergia()
      syncUrButtonFromEnergyState(ur)
    },
    [publishSemEnergia, syncUrButtonFromEnergyState],
  )

  const clearAllUrSemEnergia = useCallback(() => {
    semEnergiaPorUrRef.current.clear()
    publishSemEnergia()
    syncAllUrButtonsFromEnergyState()
  }, [publishSemEnergia, syncAllUrButtonsFromEnergyState])

  const syncUrFallsFromFibers = useCallback(
    (vermelhos, urRules = []) => {
      if (!svgRef.current) return

      const vermelhoSet = new Set(vermelhos)
      const devemCair = new Set(evaluateUrFallsFromRedFibers(vermelhoSet, urRules))

      ursCaidasPorFibraRef.current.forEach((urNumber) => {
        if (devemCair.has(urNumber)) return

        applyUrActive(svgRef.current, urNumber, true)
        activeUrsRef.current.add(urNumber)
        ursCaidasPorFibraRef.current.delete(urNumber)
      })

      devemCair.forEach((urNumber) => {
        if (ursCaidasPorFibraRef.current.has(urNumber)) return

        applyUrStatus(svgRef.current, urNumber, UR_STATUS.INACTIVE)
        activeUrsRef.current.delete(urNumber)
        ursCaidasPorFibraRef.current.add(urNumber)
      })
    },
    [],
  )

  const clearUrFallsFromFiberSimulation = useCallback(() => {
    if (!svgRef.current) return

    ursCaidasPorFibraRef.current.forEach((urNumber) => {
      applyUrActive(svgRef.current, urNumber, true)
      activeUrsRef.current.add(urNumber)
    })

    ursCaidasPorFibraRef.current.clear()
  }, [])

  const fallUrsFromFiber = useCallback((urNumbers = []) => {
    if (!svgRef.current) return

    urNumbers.forEach((urNumber) => {
      const ur = Number(urNumber)
      if (!Number.isFinite(ur)) return

      applyUrStatus(svgRef.current, ur, UR_STATUS.INACTIVE)
      activeUrsRef.current.delete(ur)
      ursCaidasPorFibraRef.current.add(ur)
    })
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
    semEnergiaPorUr,
    setUrSemEnergia,
    setUrSemEnergiaBatch,
    clearAllUrSemEnergia,
    syncUrFallsFromFibers,
    clearUrFallsFromFiberSimulation,
    fallUrsFromFiber,
  }
}
