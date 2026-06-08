import { ERROR_CATEGORY_LABELS } from './monitoringErrors'

function pad(value) {
  return String(value).padStart(2, '0')
}

export function formatLogFilenameDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`
}

export function buildErrorLogText(entries, { formatTimestamp } = {}) {
  return entries
    .map((item) => {
      const time = formatTimestamp?.(item.createdAt) ?? '—'
      const category = ERROR_CATEGORY_LABELS[item.category] ?? item.category
      const message = item.message ? ` — ${item.message}` : ''
      return `[${time}] [${category}] ${item.title}${message}`
    })
    .join('\n')
}

export function downloadErrorLogTxt(entries, { formatTimestamp, filenamePrefix = 'log-monitoramento' } = {}) {
  if (entries.length === 0) return false

  const content = buildErrorLogText(entries, { formatTimestamp })
  const filename = `${filenamePrefix}-${formatLogFilenameDate()}.txt`
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  return true
}
