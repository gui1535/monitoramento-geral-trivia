import { UR_ENERGY_TYPE } from '../urs/urEnergyIcon.constants'

export const ERROR_CATEGORY = {
  FIBRA: 'fibra',
  UR: 'ur',
  RADIO: 'radio',
  CONFIG: 'config',
  SISTEMA: 'sistema',
}

export const ERROR_CATEGORY_LABELS = {
  [ERROR_CATEGORY.FIBRA]: 'Fibra',
  [ERROR_CATEGORY.UR]: 'UR',
  [ERROR_CATEGORY.RADIO]: 'Rádio',
  [ERROR_CATEGORY.CONFIG]: 'Configuração',
  [ERROR_CATEGORY.SISTEMA]: 'Sistema',
}

export const ERROR_SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
}

const ENERGIA_LABELS = {
  [UR_ENERGY_TYPE.FALTA_1]: 'Falta energia 1',
  [UR_ENERGY_TYPE.FALTA_2]: 'Falta energia 2',
}

export function buildMonitoringErrors({
  saveError = null,
  radioAlert = null,
  failureCabos = [],
  semEnergiaPorUr = {},
} = {}) {
  const items = []
  let seq = 0
  const nextId = (prefix) => `${prefix}-${++seq}`

  if (saveError) {
    items.push({
      id: nextId('config'),
      category: ERROR_CATEGORY.CONFIG,
      severity: ERROR_SEVERITY.ERROR,
      title: 'Falha ao salvar configuração',
      message: saveError,
    })
  }

  if (radioAlert) {
    items.push({
      id: nextId('radio'),
      category: ERROR_CATEGORY.RADIO,
      severity: ERROR_SEVERITY.INFO,
      title: radioAlert.title,
      message: radioAlert.detail,
    })
  }

  failureCabos.forEach((caboId) => {
    items.push({
      id: nextId(`fibra-${caboId}`),
      category: ERROR_CATEGORY.FIBRA,
      severity: ERROR_SEVERITY.WARNING,
      title: 'Fibra caída',
      message: caboId,
    })
  })

  Object.entries(semEnergiaPorUr).forEach(([urKey, types]) => {
    const ur = Number(urKey)
    ;(types ?? []).forEach((type) => {
      items.push({
        id: nextId(`ur-${ur}-${type}`),
        category: ERROR_CATEGORY.UR,
        severity: ERROR_SEVERITY.WARNING,
        title: `UR ${ur}`,
        message: ENERGIA_LABELS[type] ?? 'Falta de energia',
      })
    })
  })

  return items
}

function startOfDay(dateValue) {
  if (!dateValue) return null
  const [year, month, day] = dateValue.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0).getTime()
}

function endOfDay(dateValue) {
  if (!dateValue) return null
  const [year, month, day] = dateValue.split('-').map(Number)
  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime()
}

export function isWithinDateRange(createdAt, { dateFrom = '', dateTo = '' } = {}) {
  if (dateFrom) {
    const from = startOfDay(dateFrom)
    if (createdAt < from) return false
  }

  if (dateTo) {
    const to = endOfDay(dateTo)
    if (createdAt > to) return false
  }

  return true
}

export function filterMonitoringErrors(
  errors,
  { search = '', category = 'all', dateFrom = '', dateTo = '', formatTimestamp } = {},
) {
  const term = search.trim().toLowerCase()

  return errors.filter((item) => {
    if (category !== 'all' && item.category !== category) return false
    if (!isWithinDateRange(item.createdAt, { dateFrom, dateTo })) return false
    if (!term) return true

    const timeLabel = formatTimestamp?.(item.createdAt) ?? ''
    const haystack = `${timeLabel} ${item.title} ${item.message} ${ERROR_CATEGORY_LABELS[item.category] ?? ''}`
      .toLowerCase()
      .trim()

    return haystack.includes(term)
  })
}
