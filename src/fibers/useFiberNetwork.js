import { useCallback, useEffect, useRef, useState } from 'react'
import { bindUrConfigClicks } from '../urs/bindUrConfigClicks'
import { extractUrCableIdsFromSvg } from '../urs/urRules'
import { bindFiberClicks } from './bindFiberClicks'
import {
  clearFiberFailureVisual,
  collectFibersInAlert,
  collectFibersRealFall,
} from './fiberFailure'
import { applyFiberFailureInstant } from './cascadeAnimation'
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
  salvarConfiguracaoUr,
} from './fiberNetwork'

export function useFiberNetwork({ getSvg, fiberIds, interactionMode, configMode }) {
  const [network, setNetwork] = useState(() => createEmptyNetwork(fiberIds))
  const [networkLoading, setNetworkLoading] = useState(true)
  const [saveError, setSaveError] = useState(null)
  const [selectedLinkId, setSelectedLinkId] = useState(null)
  const [selectedUrNumber, setSelectedUrNumber] = useState(null)
  const [urCableIds, setUrCableIds] = useState([])
  const [activeFailure, setActiveFailure] = useState({ cabos: [], nodes: [] })
  const lastFailureRef = useRef({ cabos: [], nodes: [] })
  const svgFiberIdsRef = useRef(fiberIds)

  const loadNetwork = useCallback(async (ids = fiberIds, urIds = urCableIds) => {
    setNetworkLoading(true)
    setSaveError(null)

    try {
      const loaded = await fetchFiberNetwork(ids, urIds)
      setNetwork(loaded)
    } finally {
      setNetworkLoading(false)
    }
  }, [fiberIds, urCableIds])

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
    const urIds = extractUrCableIdsFromSvg(svg)
    setUrCableIds(urIds)
    await loadNetwork(ids.length > 0 ? ids : fiberIds, urIds)
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

  const saveUrRuleConfig = useCallback(
    async (urNumber, dados) => {
      const next = salvarConfiguracaoUr(urNumber, dados, network)
      if (!next) return false

      await persistNetwork(next)
      return true
    },
    [network, persistNetwork],
  )

  const simulateDrop = useCallback(
    (caboIds, options = {}) => {
      const ids = (Array.isArray(caboIds) ? caboIds : [caboIds]).filter(Boolean)
      const svg = getSvg()
      if (!svg || ids.length === 0) return { cabos: [], nodes: [], ordem: [] }

      let lastResultado = { cabos: [], nodes: [], ordem: [], ordemVolta: [] }

      ids.forEach((caboId) => {
        const resultado = getAfetadosMultiplos([caboId], network)
        lastResultado = resultado

        const cabosJaEmErro = [
          ...new Set([
            ...collectFibersRealFall(svg),
            ...lastFailureRef.current.cabos,
          ]),
        ]

        applyFiberFailureInstant(
          svg,
          { ...resultado, raiz: caboId },
          {
            network,
            cabosJaEmErro,
            cabosQueda: [caboId],
            onReachFim: options.onReachFim,
            onComplete: (cabosVermelhos = [], cabosRealmenteCaidos = []) => {
              const cabos = [...new Set(cabosRealmenteCaidos)]
              const failure = { cabos, nodes: resultado.nodes }
              lastFailureRef.current = failure
              setActiveFailure(failure)
              const vermelhos = [
                ...new Set([
                  ...cabosVermelhos,
                  ...collectFibersInAlert(svg),
                ]),
              ]
              options.onAfterFiberFailure?.(vermelhos)
            },
          },
        )
      })

      return {
        resultado: lastResultado,
        ordem: lastResultado.ordem,
        ordemVolta: lastResultado.ordemVolta,
      }
    },
    [getSvg, network],
  )

  const clearSimulation = useCallback(() => {
    const svg = getSvg()
    if (!svg) return

    clearFiberFailureVisual(svg, lastFailureRef.current)
    lastFailureRef.current = { cabos: [], nodes: [] }
    setActiveFailure({ cabos: [], nodes: [] })
  }, [getSvg])

  const clearSaveError = useCallback(() => {
    setSaveError(null)
  }, [])

  const exportNetwork = useCallback(() => exportFiberNetwork(network), [network])

  const importNetwork = useCallback(
    async (jsonText) => {
      const next = await importFiberNetwork(
        jsonText,
        svgFiberIdsRef.current,
        urCableIds,
      )
      setNetwork(next)
      setSaveError(null)
      return next
    },
    [urCableIds],
  )

  const resetNetworkStorage = useCallback(async () => {
    const next = createEmptyNetwork(svgFiberIdsRef.current, urCableIds)
    await persistNetwork(next)
  }, [persistNetwork, urCableIds])

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
        setSelectedUrNumber(null)
      },
    })

    bindUrConfigClicks(svg, {
      enabled,
      onUrClick: (urNumber) => {
        setSelectedUrNumber(urNumber)
        setSelectedLinkId(null)
      },
    })

    return () => {
      bindFiberClicks(svg, { enabled: false })
      bindUrConfigClicks(svg, { enabled: false })
    }
  }, [getSvg, interactionMode, configMode])

  return {
    network,
    networkLoading,
    saveError,
    clearSaveError,
    activeFailure,
    selectedLinkId,
    setSelectedLinkId,
    selectedUrNumber,
    setSelectedUrNumber,
    urCableIds,
    saveLinkConfig,
    saveUrRuleConfig,
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
