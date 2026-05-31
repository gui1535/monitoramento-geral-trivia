import { useCallback, useRef } from 'react'

export const LED_COUNT = 18
export const LED_PAIR_COUNT = LED_COUNT / 2
export const LED_STROKE = '#4F4F4F'
export const LED_BLINK_CLASS = 'led-blink'
export const LED_STABLE_CLASS = 'led-stable'

export const LED_SIDES = {
  A: 'A',
  B: 'B',
}

export const LED_STATUS = {
  OK: 'ok',
  NOT_OK: 'not_ok',
  WARN: 'warn',
  ALERT: 'alert',
  OFF: 'off',
}

export const LED_NOT_OK_FILL = '#FFEE0A'
export const LED_NOT_OK_FILL_BRIGHT = '#FFEE58'

export const LED_STATUS_COLORS = {
  [LED_STATUS.OK]: '#18B44A',
  [LED_STATUS.NOT_OK]: LED_NOT_OK_FILL,
  [LED_STATUS.WARN]: LED_NOT_OK_FILL,
  [LED_STATUS.ALERT]: '#E62E2E',
  [LED_STATUS.OFF]: '#9ca3af',
}

export function normalizeLedStatus(status) {
  if (status === LED_STATUS.NOT_OK || status === LED_STATUS.WARN) {
    return LED_STATUS.NOT_OK
  }

  if (status === LED_STATUS.OK) return LED_STATUS.OK

  return status
}

export function isLedOk(status) {
  return normalizeLedStatus(status) === LED_STATUS.OK
}

export function getLedId(number) {
  return `led-${number}`
}

export function getLedSide(number) {
  if (number < 1 || number > LED_COUNT) return null
  return number % 2 === 1 ? LED_SIDES.A : LED_SIDES.B
}

export function getLedPairIndex(number) {
  if (number < 1 || number > LED_COUNT) return null
  return Math.ceil(number / 2)
}

export function getPairLedNumbers(pairIndex) {
  if (pairIndex < 1 || pairIndex > LED_PAIR_COUNT) return null

  const a = pairIndex * 2 - 1
  const b = pairIndex * 2

  return {
    pairIndex,
    a,
    b,
    aId: getLedId(a),
    bId: getLedId(b),
  }
}

export const LED_PAIRS = Array.from({ length: LED_PAIR_COUNT }, (_, index) => {
  const pairIndex = index + 1
  const { a, b, aId, bId } = getPairLedNumbers(pairIndex)

  return {
    pairIndex,
    a: { number: a, id: aId, side: LED_SIDES.A },
    b: { number: b, id: bId, side: LED_SIDES.B },
    label: `Par ${pairIndex} — led-${a} (A) / led-${b} (B)`,
  }
})

function getSvgScope(svgRoot) {
  return svgRoot instanceof SVGSVGElement
    ? svgRoot
    : svgRoot?.querySelector('svg')
}

function getLedElement(svgRoot, ledNumber) {
  const scope = getSvgScope(svgRoot)
  if (!scope) return null

  return scope.querySelector(`#${CSS.escape(getLedId(ledNumber))}`)
}

function resolveLedFill({ color, status } = {}) {
  if (color) return color

  const normalized = normalizeLedStatus(status)
  if (normalized === LED_STATUS.OK) return LED_STATUS_COLORS[LED_STATUS.OK]
  if (normalized === LED_STATUS.NOT_OK) return LED_STATUS_COLORS[LED_STATUS.NOT_OK]

  if (status && LED_STATUS_COLORS[status]) return LED_STATUS_COLORS[status]

  return LED_STATUS_COLORS[LED_STATUS.NOT_OK]
}

function clearLedPresentation(element) {
  element.classList.remove(LED_BLINK_CLASS, LED_STABLE_CLASS)
  element.style.removeProperty('animation')
  element.style.removeProperty('opacity')
  element.style.removeProperty('fill')
  element.style.removeProperty('fill-opacity')
  element.style.removeProperty('stroke-opacity')
  element.style.removeProperty('--led-fill-base')
  element.style.removeProperty('--led-fill-bright')
}

