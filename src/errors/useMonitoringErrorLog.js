import { useCallback, useEffect, useRef, useState } from 'react'
import { RADIO_ALERT_KIND } from '../radios/radios'
import { UR_ENERGY_TYPE } from '../urs/urEnergyIcon.constants'
import { ERROR_CATEGORY, ERROR_SEVERITY } from './monitoringErrors'

const ENERGIA_LABELS = {
  [UR_ENERGY_TYPE.FALTA_1]: 'Falta energia 1',
  [UR_ENERGY_TYPE.FALTA_2]: 'Falta energia 2',
}

function buildActiveSnapshot({
  saveError = null,
  radioAlert = null,
  failureCabos = [],
  semEnergiaPorUr = {},
} = {}) {
  const snapshot = new Map()

  if (saveError) {
    snapshot.set('config:save', {
      sourceKey: 'config:save',
      category: ERROR_CATEGORY.CONFIG,
      severity: ERROR_SEVERITY.ERROR,
      title: 'Falha ao salvar configuração',
      message: saveError,
    })
  }

  if (radioAlert) {
    const sourceKey = `radio:${radioAlert.title ?? 'alert'}`
    snapshot.set(sourceKey, {
      sourceKey,
      category: ERROR_CATEGORY.RADIO,
      severity:
        radioAlert.kind === RADIO_ALERT_KIND.UNSTABLE
          ? ERROR_SEVERITY.WARNING
          : ERROR_SEVERITY.INFO,
      title: radioAlert.title,
      message: radioAlert.detail,
    })
  }

  failureCabos.forEach((caboId) => {
    const sourceKey = `fibra:${caboId}`
    snapshot.set(sourceKey, {
      sourceKey,
      category: ERROR_CATEGORY.FIBRA,
      severity: ERROR_SEVERITY.WARNING,
      title: 'Fibra caída',
      message: caboId,
    })
  })

  Object.entries(semEnergiaPorUr).forEach(([urKey, types]) => {
    const ur = Number(urKey)
    ;(types ?? []).forEach((type) => {
      const sourceKey = `ur:${ur}:${type}`
      snapshot.set(sourceKey, {
        sourceKey,
        category: ERROR_CATEGORY.UR,
        severity: ERROR_SEVERITY.WARNING,
        title: `UR ${ur}`,
        message: ENERGIA_LABELS[type] ?? 'Falta de energia',
      })
    })
  })

  return snapshot
}

export function useMonitoringErrorLog({
  saveError = null,
  radioAlert = null,
  failureCabos = [],
  semEnergiaPorUr = {},
} = {}) {
  const [entries, setEntries] = useState([])
  const prevKeysRef = useRef(new Set())
  const seqRef = useRef(0)

  const failureKey = failureCabos.join('|')
  const energiaKey = JSON.stringify(semEnergiaPorUr)
  const radioKey = radioAlert ? `${radioAlert.title ?? ''}|${radioAlert.detail ?? ''}` : ''

  useEffect(() => {
    const snapshot = buildActiveSnapshot({
      saveError,
      radioAlert,
      failureCabos,
      semEnergiaPorUr,
    })

    const currentKeys = new Set(snapshot.keys())
    const prevKeys = prevKeysRef.current
    const newKeys = [...currentKeys].filter((key) => !prevKeys.has(key))

    if (newKeys.length > 0) {
      const now = Date.now()
      setEntries((prev) => [
        ...prev,
        ...newKeys.map((sourceKey) => {
          seqRef.current += 1
          return {
            id: `log-${seqRef.current}`,
            createdAt: now,
            ...snapshot.get(sourceKey),
          }
        }),
      ])
    }

    prevKeysRef.current = currentKeys
  }, [saveError, radioKey, failureKey, energiaKey, failureCabos, semEnergiaPorUr, radioAlert])

  const clearLog = useCallback(() => {
    setEntries([])
    prevKeysRef.current = new Set()
  }, [])

  return { entries, clearLog }
}
