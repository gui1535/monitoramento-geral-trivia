import { useCallback, useRef } from 'react'

export const RADIO_DIM_OPACITY = 0.22
export const RADIO_ACTIVE_OPACITY = 1
export const RADIO_EVIDENT_CLASS = 'radio-evidente'
export const RADIO_OK_COLOR = '#00FF48'

export function createEmptyRadios() {
  return { lines: [], textos: [], imgs: [] }
}

export const RADIO_LINE_OPTIONS = [1, 2, 3, 4, 5, 6].map((number) => ({
  id: `radio-${number}`,
  label: `radio-${number}`,
}))

export const TORRE_TEXTO_OPTIONS = [
  { id: 'texto-torre-estudantes', label: 'Estudantes' },
  { id: 'texto-torre-paranapiacaba', label: 'Paranapiacaba' },
  { id: 'texto-torre-bras', label: 'Bras' },
  { id: 'texto-torre-jaragua', label: 'Jaraguá' },
]

export const TORRE_IMG_OPTIONS = [
  { id: 'img-torre-estudantes', label: 'Estudantes' },
  { id: 'img-torre-paranapiacaba', label: 'Paranapiacaba' },
  { id: 'img-torre-bras', label: 'Bras' },
  { id: 'img-torre-jaragua', label: 'Jaraguá' },
]

const ALL_ELEMENT_IDS = [
  ...RADIO_LINE_OPTIONS.map((o) => o.id),
  ...TORRE_TEXTO_OPTIONS.map((o) => o.id),
  ...TORRE_IMG_OPTIONS.map((o) => o.id),
]

function getSvgScope(svgRoot) {
  return svgRoot instanceof SVGSVGElement
    ? svgRoot
    : svgRoot?.querySelector('svg')
}

function getSvgElement(svgRoot, id) {
  const scope = getSvgScope(svgRoot)
  if (!scope || !id) return null

  return scope.querySelector(`#${CSS.escape(id)}`)
}

function setElementOpacity(element, opacity) {
  if (!element) return

  element.style.opacity = String(opacity)
}

export function setElementVisible(svgRoot, elementId, visible = true) {
  const opacity = visible ? RADIO_ACTIVE_OPACITY : RADIO_DIM_OPACITY
  setElementOpacity(getSvgElement(svgRoot, elementId), opacity)
  return Boolean(getSvgElement(svgRoot, elementId))
}

export function isRadioLineId(id) {
  return /^radio-\d+$/.test(id)
}

export function isRadioLineActive(svgRoot, elementId) {
  if (!isRadioLineId(elementId)) return false

  const element = getSvgElement(svgRoot, elementId)
  if (!element) return false

  if (element.classList.contains(RADIO_EVIDENT_CLASS)) return true

  const opacity = Number.parseFloat(element.style.opacity)
  if (!Number.isNaN(opacity) && opacity >= RADIO_ACTIVE_OPACITY - 0.05) {
    return true
  }

  const stroke = element.getAttribute('stroke') ?? element.style.stroke
  return stroke === RADIO_OK_COLOR
}

export function collectActiveRadioLines(svgRoot) {
  return RADIO_LINE_OPTIONS.map(({ id }) => id).filter((id) =>
    isRadioLineActive(svgRoot, id),
  )
}

function isRadioElementEvident(svgRoot, elementId) {
  const element = getSvgElement(svgRoot, elementId)
  if (!element) return false

  return (
    element.classList.contains(RADIO_EVIDENT_CLASS) ||
    element.classList.contains('antena-funcionando')
  )
}

export function collectEvidentRadioIds(svgRoot) {
  return ALL_ELEMENT_IDS.filter((id) => isRadioElementEvident(svgRoot, id))
}

export function applyRadioVisibility(svgRoot, { lines = [], textos = [], imgs = [] } = {}) {
  const lineSet = new Set(lines)
  const textoSet = new Set(textos)
  const imgSet = new Set(imgs)

  RADIO_LINE_OPTIONS.forEach(({ id }) => {
    setElementVisible(svgRoot, id, lineSet.has(id))
  })

  TORRE_TEXTO_OPTIONS.forEach(({ id }) => {
    setElementVisible(svgRoot, id, textoSet.has(id))
  })

  TORRE_IMG_OPTIONS.forEach(({ id }) => {
    setElementVisible(svgRoot, id, imgSet.has(id))
  })
}

export function initAllRadiosDimmed(svgRoot) {
  ALL_ELEMENT_IDS.forEach((id) => {
    setElementVisible(svgRoot, id, false)
  })
}

const RADIO_LABEL_BY_ID = new Map(
  [...RADIO_LINE_OPTIONS, ...TORRE_TEXTO_OPTIONS, ...TORRE_IMG_OPTIONS].map((o) => [
    o.id,
    o.label,
  ]),
)

export function formatRadioFunctioningMessage(radios) {
  const hadExplicit =
    (radios?.lines?.length ?? 0) > 0 ||
    (radios?.textos?.length ?? 0) > 0 ||
    (radios?.imgs?.length ?? 0) > 0

  if (!hadExplicit) {
    return {
      title: 'Rádio em funcionamento',
      detail: 'Os rádios estão em funcionamento.',
    }
  }

  const selection = normalizeRadiosSelection(radios)


  return {
    title: 'Rádio em funcionamento',
    detail: `Os rádios estão em funcionamento.`,
  }
}

