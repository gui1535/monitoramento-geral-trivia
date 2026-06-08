export const DEMO_SYNC_TYPE = {
  FIBER_DROP: 'fiber_drop',
  CLEAR_SIMULATION: 'clear_simulation',
  UR_SEM_ENERGIA: 'ur_sem_energia',
  CLEAR_UR_SEM_ENERGIA: 'clear_ur_sem_energia',
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
    caboIds: Array.isArray(caboIds) ? caboIds : [caboIds],
  }
}

export function createClearSimulationMessage() {
  return { type: DEMO_SYNC_TYPE.CLEAR_SIMULATION }
}

export function createUrSemEnergiaMessage(ur, energyType, ativo) {
  return {
    type: DEMO_SYNC_TYPE.UR_SEM_ENERGIA,
    ur,
    energyType,
    ativo: Boolean(ativo),
  }
}

export function createClearUrSemEnergiaMessage() {
  return { type: DEMO_SYNC_TYPE.CLEAR_UR_SEM_ENERGIA }
}

export function applyDemoSyncMessage(message, handlers = {}) {
  if (!message?.type) return

  switch (message.type) {
    case DEMO_SYNC_TYPE.FIBER_DROP:
      handlers.onFiberDrop?.(message.caboIds ?? [])
      break
    case DEMO_SYNC_TYPE.CLEAR_SIMULATION:
      handlers.onClearSimulation?.()
      break
    case DEMO_SYNC_TYPE.UR_SEM_ENERGIA:
      handlers.onUrSemEnergia?.(message.ur, message.energyType, message.ativo)
      break
    case DEMO_SYNC_TYPE.CLEAR_UR_SEM_ENERGIA:
      handlers.onClearUrSemEnergia?.()
      break
    default:
      break
  }
}
