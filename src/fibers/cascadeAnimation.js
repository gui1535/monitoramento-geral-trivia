import {
  applyFiberUpdate,
  FIBER_STATUS,
  FIBER_STATUS_COLORS,
  normalizeFiberId,
} from './fibers'
import { FIBER_FALL_CLASS } from './fiberFailure'

function getFiberElement(svgRoot, fiberId) {
  const id = normalizeFiberId(fiberId)
  const scope =
    svgRoot instanceof SVGSVGElement ? svgRoot : svgRoot?.querySelector('svg')
  if (!scope || !id) return null

  return scope.querySelector(`#${CSS.escape(id)}`)
}

function storeOriginalStroke(element) {
  if (element.dataset.originalStroke === undefined) {
    element.dataset.originalStroke = element.getAttribute('stroke') || ''
  }
}

export function paintFiberAlert(svgRoot, fiberId) {
  applyFiberUpdate(svgRoot, { id: fiberId, status: FIBER_STATUS.ALERT })

  const element = getFiberElement(svgRoot, fiberId)
  if (!element) return

  storeOriginalStroke(element)
  element.classList.add(FIBER_FALL_CLASS)

  const color = FIBER_STATUS_COLORS[FIBER_STATUS.ALERT]
  element.setAttribute('stroke', color)
  element.style.setProperty('stroke', color, 'important')
}

export function paintFiberActive(svgRoot, fiberId) {
  const element = getFiberElement(svgRoot, fiberId)
  if (element) {
    element.classList.remove(FIBER_FALL_CLASS)
  }

  applyFiberUpdate(svgRoot, { id: fiberId, status: FIBER_STATUS.ACTIVE })
}

export function runCascadeSimulation(svgRoot, resultado, options = {}) {
  const {
    intervalMs = 320,
    onComplete,
    onReachFim,
    cabosJaEmErro = [],
  } = options

  const ordemIda = resultado.ordem ?? []
  const ordemVolta = resultado.ordemVolta ?? []
  const raiz = resultado.raiz
  const caboFim = resultado.caboFim

  if (!svgRoot || ordemIda.length === 0) {
    onComplete?.([...cabosJaEmErro])
    return () => {}
  }

  let cancelled = false
  let timerId = null
  const errosAnteriores = new Set(cabosJaEmErro)
  const cabosVermelhos = new Set(errosAnteriores)

  errosAnteriores.forEach((fiberId) => paintFiberAlert(svgRoot, fiberId))

  function syncTodosVermelhos() {
    cabosVermelhos.forEach((fiberId) => paintFiberAlert(svgRoot, fiberId))
  }

  function marcarVermelho(fiberId) {
    cabosVermelhos.add(fiberId)
    syncTodosVermelhos()
  }

  function marcarVerde(fiberId) {
    if (errosAnteriores.has(fiberId)) return

    cabosVermelhos.delete(fiberId)
    paintFiberActive(svgRoot, fiberId)
  }

  function finalize() {
    ordemIda.forEach((fiberId) => {
      if (fiberId !== raiz) marcarVerde(fiberId)
    })

    cabosVermelhos.clear()
    errosAnteriores.forEach((fiberId) => cabosVermelhos.add(fiberId))

    if (raiz) {
      cabosVermelhos.add(raiz)
    }

    syncTodosVermelhos()
    onComplete?.([...cabosVermelhos])
  }

  function startVolta(indexVolta) {
    if (cancelled) return

    if (indexVolta >= ordemVolta.length) {
      finalize()
      return
    }

    marcarVerde(ordemVolta[indexVolta])

    timerId = window.setTimeout(() => {
      startVolta(indexVolta + 1)
    }, intervalMs)
  }

  function startIda(indexIda) {
    if (cancelled) return

    if (indexIda >= ordemIda.length) {
      if (ordemVolta.length > 0) {
        startVolta(0)
      } else {
        finalize()
      }
      return
    }

    const fiberId = ordemIda[indexIda]
    marcarVermelho(fiberId)

    if (caboFim && fiberId === caboFim) {
      onReachFim?.({
        caboFim,
        radios: resultado.radiosEvidentes,
      })
    }

    timerId = window.setTimeout(() => {
      startIda(indexIda + 1)
    }, intervalMs)
  }

  startIda(0)

  return () => {
    cancelled = true
    if (timerId) window.clearTimeout(timerId)
  }
}