export function applyLedStatus(svgRoot, ledNumber, statusOrOptions = LED_STATUS.OK) {
  const element = getLedElement(svgRoot, ledNumber)
  if (!element) return false

  const options =
    typeof statusOrOptions === 'string' ? { status: statusOrOptions } : statusOrOptions

  const normalized = normalizeLedStatus(options.status ?? LED_STATUS.OK)
  const fill = resolveLedFill({ ...options, status: normalized })

  if (!element.dataset.originalFill) {
    element.dataset.originalFill = element.getAttribute('fill') || ''
  }

  clearLedPresentation(element)

  element.setAttribute('stroke', options.stroke ?? LED_STROKE)
  element.dataset.ledStatus = normalized

  if (normalized === LED_STATUS.OK) {
    element.setAttribute('fill', fill)
    element.style.setProperty('fill', fill, 'important')
    element.classList.add(LED_STABLE_CLASS)
  } else if (normalized === LED_STATUS.NOT_OK) {
    element.setAttribute('fill', LED_NOT_OK_FILL)
    element.style.setProperty('--led-fill-base', LED_NOT_OK_FILL)
    element.style.setProperty('--led-fill-bright', LED_NOT_OK_FILL_BRIGHT)
    element.classList.add(LED_BLINK_CLASS)
  } else {
    element.setAttribute('fill', fill)
    element.style.setProperty('fill', fill, 'important')
  }

  return true
}

export function applyLedPair(svgRoot, pairIndex, { a, b } = {}) {
  const pair = getPairLedNumbers(pairIndex)
  if (!pair) return false

  let applied = false

  if (a !== undefined) {
    applied =
      applyLedStatus(svgRoot, pair.a, typeof a === 'string' ? a : a) || applied
  }

  if (b !== undefined) {
    applied =
      applyLedStatus(svgRoot, pair.b, typeof b === 'string' ? b : b) || applied
  }

  return applied
}

function normalizeSideUpdate(value) {
  if (value == null) return undefined
  if (typeof value === 'string') return normalizeLedStatus(value)
  if (value.status) return normalizeLedStatus(value.status)
  return undefined
}

export function setLeds(svgRoot, updates = []) {
  updates.forEach((update) => {
    if (update.pairIndex != null) {
      applyLedPair(svgRoot, update.pairIndex, {
        a: normalizeSideUpdate(update.a),
        b: normalizeSideUpdate(update.b),
      })
      return
    }

    const number = update.number ?? Number(String(update.id).replace('led-', ''))
    if (!number) return

    applyLedStatus(svgRoot, number, update)
  })
}

export function useLedDiagram() {
  const svgRef = useRef(null)
  const stateRef = useRef([])

  const registerSvg = useCallback((svgElement) => {
    svgRef.current = svgElement

    if (stateRef.current.length > 0) {
      setLeds(svgElement, stateRef.current)
    }
  }, [])

  const applyLeds = useCallback((updates) => {
    stateRef.current = updates
    setLeds(svgRef.current, updates)
  }, [])

  const setLed = useCallback(
    (number, options) => {
      const pair = getPairLedNumbers(getLedPairIndex(number))
      const withoutTarget = stateRef.current.filter((item) => {
        if (item.number === number || item.id === getLedId(number)) return false
        if (item.pairIndex === pair?.pairIndex) return false
        return true
      })
      applyLeds([...withoutTarget, { number, ...options }])
    },
    [applyLeds],
  )

  const setPair = useCallback(
    (pairIndex, sides) => {
      applyLeds([
        ...stateRef.current.filter((item) => item.pairIndex !== pairIndex),
        { pairIndex, ...sides },
      ])
    },
    [applyLeds],
  )

  return {
    registerSvg,
    setLeds: applyLeds,
    setLed,
    setPair,
    ledPairs: LED_PAIRS,
    getLedSide,
    getLedPairIndex,
    isLedOk,
  }
}
