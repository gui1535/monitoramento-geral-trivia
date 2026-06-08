import {
  UR_ENERGY_ICON_CLASS,
  UR_ENERGY_TYPE,
  UR_ENERGY_TYPES,
} from './urEnergyIcon.constants'
import { getUrGroup, UR_NUMBERS } from './urs'

const SVG_NS = 'http://www.w3.org/2000/svg'
const ENERGIA_LAYER_ID = 'monitoramento-ur-energia'
const ICON_ID_PREFIX = 'ur-energia-'

export const UR_ENERGY_LETTER = 'E'

export const UR_ENERGY_REFERENCE_UR = 2
export const UR_ENERGY_LOWER_FROM = 18

export const UR_ENERGY_ICON_COLOR = '#FF9800'
export const UR_ENERGY_SIDE_GAP = 3

/** URs 1–17 — posicionamento ajustado na região superior. */
export const UR_ENERGY_LAYOUT_STANDARD = {
  width: 22,
  height: 22,
  gapBelow: 28,
}

/** URs 18–39 — região inferior. */
export const UR_ENERGY_LAYOUT_LOWER = {
  width: 20,
  height: 20,
  gapBelow: 6,
}

function getLayoutForUr(urNumber) {
  return urNumber >= UR_ENERGY_LOWER_FROM
    ? UR_ENERGY_LAYOUT_LOWER
    : UR_ENERGY_LAYOUT_STANDARD
}

function getSvgScope(svgRoot) {
  return svgRoot instanceof SVGSVGElement
    ? svgRoot
    : svgRoot?.querySelector('svg')
}

function ensureEnergiaLayer(svg) {
  let layer = svg.querySelector(`#${CSS.escape(ENERGIA_LAYER_ID)}`)
  if (!layer) {
    layer = document.createElementNS(SVG_NS, 'g')
    layer.id = ENERGIA_LAYER_ID
    layer.setAttribute('pointer-events', 'none')
    svg.appendChild(layer)
  }
  return layer
}

function getIconId(urNumber, type) {
  return `${ICON_ID_PREFIX}${type}-${urNumber}`
}

function applyIconTransform(group, position) {
  const { x, y, layout, anchor } = position
  const dx = anchor === 'right' ? x - layout.width : x
  group.setAttribute('transform', `translate(${dx} ${y})`)
}

function applyLetterStyle(text, layout) {
  const fontSize = Math.round(layout.height * 0.78)
  text.setAttribute('x', String(layout.width / 2))
  text.setAttribute('y', String(layout.height / 2))
  text.setAttribute('text-anchor', 'middle')
  text.setAttribute('dominant-baseline', 'middle')
  text.setAttribute('fill', UR_ENERGY_ICON_COLOR)
  text.setAttribute('font-size', String(fontSize))
  text.setAttribute('font-weight', '700')
  text.setAttribute('font-family', "system-ui, 'Segoe UI', sans-serif")
}

function createEnergyIconElement(urNumber, type, position) {
  const group = document.createElementNS(SVG_NS, 'g')
  group.id = getIconId(urNumber, type)
  group.classList.add(UR_ENERGY_ICON_CLASS, `${UR_ENERGY_ICON_CLASS}-${type}`)
  applyIconTransform(group, position)

  const text = document.createElementNS(SVG_NS, 'text')
  text.textContent = UR_ENERGY_LETTER
  applyLetterStyle(text, position.layout)
  group.appendChild(text)
  return group
}

function updateEnergyIconElement(element, position) {
  applyIconTransform(element, position)
  const text = element.querySelector('text')
  if (text) {
    applyLetterStyle(text, position.layout)
  }
  element.style.display = ''
  element.style.visibility = 'visible'
}

/** Falta 1 à esquerda; falta 2 à direita do botão UR. */
export function getUrEnergyIconPositions(svgRoot, urNumber) {
  const group = getUrGroup(svgRoot, urNumber)
  if (!group) return null

  const layout = getLayoutForUr(urNumber)

  try {
    const bbox = group.getBBox()
    const y = bbox.y + bbox.height + layout.gapBelow

    return {
      [UR_ENERGY_TYPE.FALTA_1]: {
        x: bbox.x - UR_ENERGY_SIDE_GAP,
        y,
        layout,
        anchor: 'right',
      },
      [UR_ENERGY_TYPE.FALTA_2]: {
        x: bbox.x + bbox.width + UR_ENERGY_SIDE_GAP,
        y,
        layout,
        anchor: 'left',
      },
    }
  } catch {
    return null
  }
}

function upsertEnergyIcon(layer, urNumber, type, position) {
  const id = getIconId(urNumber, type)
  let element = layer.querySelector(`#${CSS.escape(id)}`)

  if (!element) {
    element = createEnergyIconElement(urNumber, type, position)
    layer.appendChild(element)
    return
  }

  updateEnergyIconElement(element, position)
}

function hideEnergyIcon(layer, urNumber, type) {
  const element = layer.querySelector(`#${CSS.escape(getIconId(urNumber, type))}`)
  if (!element) return
  element.style.display = 'none'
  element.style.visibility = 'hidden'
}

function normalizeSemEnergiaPorUr(semEnergiaPorUr) {
  if (semEnergiaPorUr instanceof Map) return semEnergiaPorUr

  const map = new Map()
  if (semEnergiaPorUr && typeof semEnergiaPorUr === 'object') {
    Object.entries(semEnergiaPorUr).forEach(([urKey, types]) => {
      const ur = Number(urKey)
      if (!Number.isFinite(ur)) return
      const set = new Set(
        (Array.isArray(types) ? types : []).filter((t) =>
          UR_ENERGY_TYPES.includes(t),
        ),
      )
      if (set.size > 0) map.set(ur, set)
    })
  }
  return map
}

/** Atualiza ícones de falta de energia (1 = esquerda, 2 = direita). */
export function syncUrEnergyIcons(svgRoot, { semEnergiaPorUr = new Map() } = {}) {
  const svg = getSvgScope(svgRoot)
  if (!svg) return

  const layer = ensureEnergiaLayer(svg)
  const porUr = normalizeSemEnergiaPorUr(semEnergiaPorUr)

  UR_NUMBERS.forEach((urNumber) => {
    const positions = getUrEnergyIconPositions(svg, urNumber)
    const activeTypes = porUr.get(urNumber) ?? new Set()

    UR_ENERGY_TYPES.forEach((type) => {
      const show = activeTypes.has(type)
      if (!show || !positions?.[type]) {
        hideEnergyIcon(layer, urNumber, type)
        return
      }

      upsertEnergyIcon(layer, urNumber, type, positions[type])
    })
  })
}

export function removeUrEnergyIcons(svgRoot) {
  const svg = getSvgScope(svgRoot)
  if (!svg) return

  svg.querySelector(`#${CSS.escape(ENERGIA_LAYER_ID)}`)?.remove()
}

export function hasUrEnergyReference(svgRoot) {
  return Boolean(getUrGroup(svgRoot, UR_ENERGY_REFERENCE_UR))
}

export function serializeSemEnergiaPorUr(map) {
  const out = {}
  map.forEach((types, ur) => {
    if (types.size > 0) out[ur] = [...types]
  })
  return out
}

/** @deprecated use UR_ENERGY_LAYOUT_STANDARD.width */
export const UR_ENERGY_ICON_SIZE = UR_ENERGY_LAYOUT_STANDARD.width

/** @deprecated use UR_ENERGY_LAYOUT_STANDARD.gapBelow */
export const UR_ENERGY_ICON_GAP_BELOW_BTN = UR_ENERGY_LAYOUT_STANDARD.gapBelow
