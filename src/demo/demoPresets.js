import {
  createFixedSimulationMessage,
  createRadioUnstableMessage,
  createUrSemEnergiaMessage,
} from './demoSyncMessages'
import { FIXED_SIM_SCENARIO } from './fixedSimulation'
import { UR_ENERGY_TYPE } from '../urs/urEnergyIcon.constants'

export const DEMO_PRESET_VARIANT = {
  DANGER: 'danger',
  WARNING: 'warning',
  NEUTRAL: 'neutral',
}

/** Cenários fixos do simulador — lógica hardcoded até integrar backend. */
export const DEMO_PRESETS = [
  {
    id: 'ur-18-ctc-1',
    label: 'Cair energia CTC 1',
    description: 'Falta de energia 1 na UR 18',
    variant: DEMO_PRESET_VARIANT.WARNING,
    getMessages: () => [
      createUrSemEnergiaMessage(18, UR_ENERGY_TYPE.FALTA_1, true),
    ],
  },
  {
    id: 'ur-18-ctc-2',
    label: 'Cair energia CTC 2',
    description: 'Falta de energia 2 na UR 18',
    variant: DEMO_PRESET_VARIANT.WARNING,
    getMessages: () => [
      createUrSemEnergiaMessage(18, UR_ENERGY_TYPE.FALTA_2, true),
    ],
  },
  {
    id: 'left-side',
    label: 'Cair lado esquerdo',
    description: 'Queda no cabo 37; rádio assume o outro lado',
    variant: DEMO_PRESET_VARIANT.DANGER,
    getMessages: () => [
      createFixedSimulationMessage(FIXED_SIM_SCENARIO.LEFT_SIDE),
    ],
  },
  {
    id: 'right-side',
    label: 'Cair lado direito',
    description: 'Trecho direito vermelho; 37 e 42 queda real',
    variant: DEMO_PRESET_VARIANT.DANGER,
    getMessages: () => [
      createFixedSimulationMessage(FIXED_SIM_SCENARIO.RIGHT_SIDE),
    ],
  },
  {
    id: 'radio-unstable',
    label: 'Rádio instável',
    description: 'Simula falha/instabilidade no enlace de rádio',
    variant: DEMO_PRESET_VARIANT.WARNING,
    getMessages: () => [createRadioUnstableMessage()],
  },
]

export function runDemoPreset(preset, send) {
  const messages = preset.getMessages?.() ?? []
  messages.forEach((message) => send(message))
}
