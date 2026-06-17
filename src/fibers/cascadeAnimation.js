import {
  applyFiberUpdate,
  FIBER_STATUS,
  FIBER_STATUS_COLORS,
  normalizeCableId,
  normalizeCableIds,
} from './fibers'
import {
  buildCaminhoIdaAteFim,
  buildCaminhoVoltaCompleto,
  buildCaminhoVoltaParaRepintura,
  getNetworkLink,
  getLinkVolta,
} from './fiberNetwork'
import {
  collectFibersInAlert,
  FIBER_FALL_CLASS,
  FIBER_REAL_FALL_CLASS,
} from './fiberFailure'

function getFiberElement(svgRoot, fiberId) {
  const id = normalizeCableId(fiberId)
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
  element.classList.remove(FIBER_REAL_FALL_CLASS)
  element.classList.add(FIBER_FALL_CLASS)
  element.style.removeProperty('stroke-opacity')
  element.removeAttribute('stroke-opacity')

  const color = FIBER_STATUS_COLORS[FIBER_STATUS.ALERT]
  element.setAttribute('stroke', color)
  element.style.setProperty('stroke', color, 'important')
}

export function paintFiberRealFall(svgRoot, fiberId) {
  applyFiberUpdate(svgRoot, { id: fiberId, status: FIBER_STATUS.FALLEN })

  const element = getFiberElement(svgRoot, fiberId)
  if (!element) return

  storeOriginalStroke(element)
  element.classList.add(FIBER_FALL_CLASS, FIBER_REAL_FALL_CLASS)
  element.style.removeProperty('stroke-opacity')
  element.removeAttribute('stroke-opacity')

  const color = FIBER_STATUS_COLORS[FIBER_STATUS.FALLEN]
  element.setAttribute('stroke', color)
  element.style.setProperty('stroke', color, 'important')
}

export function paintFiberActive(svgRoot, fiberId) {
  const element = getFiberElement(svgRoot, fiberId)
  if (element) {
    element.classList.remove(FIBER_FALL_CLASS, FIBER_REAL_FALL_CLASS)
    element.style.removeProperty('stroke-opacity')
    element.removeAttribute('stroke-opacity')
  }

  applyFiberUpdate(svgRoot, { id: fiberId, status: FIBER_STATUS.ACTIVE })
}

/** Cor original do SVG — nem vermelho nem verde de simulação. */
export function paintFiberNormal(svgRoot, fiberId) {
  const element = getFiberElement(svgRoot, fiberId)
  if (!element) return

  storeOriginalStroke(element)
  element.classList.remove(FIBER_FALL_CLASS, FIBER_REAL_FALL_CLASS)
  element.style.removeProperty('stroke-opacity')
  element.removeAttribute('stroke-opacity')

  const original = element.dataset.originalStroke
  if (original) {
    element.setAttribute('stroke', original)
    element.style.setProperty('stroke', original, 'important')
  } else {
    applyFiberUpdate(svgRoot, { id: fiberId, status: FIBER_STATUS.NORMAL })
  }
}

function getCaminhoVoltaFallback(ordem, ordemVolta, raiz) {
  if (ordemVolta.length > 0) return ordemVolta
  return ordem.filter((id) => id !== raiz).reverse()
}

/** Preenche vermelho contínuo no trecho de volta até o último ponto já marcado. */
function preencherTrechoVermelhoVolta(vermelhos, raiz, caminhoVolta) {
  const trechoVolta = raiz ? [raiz, ...caminhoVolta] : caminhoVolta
  const indicesVolta = trechoVolta
    .map((id, i) => (vermelhos.has(id) ? i : -1))
    .filter((i) => i >= 0)

  if (indicesVolta.length === 0) return

  const ate = Math.max(...indicesVolta)
  for (let i = 0; i <= ate; i++) {
    if (trechoVolta[i]) vermelhos.add(trechoVolta[i])
  }
}

/**
 * Define cabos vermelhos: origem + trecho contínuo na ida/volta até cabos já caídos.
 */
export function resolveCabosVermelhos(
  resultado,
  cabosJaEmErro = [],
  network = null,
  cabosQueda = [],
) {
  const ordem = resultado.ordem ?? []
  const raiz = resultado.raiz
  const caboFim = resultado.caboFim
  const errosAnteriores = new Set(normalizeCableIds(cabosJaEmErro))
  const quedaNormalizada = normalizeCableIds(cabosQueda)
  const realmenteCaidos = new Set([...errosAnteriores, ...quedaNormalizada])
  const vermelhos = new Set()
  const primeiraQueda = errosAnteriores.size === 0

  const caminhoVolta =
    network && raiz
      ? buildCaminhoVoltaCompleto(raiz, caboFim, network, cabosJaEmErro)
      : getCaminhoVoltaFallback(ordem, resultado.ordemVolta ?? [], raiz)

  if (primeiraQueda) {
    // Primeira queda: só o caminho de ida até o fim fica vermelho; demais ramos da cascata ficam verdes.
    if (network && raiz && caboFim) {
      buildCaminhoIdaAteFim(raiz, caboFim, network).forEach((id) => {
        vermelhos.add(id)
      })
    } else {
      ordem.forEach((id) => vermelhos.add(id))
    }

    quedaNormalizada.forEach((id) => {
      vermelhos.add(id)
      realmenteCaidos.add(id)
    })
  } else {
    // Queda subsequente: trecho de volta até cabo já caído; ida à frente da raiz fica verde.
    if (raiz) vermelhos.add(normalizeCableId(raiz))

    if (raiz && network) {
      getLinkVolta(getNetworkLink(network, normalizeCableId(raiz))).forEach((id) => {
        if (id && id !== raiz) vermelhos.add(id)
      })
    }

    errosAnteriores.forEach((id) => vermelhos.add(id))

    caminhoVolta.forEach((id, i) => {
      if (!errosAnteriores.has(id)) return
      for (let j = 0; j <= i; j++) vermelhos.add(caminhoVolta[j])
    })

    preencherTrechoVermelhoVolta(vermelhos, normalizeCableId(raiz), caminhoVolta)

    quedaNormalizada.forEach((id) => {
      vermelhos.add(id)
      realmenteCaidos.add(id)
    })
  }

  const caboIdentificado =
    [...caminhoVolta].find((id) => errosAnteriores.has(id)) ??
    ordem.find((id) => errosAnteriores.has(id)) ??
    null

  return {
    cabosVermelhos: vermelhos,
    cabosRealmenteCaidos: realmenteCaidos,
    caboIdentificado,
    caminhoVolta,
  }
}

