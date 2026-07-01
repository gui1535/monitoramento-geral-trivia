import {
  paintFiberActive,
  paintFiberAlert,
  paintFiberNormal,
  paintFiberRealFall,
} from '../fibers/cascadeAnimation'
import {
  FIBER_STATUS,
  FIBER_STATUS_COLORS,
  getAllFiberIds,
} from '../fibers/fibers'
import {
  FIBER_FALL_CLASS,
  FIBER_REAL_FALL_CLASS,
  NODE_OFFLINE_CLASS,
} from '../fibers/fiberFailure'
import {
  applyRadioUnstable,
  applyRadioVisibility,
  clearRadioHighlight,
  clearRadioUnstable,
  highlightRadios,
  initAllRadiosDimmed,
  RADIO_EVIDENT_CLASS,
  RADIO_UNSTABLE_CLASS,
} from '../radios/radios'
import { applyChaveUpright } from '../urs/chaves'
import {
  syncUrEnergyIcons,
} from '../urs/urEnergyIcon'
import {
  applyUrStatus,
  getUrGroup,
  getUrStatus,
  UR_NUMBERS,
  UR_STATUS,
} from '../urs/urs'
import { resolveSnapshotTimestamp } from './reviewTimeline'

export const FIBER_SNAPSHOT_STATUS = {
  NORMAL: 'normal',
  ALERT: 'alert',
  FALLEN: 'fallen',
  ACTIVE: 'active',
}

function getSvgScope(svgRoot) {
  return svgRoot instanceof SVGSVGElement
    ? svgRoot
    : svgRoot?.querySelector('svg')
}

function getFiberElement(svgRoot, fiberId) {
  const scope = getSvgScope(svgRoot)
  if (!scope) return null
  return scope.querySelector(`#${CSS.escape(fiberId)}`)
}

function detectFiberStatus(element) {
  if (!element) return FIBER_SNAPSHOT_STATUS.NORMAL

  if (element.classList.contains(FIBER_REAL_FALL_CLASS)) {
    return FIBER_SNAPSHOT_STATUS.FALLEN
  }

  if (element.classList.contains(FIBER_FALL_CLASS)) {
    return FIBER_SNAPSHOT_STATUS.ALERT
  }

  const stroke =
    element.getAttribute('stroke') ??
    element.style.stroke ??
    ''

  if (stroke === FIBER_STATUS_COLORS[FIBER_STATUS.ACTIVE]) {
    return FIBER_SNAPSHOT_STATUS.ACTIVE
  }

  return FIBER_SNAPSHOT_STATUS.NORMAL
}

function captureFiberStates(svg, fiberIds) {
  const fibers = {}
  fiberIds.forEach((id) => {
    fibers[id] = detectFiberStatus(getFiberElement(svg, id))
  })
  return fibers
}

function captureOfflineNodes(svg) {
  const scope = getSvgScope(svg)
  if (!scope) return []

  const ids = []
  scope.querySelectorAll(`.${NODE_OFFLINE_CLASS}`).forEach((element) => {
    if (element.id) ids.push(element.id)
  })
  return ids
}

function captureUrStatuses(svg) {
  const statuses = {}
  UR_NUMBERS.forEach((ur) => {
    const group = getUrGroup(svg, ur)
    statuses[ur] = group ? getUrStatus(group) : UR_STATUS.INACTIVE
  })
  return statuses
}

function applyOfflineNodes(svg, offlineNodes = []) {
  const scope = getSvgScope(svg)
  if (!scope) return

  scope.querySelectorAll(`.${NODE_OFFLINE_CLASS}`).forEach((element) => {
    element.classList.remove(NODE_OFFLINE_CLASS)
    element.style.removeProperty('opacity')
    element.style.removeProperty('filter')
  })

  offlineNodes.forEach((nodeId) => {
    const element = scope.querySelector(`#${CSS.escape(nodeId)}`)
    if (!element) return

    if (element.dataset.originalOpacity === undefined) {
      element.dataset.originalOpacity = element.style.opacity || ''
    }
    if (element.dataset.originalFilter === undefined) {
      element.dataset.originalFilter = element.style.filter || ''
    }

    element.classList.add(NODE_OFFLINE_CLASS)
  })
}

function applyFiberStates(svg, fibers = {}) {
  Object.entries(fibers).forEach(([fiberId, status]) => {
    switch (status) {
      case FIBER_SNAPSHOT_STATUS.FALLEN:
        paintFiberRealFall(svg, fiberId)
        break
      case FIBER_SNAPSHOT_STATUS.ALERT:
        paintFiberAlert(svg, fiberId)
        break
      case FIBER_SNAPSHOT_STATUS.ACTIVE:
        paintFiberActive(svg, fiberId)
        break
      default:
        paintFiberNormal(svg, fiberId)
        break
    }
  })
}

function resetAllFibers(svg, fiberIds) {
  fiberIds.forEach((id) => paintFiberNormal(svg, id))
}