export function normalizeRadiosSelection(radios) {
  const lines = Array.isArray(radios?.lines) ? radios.lines : []
  const textos = Array.isArray(radios?.textos) ? radios.textos : []
  const imgs = Array.isArray(radios?.imgs) ? radios.imgs : []

  if (lines.length > 0 || textos.length > 0 || imgs.length > 0) {
    return { lines, textos, imgs }
  }

  return {
    lines: RADIO_LINE_OPTIONS.map((o) => o.id),
    textos: TORRE_TEXTO_OPTIONS.map((o) => o.id),
    imgs: TORRE_IMG_OPTIONS.map((o) => o.id),
  }
}

function isAntennaImageId(id) {
  return id.startsWith('img-torre-')
}

function applyRadioGreenVisual(element, elementId, evident) {
  if (!element) return

  if (isRadioLineId(elementId)) {
    if (evident) {
      if (!element.dataset.radioStrokeDefault) {
        element.dataset.radioStrokeDefault = element.getAttribute('stroke') ?? 'black'
      }

      setElementOpacity(element, RADIO_ACTIVE_OPACITY)
      element.setAttribute('stroke', RADIO_OK_COLOR)
      element.style.setProperty('stroke', RADIO_OK_COLOR, 'important')
    } else {
      const stroke = element.dataset.radioStrokeDefault ?? 'black'
      element.setAttribute('stroke', stroke)
      element.style.removeProperty('stroke')
      delete element.dataset.radioStrokeDefault
    }
  }

  if (isAntennaImageId(elementId)) {
    if (evident) {
      element.classList.add('antena-funcionando')
    } else {
      element.classList.remove('antena-funcionando')
    }
  }
}

function setRadioEvidentClass(svgRoot, elementId, evident) {
  const element = getSvgElement(svgRoot, elementId)
  if (!element) return

  if (evident) {
    element.classList.add(RADIO_EVIDENT_CLASS)
  } else {
    element.classList.remove(RADIO_EVIDENT_CLASS)
  }

  applyRadioGreenVisual(element, elementId, evident)
}

export function highlightRadios(svgRoot, radios) {
  const selection = normalizeRadiosSelection(radios)
  const linhasJaAtivas = collectActiveRadioLines(svgRoot)
  const evidentesAnteriores = collectEvidentRadioIds(svgRoot)

  const merged = {
    lines: [...new Set([...selection.lines, ...linhasJaAtivas])],
    textos: [...new Set([...selection.textos, ...evidentesAnteriores.filter((id) => id.startsWith('texto-torre-'))])],
    imgs: [...new Set([...selection.imgs, ...evidentesAnteriores.filter((id) => id.startsWith('img-torre-'))])],
  }

  applyRadioVisibility(svgRoot, merged)

  const evidentIds = new Set([
    ...merged.lines,
    ...merged.textos,
    ...merged.imgs,
    ...evidentesAnteriores,
  ])

  ALL_ELEMENT_IDS.forEach((id) => {
    setRadioEvidentClass(svgRoot, id, evidentIds.has(id))
  })

  return merged
}

export function clearRadioHighlight(svgRoot) {
  ALL_ELEMENT_IDS.forEach((id) => {
    setRadioEvidentClass(svgRoot, id, false)
  })

  const scope = getSvgScope(svgRoot)
  scope?.querySelectorAll('.antena-funcionando').forEach((element) => {
    element.classList.remove('antena-funcionando')
  })
}

export function useRadioDiagram() {
  const svgRef = useRef(null)
  const visibilityRef = useRef({ lines: [], textos: [], imgs: [] })
  const cascadeHighlightRef = useRef(false)

  const registerSvg = useCallback((svgElement) => {
    svgRef.current = svgElement
    initAllRadiosDimmed(svgElement)
    applyRadioVisibility(svgElement, visibilityRef.current)
  }, [])

  const applyVisibility = useCallback((selection) => {
    visibilityRef.current = {
      lines: selection.lines ?? [],
      textos: selection.textos ?? [],
      imgs: selection.imgs ?? [],
    }
    applyRadioVisibility(svgRef.current, visibilityRef.current)
  }, [])

  const resetRadios = useCallback(() => {
    cascadeHighlightRef.current = false
    visibilityRef.current = { lines: [], textos: [], imgs: [] }
    clearRadioHighlight(svgRef.current)
    initAllRadiosDimmed(svgRef.current)
  }, [])

  const highlightForCascade = useCallback((radios) => {
    cascadeHighlightRef.current = true
    highlightRadios(svgRef.current, radios)
  }, [])

  const clearCascadeHighlight = useCallback(() => {
    if (!cascadeHighlightRef.current) return

    cascadeHighlightRef.current = false
    clearRadioHighlight(svgRef.current)
    applyRadioVisibility(svgRef.current, visibilityRef.current)
  }, [])

  return {
    registerSvg,
    applyVisibility,
    resetRadios,
    highlightForCascade,
    clearCascadeHighlight,
    radioLineOptions: RADIO_LINE_OPTIONS,
    torreTextoOptions: TORRE_TEXTO_OPTIONS,
    torreImgOptions: TORRE_IMG_OPTIONS,
    getVisibility: () => ({ ...visibilityRef.current }),
  }
}
