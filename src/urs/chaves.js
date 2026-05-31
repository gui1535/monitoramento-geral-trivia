export const CHAVE_NUMBERS = Array.from({ length: 39 }, (_, i) => i + 1)

export const CHAVE_UPPER_MIN = 17

const CHAVE_LOWER_TRANSLATE =  { x: -5, y: 4 }
const CHAVE_UPPER_TRANSLATE ={ x: 5, y: -5 }

const chaveClickHandlers = new WeakMap()

export function getChaveId(number) {
  return `chave-ur-${number}`
}

function getSvgScope(svgRoot) {
  return svgRoot instanceof SVGSVGElement
    ? svgRoot
    : svgRoot?.querySelector('svg')
}

export function getChaveGroup(svgRoot, number) {
  const scope = getSvgScope(svgRoot)
  if (!scope) return null

  return scope.querySelector(`#${CSS.escape(getChaveId(number))}`)
}

export function isChaveUpright(group) {
  return group?.dataset.chaveUpright === 'true'
}

function storeChavePivot(group) {
  if (group.dataset.chaveCx !== undefined) return

  const bbox = group.getBBox()
  group.dataset.chaveCx = String(bbox.x + bbox.width / 2)
  group.dataset.chaveCy = String(bbox.y + bbox.height / 2)
}

function storeOriginalTransform(group) {
  if (group.dataset.originalTransform === undefined) {
    group.dataset.originalTransform = group.getAttribute('transform') ?? ''
  }
}

function getUprightTransform(number, cx, cy) {
  const rotate = `rotate(-90 ${cx} ${cy})`
  const { x, y } =
    number >= CHAVE_UPPER_MIN ? CHAVE_UPPER_TRANSLATE : CHAVE_LOWER_TRANSLATE

  return `${rotate} translate(${x} ${y})`
}

export function applyChaveUpright(svgRoot, number, upright = true) {
  const group = getChaveGroup(svgRoot, number)
  if (!group) return false

  storeOriginalTransform(group)
  storeChavePivot(group)

  const cx = group.dataset.chaveCx
  const cy = group.dataset.chaveCy

  if (upright) {
    group.setAttribute('transform', getUprightTransform(number, cx, cy))
    group.dataset.chaveUpright = 'true'
    return true
  }

  const original = group.dataset.originalTransform
  if (original) {
    group.setAttribute('transform', original)
  } else {
    group.removeAttribute('transform')
  }

  group.dataset.chaveUpright = 'false'
  return true
}

export function toggleChaveUpright(svgRoot, number) {
  const group = getChaveGroup(svgRoot, number)
  if (!group) return null

  const nextUpright = !isChaveUpright(group)
  applyChaveUpright(svgRoot, number, nextUpright)
  return nextUpright
}

export function bindChaves(svgRoot) {
  if (!svgRoot) return

  CHAVE_NUMBERS.forEach((number) => {
    const group = getChaveGroup(svgRoot, number)
    if (!group) return

    const existingHandler = chaveClickHandlers.get(group)
    if (existingHandler) {
      group.removeEventListener('click', existingHandler)
      chaveClickHandlers.delete(group)
    }

    group.style.pointerEvents = 'none'
    group.style.cursor = 'default'

    group.querySelectorAll('rect').forEach((rect) => {
      rect.style.pointerEvents = 'none'
    })
  })
}