/**
 * Ida: caminho até o fim em vermelho; volta após o fim em verde (ou vermelho até cabo já caído).
 */
export function applyFiberFailureInstant(svgRoot, resultado, options = {}) {
  const {
    onComplete,
    onReachFim,
    cabosJaEmErro = [],
    cabosQueda = [],
    network = null,
  } = options

  const ordem = resultado.ordem ?? []
  const raiz = resultado.raiz
  const caboFim = resultado.caboFim

  const quedaNormalizada = normalizeCableIds(cabosQueda)
  const raizNormalizada = normalizeCableId(raiz)

  const { cabosVermelhos, cabosRealmenteCaidos, caminhoVolta } =
    resolveCabosVermelhos(
      { ...resultado, raiz: raizNormalizada || raiz },
      cabosJaEmErro,
      network,
      quedaNormalizada,
    )

  if (!svgRoot) {
    onComplete?.([...cabosVermelhos], [...cabosRealmenteCaidos])
    return () => {}
  }

  if (caboFim) {
    onReachFim?.({
      caboFim,
      radios: resultado.radiosEvidentes,
    })
  }

  const voltaParaRepintura =
    network && raiz
      ? buildCaminhoVoltaParaRepintura(raiz, caboFim, network, cabosJaEmErro)
      : caminhoVolta

  const previouslyMarked = svgRoot ? collectFibersInAlert(svgRoot) : []
  const afetados = new Set([
    ...previouslyMarked,
    ...ordem,
    ...caminhoVolta,
    ...voltaParaRepintura,
    ...cabosVermelhos,
    ...quedaNormalizada,
  ])

  afetados.forEach((fiberId) => {
    if (cabosRealmenteCaidos.has(fiberId)) {
      paintFiberRealFall(svgRoot, fiberId)
    } else if (cabosVermelhos.has(fiberId)) {
      paintFiberAlert(svgRoot, fiberId)
    } else {
      paintFiberActive(svgRoot, fiberId)
    }
  })

  quedaNormalizada.forEach((fiberId) => {
    paintFiberRealFall(svgRoot, fiberId)
  })

  onComplete?.([...cabosVermelhos], [...cabosRealmenteCaidos])
  return () => {}
}

/** Intervalo entre cada cabo na simulação de cascata (ida e volta). */
export const CASCADE_STEP_MS = 120

/**
 * Anima queda em cascata: ida vermelha até o fim, rádios ao chegar, volta verde até a origem.
 */
export function runCascadeSimulation(svgRoot, resultado, options = {}) {
  const {
    intervalMs = CASCADE_STEP_MS,
    onComplete,
    onReachFim,
    cabosJaEmErro = [],
    quedaReal = [],
  } = options

  const ordemIda = normalizeCableIds(resultado.ordem ?? [])
  const ordemVolta = normalizeCableIds(resultado.ordemVolta ?? [])
  const raiz = normalizeCableId(resultado.raiz)
  const caboFim = normalizeCableId(resultado.caboFim)
  const quedaRealSet = new Set(normalizeCableIds(quedaReal))

  if (!svgRoot || ordemIda.length === 0) {
    onComplete?.(normalizeCableIds(cabosJaEmErro), [...quedaRealSet])
    return () => {}
  }

  let cancelled = false
  let timerId = null
  const errosAnteriores = new Set(normalizeCableIds(cabosJaEmErro))
  const cabosVermelhos = new Set(errosAnteriores)

  errosAnteriores.forEach((fiberId) => paintFiberAlert(svgRoot, fiberId))

  function syncTodosVermelhos() {
    cabosVermelhos.forEach((fiberId) => {
      paintFiberAlert(svgRoot, fiberId)
    })
  }

  function marcarVermelho(fiberId) {
    const id = normalizeCableId(fiberId)
    if (!id) return

    cabosVermelhos.add(id)
    paintFiberAlert(svgRoot, id)
  }

  function marcarVerde(fiberId) {
    const id = normalizeCableId(fiberId)
    if (!id || errosAnteriores.has(id) || id === raiz) return

    cabosVermelhos.delete(id)
    paintFiberActive(svgRoot, id)
  }

  function finalize() {
    ordemIda.forEach((fiberId) => {
      if (fiberId !== raiz) marcarVerde(fiberId)
    })

    cabosVermelhos.clear()
    errosAnteriores.forEach((fiberId) => cabosVermelhos.add(fiberId))

    if (raiz) {
      cabosVermelhos.add(raiz)
      if (quedaRealSet.has(raiz)) {
        paintFiberRealFall(svgRoot, raiz)
      } else {
        paintFiberAlert(svgRoot, raiz)
      }
    }

    quedaRealSet.forEach((fiberId) => {
      cabosVermelhos.add(fiberId)
      paintFiberRealFall(svgRoot, fiberId)
    })

    onComplete?.([...cabosVermelhos], [...quedaRealSet])
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
