import { UR_ENERGY_TYPE } from '../urs/urEnergyIcon.constants'
import {
  createClearSimulationMessage,
  createClearUrSemEnergiaMessage,
  createFiberDropMessage,
  createUrSemEnergiaMessage,
} from './demoSyncMessages'

export const DEMO_PRESET_VARIANT = {
  DANGER: 'danger',
  WARNING: 'warning',
  NEUTRAL: 'neutral',
}

/** Cenários prontos enviados ao PC — sem seleção manual no celular. */
export const DEMO_PRESETS = [
  {
    id: 'fiber-37',
    label: 'Cair fibra',
    description: 'Queda no cabo 37',
    variant: DEMO_PRESET_VARIANT.DANGER,
    getMessages: () => [createFiberDropMessage(['cabo-37'])],
  },
  {
    id: 'fiber-42',
    label: 'Cair fibra (cabo 42)',
    description: 'Segunda queda em cascata',
    variant: DEMO_PRESET_VARIANT.DANGER,
    getMessages: () => [createFiberDropMessage(['cabo-42'])],
  },
  {
    id: 'fiber-37-42',
    label: 'Cair fibras 37 e 42',
    description: 'Duas quedas de uma vez',
    variant: DEMO_PRESET_VARIANT.DANGER,
    getMessages: () => [createFiberDropMessage(['cabo-37', 'cabo-42'])],
  },
  {
    id: 'ur-energy-2-falta1',
    label: 'Cair energia da UR 2',
    description: 'Falta energia 1 (esquerda)',
    variant: DEMO_PRESET_VARIANT.WARNING,
    getMessages: () => [
      createUrSemEnergiaMessage(2, UR_ENERGY_TYPE.FALTA_1, true),
    ],
  },
  {
    id: 'ur-energy-2-falta2',
    label: 'Cair energia UR 2 (lado 2)',
    description: 'Falta energia 2 (direita)',
    variant: DEMO_PRESET_VARIANT.WARNING,
    getMessages: () => [
      createUrSemEnergiaMessage(2, UR_ENERGY_TYPE.FALTA_2, true),
    ],
  },
  {
    id: 'ur-energy-2-both',
    label: 'Cair energia UR 2 (ambos)',
    description: 'Falta energia 1 e 2',
    variant: DEMO_PRESET_VARIANT.WARNING,
    getMessages: () => [
      createUrSemEnergiaMessage(2, UR_ENERGY_TYPE.FALTA_1, true),
      createUrSemEnergiaMessage(2, UR_ENERGY_TYPE.FALTA_2, true),
    ],
  },
]

export const DEMO_CLEAR_PRESETS = [
  {
    id: 'clear-fiber',
    label: 'Restaurar fibras',
    description: 'Remove quedas simuladas',
    variant: DEMO_PRESET_VARIANT.NEUTRAL,
    getMessages: () => [createClearSimulationMessage()],
  },
  {
    id: 'clear-ur-energy',
    label: 'Restaurar energia URs',
    description: 'Liga energia em todas',
    variant: DEMO_PRESET_VARIANT.NEUTRAL,
    getMessages: () => [createClearUrSemEnergiaMessage()],
  },
  {
    id: 'clear-all',
    label: 'Limpar tudo',
    description: 'Fibras e energia',
    variant: DEMO_PRESET_VARIANT.NEUTRAL,
    getMessages: () => [
      createClearSimulationMessage(),
      createClearUrSemEnergiaMessage(),
    ],
  },
]

export function runDemoPreset(preset, send) {
  const messages = preset.getMessages?.() ?? []
  messages.forEach((message) => send(message))
}
