import {
  applyFiberUpdate,
  FIBER_STATUS,
  FIBER_STATUS_COLORS,
  normalizeFiberId,
} from './fibers'
import {
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
  }

  applyFiberUpdate(svgRoot, { id: fiberId, status: FIBER_STATUS.ACTIVE })
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
  const errosAnteriores = new Set(cabosJaEmErro)
  const realmenteCaidos = new Set([
    ...errosAnteriores,
    ...cabosQueda.filter(Boolean),
  ])
  const vermelhos = new Set()
  const primeiraQueda = errosAnteriores.size === 0

  const caminhoVolta =
    network && raiz
      ? buildCaminhoVoltaCompleto(raiz, caboFim, network, cabosJaEmErro)
      : getCaminhoVoltaFallback(ordem, resultado.ordemVolta ?? [], raiz)

  if (primeiraQueda) {
    // Primeira queda: ida até o fim em vermelho; retorno (volta) em verde.
    ordem.forEach((id) => vermelhos.add(id))

    if (network && raiz && caboFim) {
      buildCaminhoVoltaParaRepintura(raiz, caboFim, network, []).forEach((id) => {
        if (id !== raiz) vermelhos.delete(id)
      })
    }
  } else {
    // Queda subsequente: trecho de volta até cabo já caído; ida à frente da raiz fica verde.
    if (raiz) vermelhos.add(raiz)

    if (raiz && network) {
      getLinkVolta(getNetworkLink(network, raiz)).forEach((id) => {
        if (id && id !== raiz) vermelhos.add(id)
      })
    }

    errosAnteriores.forEach((id) => vermelhos.add(id))

    caminhoVolta.forEach((id, i) => {
      if (!errosAnteriores.has(id)) return
      for (let j = 0; j <= i; j++) vermelhos.add(caminhoVolta[j])
    })

    preencherTrechoVermelhoVolta(vermelhos, raiz, caminhoVolta)
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

  const { cabosVermelhos, cabosRealmenteCaidos, caminhoVolta } =
    resolveCabosVermelhos(resultado, cabosJaEmErro, network, cabosQueda)

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

  onComplete?.([...cabosVermelhos], [...cabosRealmenteCaidos])
  return () => {}
}
