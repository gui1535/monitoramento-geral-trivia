import { normalizeCableIds } from '../fibers/fibers'

export const DEMO_SYNC_TYPE = {
  FIBER_DROP: 'fiber_drop',
  CLEAR_SIMULATION: 'clear_simulation',
  FIXED_SIMULATION: 'fixed_simulation',
  UR_SEM_ENERGIA: 'ur_sem_energia',
  UR_SEM_ENERGIA_BATCH: 'ur_sem_energia_batch',
  CLEAR_UR_SEM_ENERGIA: 'clear_ur_sem_energia',
  RADIO_UNSTABLE: 'radio_unstable',
  CLEAR_ALL: 'clear_all',
}

export function normalizeRoomCode(code) {
  return String(code ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

export function isValidRoomCode(code) {
  return normalizeRoomCode(code).length >= 4
}

export function toPeerId(roomCode) {
  return `monitoramento-${normalizeRoomCode(roomCode)}`
}

export function generateRoomCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function createFiberDropMessage(caboIds) {
  return {
    type: DEMO_SYNC_TYPE.FIBER_DROP,
    caboIds: normalizeCableIds(caboIds),
  }
}

export function createClearSimulationMessage() {
  return { type: DEMO_SYNC_TYPE.CLEAR_SIMULATION }
}

export function createFixedSimulationMessage(scenario) {
  return {
    type: DEMO_SYNC_TYPE.FIXED_SIMULATION,
    scenario: String(scenario ?? ''),
  }
}

export function createUrSemEnergiaMessage(ur, energyType, ativo) {
  return {
    type: DEMO_SYNC_TYPE.UR_SEM_ENERGIA,
    ur: Number(ur),
    energyType,
    ativo: Boolean(ativo),
  }
}

export function createUrSemEnergiaBatchMessage(ur, energyTypes, ativo = true) {
  return {
    type: DEMO_SYNC_TYPE.UR_SEM_ENERGIA_BATCH,
    ur: Number(ur),
    energyTypes: Array.isArray(energyTypes) ? energyTypes : [],
    ativo: Boolean(ativo),
  }
}

export function createClearUrSemEnergiaMessage() {
  return { type: DEMO_SYNC_TYPE.CLEAR_UR_SEM_ENERGIA }
}

export function createRadioUnstableMessage() {
  return { type: DEMO_SYNC_TYPE.RADIO_UNSTABLE }
}

export function createClearAllMessage() {
  return { type: DEMO_SYNC_TYPE.CLEAR_ALL }
}

export function applyDemoSyncMessage(message, handlers = {}) {
  if (!message?.type) return

  switch (message.type) {
    case DEMO_SYNC_TYPE.FIBER_DROP:
      handlers.onFiberDrop?.(normalizeCableIds(message.caboIds ?? []))
      break
    case DEMO_SYNC_TYPE.CLEAR_SIMULATION:
      handlers.onClearSimulation?.()
      break
    case DEMO_SYNC_TYPE.FIXED_SIMULATION:
      handlers.onFixedSimulation?.(message.scenario)
      break
    case DEMO_SYNC_TYPE.UR_SEM_ENERGIA:
      handlers.onUrSemEnergia?.(
        Number(message.ur),
        message.energyType,
        message.ativo,
      )
      break
    case DEMO_SYNC_TYPE.UR_SEM_ENERGIA_BATCH:
      handlers.onUrSemEnergiaBatch?.(
        Number(message.ur),
        message.energyTypes ?? [],
        message.ativo,
      )
      break
    case DEMO_SYNC_TYPE.CLEAR_UR_SEM_ENERGIA:
      handlers.onClearUrSemEnergia?.()
      break
    case DEMO_SYNC_TYPE.RADIO_UNSTABLE:
      handlers.onRadioUnstable?.()
      break
    case DEMO_SYNC_TYPE.CLEAR_ALL:
      handlers.onClearAll?.()
      break
    default:
      break
  }
}
