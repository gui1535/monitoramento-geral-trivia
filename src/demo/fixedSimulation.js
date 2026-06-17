import {
  paintFiberActive,
  paintFiberAlert,
  paintFiberNormal,
  paintFiberRealFall,
  runCascadeSimulation,
} from '../fibers/cascadeAnimation'
import { formatRadioFunctioningMessage } from '../radios/radios'

/** Cenários fixos do simulador (substituídos por backend depois). */
export const FIXED_SIM_SCENARIO = {
  LEFT_SIDE: 'left_side',
  RIGHT_SIDE: 'right_side',
}

/** Queda do lado esquerdo (cabo 37). Rádio assume o outro lado (torre estudantes / cabo 48). */
export const FIXED_RADIO_OTHER_SIDE = {
  lines: ['radio-1', 'radio-2', 'radio-4', 'radio-5', 'radio-6'],
  textos: [
    'texto-torre-estudantes',
    'texto-torre-paranapiacaba',
    'texto-torre-bras',
    'texto-torre-jaragua',
  ],
  imgs: [
    'img-torre-estudantes',
    'img-torre-paranapiacaba',
    'img-torre-bras',
    'img-torre-jaragua',
  ],
}

export const FIXED_CABO_LEFT_SIDE = 'cabo-37'

/** Cabos verdes ao cair o lado esquerdo (37 vermelho). */
export const FIXED_CABOS_FORWARD_FROM_37 = [
  'cabo-75',
  'cabo-36',
  'cabo-35',
  'cabo-76',
  'cabo-33',
  'cabo-32',
  'cabo-31',
  'cabo-77',
  'cabo-30',
  'cabo-29',
  'cabo-28',
  'cabo-78',
  'cabo-27',
  'cabo-26',
  'cabo-79',
  'cabo-70',
  'cabo-80',
  'cabo-24',
  'cabo-40',
  'cabo-41',
  'cabo-42',
  'cabo-43',
  'cabo-44',
  'cabo-45',
  'cabo-46',
  'cabo-47',
  'cabo-48',
]

/** URs que caem ao simular queda do lado direito. */
export const FIXED_URS_RIGHT_SIDE = [18, 19, 20, 21, 28, 29]

/** Cabos vermelhos (alerta) ao cair o lado direito. */
export const FIXED_CABOS_RIGHT_SIDE_ALERT = [
  'cabo-41',
  'cabo-40',
  'cabo-24',
  'cabo-80',
  'cabo-70',
  'cabo-79',
  'cabo-26',
  'cabo-27',
  'cabo-78',
  'cabo-28',
  'cabo-29',
  'cabo-30',
  'cabo-77',
  'cabo-31',
  'cabo-32',
  'cabo-33',
  'cabo-76',
  'cabo-35',
  'cabo-36',
]

/** Queda real (vermelho escuro) no lado direito. */
export const FIXED_CABOS_RIGHT_SIDE_REAL = ['cabo-37', 'cabo-42']

/** Cabos verdes ao cair o lado direito. */
export const FIXED_CABOS_RIGHT_SIDE_GREEN = [
  'cabo-43',
  'cabo-44',
  'cabo-45',
  'cabo-46',
  'cabo-47',
  'cabo-48',
]

export function applyFixedFiberColors(
  svgRoot,
  fiberIds = [],
  { vermelhos = [], quedaReal = [], verdes = [] } = {},
) {
  if (!svgRoot) return

  const vermelhoSet = new Set(vermelhos)
  const quedaSet = new Set(quedaReal)
  const verdeSet = new Set(verdes)

  fiberIds.forEach((fiberId) => {
    if (quedaSet.has(fiberId)) {
      paintFiberRealFall(svgRoot, fiberId)
    } else if (vermelhoSet.has(fiberId)) {
      paintFiberAlert(svgRoot, fiberId)
    } else if (verdeSet.has(fiberId)) {
      paintFiberActive(svgRoot, fiberId)
    } else {
      paintFiberNormal(svgRoot, fiberId)
    }
  })
}

export function applyFixedSimulation(scenario, context = {}) {
  const {
    svg,
    fiberIds = [],
    radioDiagram,
    urDiagram,
    onRadioAlert,
    onFailureCabos,
    simStateRef,
  } = context

  if (!svg) return

  if (scenario === FIXED_SIM_SCENARIO.LEFT_SIDE) {
    simStateRef?.current?.cancelCascade?.()

    if (simStateRef) {
      simStateRef.current.leftSide = true
    }

    const ordemIda = [FIXED_CABO_LEFT_SIDE, ...FIXED_CABOS_FORWARD_FROM_37]
    const ordemVolta = [...FIXED_CABOS_FORWARD_FROM_37].reverse()
    const caboFim =
      FIXED_CABOS_FORWARD_FROM_37[FIXED_CABOS_FORWARD_FROM_37.length - 1]

    const cancel = runCascadeSimulation(
      svg,
      {
        ordem: ordemIda,
        ordemVolta,
        raiz: FIXED_CABO_LEFT_SIDE,
        caboFim,
        radiosEvidentes: FIXED_RADIO_OTHER_SIDE,
      },
      {
        quedaReal: [FIXED_CABO_LEFT_SIDE],
        onReachFim: ({ radios }) => {
          const selection = radios ?? FIXED_RADIO_OTHER_SIDE
          radioDiagram?.highlightForCascade?.(selection)
          onRadioAlert?.(formatRadioFunctioningMessage(selection))
        },
        onComplete: (_vermelhos, realmenteCaidos = []) => {
          onFailureCabos?.(
            realmenteCaidos.length > 0
              ? realmenteCaidos
              : [FIXED_CABO_LEFT_SIDE],
          )
        },
      },
    )

    if (simStateRef) {
      simStateRef.current.cancelCascade = cancel
    }
    return cancel
  }

  if (scenario === FIXED_SIM_SCENARIO.RIGHT_SIDE) {
    if (simStateRef) {
      simStateRef.current.rightSide = true
    }

    applyFixedFiberColors(svg, fiberIds, {
      vermelhos: FIXED_CABOS_RIGHT_SIDE_ALERT,
      quedaReal: FIXED_CABOS_RIGHT_SIDE_REAL,
      verdes: FIXED_CABOS_RIGHT_SIDE_GREEN,
    })

    urDiagram?.fallUrsFromFiber?.(FIXED_URS_RIGHT_SIDE)
    onFailureCabos?.([
      ...FIXED_CABOS_RIGHT_SIDE_ALERT,
      ...FIXED_CABOS_RIGHT_SIDE_REAL,
    ])
    return
  }
}