function applyRadioSnapshot(svg, radio = {}) {
  clearRadioUnstable(svg)
  clearRadioHighlight(svg)

  const visibility = radio.visibility ?? { lines: [], textos: [], imgs: [] }

  if (radio.unstable) {
    applyRadioUnstable(svg, visibility)
    return
  }

  if (radio.cascadeHighlight) {
    highlightRadios(svg, visibility)
    return
  }

  if (
    (visibility.lines?.length ?? 0) > 0 ||
    (visibility.textos?.length ?? 0) > 0 ||
    (visibility.imgs?.length ?? 0) > 0
  ) {
    applyRadioVisibility(svg, visibility)
    return
  }

  initAllRadiosDimmed(svg)
}

function applyUrSnapshot(svg, ur = {}) {
  const statuses = ur.statuses ?? {}
  const uprightChaves = new Set(ur.uprightChaves ?? [])
  const semEnergiaMap = new Map()

  Object.entries(ur.semEnergiaPorUr ?? {}).forEach(([urKey, types]) => {
    const urNumber = Number(urKey)
    if (!Number.isFinite(urNumber)) return
    semEnergiaMap.set(urNumber, new Set(types ?? []))
  })

  UR_NUMBERS.forEach((urNumber) => {
    const status = statuses[urNumber] ?? UR_STATUS.INACTIVE
    applyUrStatus(svg, urNumber, status)
  })

  uprightChaves.forEach((number) => {
    applyChaveUpright(svg, number, true)
  })

  UR_NUMBERS.forEach((number) => {
    if (!uprightChaves.has(number)) {
      applyChaveUpright(svg, number, false)
    }
  })

  syncUrEnergyIcons(svg, { semEnergiaPorUr: semEnergiaMap })
}

/**
 * Captura o estado visual completo do monitoramento para replay.
 */
export function captureMonitoringSnapshot({
  svg,
  fiberIds = getAllFiberIds(),
  semEnergiaPorUr = {},
  fallenFromFiber = [],
  activeUrs = [],
  uprightChaves = [],
  radioState = null,
  radioAlert = null,
  activeFailure = { cabos: [], nodes: [] },
  fixedFailureCabos = [],
  errors = [],
  label = '',
  timestamp = null,
} = {}) {
  if (!svg) return null

  const radio = radioState ?? {
    unstable: false,
    cascadeHighlight: false,
    visibility: { lines: [], textos: [], imgs: [] },
  }

  const resolvedTimestamp =
    timestamp ?? resolveSnapshotTimestamp(errors, Date.now())

  return {
    timestamp: resolvedTimestamp,
    label,
    fibers: captureFiberStates(svg, fiberIds),
    offlineNodes: captureOfflineNodes(svg),
    ur: {
      statuses: captureUrStatuses(svg),
      semEnergiaPorUr: { ...semEnergiaPorUr },
      fallenFromFiber: [...fallenFromFiber],
      activeUrs: [...activeUrs],
      uprightChaves: [...uprightChaves],
    },
    radio,
    react: {
      radioAlert: radioAlert ? { ...radioAlert } : null,
      activeFailure: {
        cabos: [...(activeFailure.cabos ?? [])],
        nodes: [...(activeFailure.nodes ?? [])],
      },
      fixedFailureCabos: [...fixedFailureCabos],
    },
    errors: errors.map((entry) => ({ ...entry })),
  }
}

/**
 * Aplica um snapshot no SVG (modo review = só visual; restoreRefs atualiza hooks).
 */
export function applyMonitoringSnapshot(
  svg,
  snapshot,
  { fiberIds = getAllFiberIds(), restoreRefs } = {},
) {
  if (!svg || !snapshot) return

  resetAllFibers(svg, fiberIds)
  applyFiberStates(svg, snapshot.fibers)
  applyOfflineNodes(svg, snapshot.offlineNodes)
  applyRadioSnapshot(svg, snapshot.radio)
  applyUrSnapshot(svg, snapshot.ur)

  restoreRefs?.(snapshot)
}

export function snapshotToReactState(snapshot) {
  if (!snapshot) {
    return {
      radioAlert: null,
      fixedFailureCabos: [],
      activeFailure: { cabos: [], nodes: [] },
    }
  }

  return {
    radioAlert: snapshot.react?.radioAlert ?? null,
    fixedFailureCabos: snapshot.react?.fixedFailureCabos ?? [],
    activeFailure: snapshot.react?.activeFailure ?? { cabos: [], nodes: [] },
  }
}

/** Detecta se o rádio está em modo instável pelo DOM. */
export function detectRadioUnstableFromSvg(svg) {
  const scope = getSvgScope(svg)
  if (!scope) return false
  return Boolean(scope.querySelector(`.${RADIO_UNSTABLE_CLASS}`))
}

/** Detecta se há destaque de cascata no DOM. */
export function detectRadioCascadeFromSvg(svg) {
  const scope = getSvgScope(svg)
  if (!scope) return false
  return Boolean(scope.querySelector(`.${RADIO_EVIDENT_CLASS}`))
}
