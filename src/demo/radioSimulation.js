import { formatRadioUnstableMessage } from '../radios/radios'

/** Enlace de rádio instável (demo fixa até integrar backend). */
export const FIXED_RADIO_UNSTABLE = {
  lines: ['radio-2', 'radio-3', 'radio-4', 'radio-5', 'radio-6'],
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

export function applyRadioUnstableSimulation(context = {}) {
  const { radioDiagram, onRadioAlert } = context

  radioDiagram?.simulateUnstable?.(FIXED_RADIO_UNSTABLE)
  onRadioAlert?.(formatRadioUnstableMessage(FIXED_RADIO_UNSTABLE))
}
