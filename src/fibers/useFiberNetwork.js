import { useCallback, useEffect, useRef, useState } from 'react'
import { bindFiberClicks } from './bindFiberClicks'
import {
  clearFiberFailureVisual,
  collectFibersInAlert,
} from './fiberFailure'
import { paintFiberAlert, runCascadeSimulation } from './cascadeAnimation'
import { extractFiberIdsFromSvg } from './fibers'
import {
  createEmptyNetwork,
  exportFiberNetwork,
  fetchFiberNetwork,
  getAfetados,
  getAfetadosMultiplos,
  importFiberNetwork,
  loadExampleFiberNetwork,
  mergeAfetados,
  persistFiberNetwork,
  salvarConfiguracaoCabo,
} from './fiberNetwork'

export function useFiberNetwork({ getSvg, fiberIds, interactionMode, configMode }) {
  const [network, setNetwork] = useState(() => createEmptyNetwork(fiberIds))
  const [networkLoading, setNetworkLoading] = useState(true)
  const [saveError, setSaveError] = useState(null)
  const [selectedLinkId, setSelectedLinkId] = useState(null)
  const lastFailureRef = useRef({ cabos: [], nodes: [] })
  const cancelCascadeRef = useRef(null)
  const svgFiberIdsRef = useRef(fiberIds)

  const loadNetwork = useCallback(async (ids = fiberIds) => {
    setNetworkLoading(true)
    setSaveError(null)

    try {
      const loaded = await fetchFiberNetwork(ids)
      setNetwork(loaded)
    } finally {
      setNetworkLoading(false)
    }
  }, [fiberIds])

  useEffect(() => {
    svgFiberIdsRef.current = fiberIds
    loadNetwork(fiberIds)
  }, [fiberIds, loadNetwork])

  const persistNetwork = useCallback(async (next) => {
    setNetwork(next)

    const result = await persistFiberNetwork(next)

    if (!result.saved) {
      setSaveError(
        'Não foi possível gravar no arquivo. Use npm run dev para salvar em data/config-fibra.json.',
      )
      return result
    }

    setSaveError(null)
    return result
  }, [])

  const refreshNetworkFromSvg = useCallback(async () => {
    const svg = getSvg()
    if (!svg) return

    const ids = extractFiberIdsFromSvg(svg)
    await loadNetwork(ids.length > 0 ? ids : fiberIds)
  }, [getSvg, fiberIds, loadNetwork])

  const saveLinkConfig = useCallback(
    async (caboId, dados) => {
      const next = salvarConfiguracaoCabo(caboId, dados, network)
      if (!next) return false

      await persistNetwork(next)
      return true
    },
    [network, persistNetwork],
  )

  const simulateDrop = useCallback(
    (caboIds, options = {}) => {
      const ids = Array.isArray(caboIds) ? caboIds : [caboIds]
      const svg = getSvg()
      if (!svg || ids.length === 0) return { cabos: [], nodes: [], ordem: [] }

      cancelCascadeRef.current?.()

      const resultado = getAfetadosMultiplos(ids, network)

      const caboRaiz = ids[0]
      const cabosJaEmErro = collectFibersInAlert(svg)

      cancelCascadeRef.current = runCascadeSimulation(
        svg,
        { ...resultado, raiz: caboRaiz },
        {
          intervalMs: 320,
          cabosJaEmErro,
          onReachFim: options.onReachFim,
          onComplete: (cabosFinaisVermelhos = []) => {
            const cabos = [...new Set(cabosFinaisVermelhos)]
            lastFailureRef.current = {
              cabos,
              nodes: resultado.nodes,
            }

            cabos.forEach((caboId) => paintFiberAlert(svg, caboId))
          },
        },
      )

      return { resultado, ordem: resultado.ordem, ordemVolta: resultado.ordemVolta }
    },
    [getSvg, network],
  )

  const clearSimulation = useCallback(() => {
    const svg = getSvg()
    if (!svg) return

    cancelCascadeRef.current?.()
    cancelCascadeRef.current = null
    clearFiberFailureVisual(svg, lastFailureRef.current)
    lastFailureRef.current = { cabos: [], nodes: [] }
  }, [getSvg])

  const exportNetwork = useCallback(() => exportFiberNetwork(network), [network])

  const importNetwork = useCallback(
    async (jsonText) => {
      const next = await importFiberNetwork(jsonText, svgFiberIdsRef.current)
      setNetwork(next)
      setSaveError(null)
      return next
    },
    [],
  )

  const resetNetworkStorage = useCallback(async () => {
    const next = createEmptyNetwork(svgFiberIdsRef.current)
    await persistNetwork(next)
  }, [persistNetwork])

  const loadExample = useCallback(async () => {
    const next = await loadExampleFiberNetwork(svgFiberIdsRef.current)
    setNetwork(next)
    setSaveError(null)
    return next
  }, [])

  useEffect(() => {
    const svg = getSvg()
    if (!svg) return

    const enabled = interactionMode === configMode

    bindFiberClicks(svg, {
      enabled,
      onFiberClick: (fiberId) => {
        setSelectedLinkId(fiberId)
      },
    })

    return () => {
      bindFiberClicks(svg, { enabled: false })
    }
  }, [getSvg, interactionMode, configMode])

  return {
    network,
    networkLoading,
    saveError,
    selectedLinkId,
    setSelectedLinkId,
    saveLinkConfig,
    simulateDrop,
    clearSimulation,
    exportNetwork,
    importNetwork,
    resetNetworkStorage,
    loadExample,
    refreshNetworkFromSvg,
    reloadNetwork: loadNetwork,
    getAfetados: (caboId) => getAfetados(caboId, network),
    mergeAfetados,
  }
}
