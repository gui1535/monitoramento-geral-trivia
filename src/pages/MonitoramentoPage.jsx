import { useCallback, useEffect, useMemo, useState } from 'react'
import { DemoMobileScreen } from '../components/DemoMobileScreen'
import { DemoPeerPanel } from '../components/DemoPeerPanel'
import { FiberConfigPanel } from '../components/FiberConfigPanel'
import { ErrorsPanel } from '../components/ErrorsPanel'
import {
  applyDemoSyncMessage,
  createClearSimulationMessage,
  createClearUrSemEnergiaMessage,
  createFiberDropMessage,
} from '../demo/demoSyncMessages'
import { DEMO_PEER_ROLE, useDemoPeerSync } from '../demo/useDemoPeerSync'
import { useMonitoringErrorLog } from '../errors/useMonitoringErrorLog'
import { CanvasModeToolbar } from '../canvas/CanvasModeToolbar'
import { CanvasViewport } from '../canvas/CanvasViewport'
import { CanvasWorld } from '../canvas/CanvasWorld'
import { INTERACTION_MODE } from '../canvas/constants'
import { useFiberDiagram } from '../fibers/fibers'
import { useFiberNetwork } from '../fibers/useFiberNetwork'
import { useLedDiagram } from '../leds/leds'
import { formatRadioFunctioningMessage, useRadioDiagram } from '../radios/radios'
import { UrConfirmPopup } from '../components/UrConfirmPopup'
import { UrRuleConfigPanel } from '../components/UrRuleConfigPanel'
import { getUrRuleFromNetwork } from '../urs/urRules'
import { useUrDiagram } from '../urs/urs'
import { isMobileDevice } from '../utils/isMobileDevice'
import { isTestModeEnabled } from '../utils/testMode'
const pageStyle = {
  width: '100%',
  height: '100%',
  minHeight: '100svh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const bodyStyle = {
  flex: 1,
  minHeight: 0,
  position: 'relative',
}

export function MonitoramentoPage() {
  const [testMode] = useState(() => isTestModeEnabled())
  const [isMobileClient] = useState(() => isMobileDevice())
  const [canvasMode, setCanvasMode] = useState(INTERACTION_MODE.NAVIGATION)
  const [radioAlert, setRadioAlert] = useState(null)

  useEffect(() => {
    if (!testMode && canvasMode === INTERACTION_MODE.FIBER_CONFIG) {
      setCanvasMode(INTERACTION_MODE.NAVIGATION)
    }
  }, [testMode, canvasMode])
  const fiberDiagram = useFiberDiagram()
  const ledDiagram = useLedDiagram()
  const radioDiagram = useRadioDiagram()
  const urDiagram = useUrDiagram(
    canvasMode === INTERACTION_MODE.FIBER_CONFIG
      ? INTERACTION_MODE.NAVIGATION
      : canvasMode,
  )

  const fiberNetwork = useFiberNetwork({
    getSvg: fiberDiagram.getSvg,
    fiberIds: fiberDiagram.fiberIds,
    interactionMode: canvasMode,
    configMode: INTERACTION_MODE.FIBER_CONFIG,
  })

  const handleSvgReady = useCallback(
    (svg) => {
      fiberDiagram.registerSvg(svg)
      ledDiagram.registerSvg(svg)
      radioDiagram.registerSvg(svg)
      urDiagram.registerSvg(svg)
      fiberNetwork.refreshNetworkFromSvg()
    },
    [
      fiberDiagram,
      ledDiagram,
      radioDiagram,
      urDiagram,
      fiberNetwork.refreshNetworkFromSvg,
    ],
  )

  const applyFiberDrop = useCallback(
    (caboIds) => {
      fiberNetwork.simulateDrop(caboIds, {
        onReachFim: ({ radios }) => {
          radioDiagram.highlightForCascade(radios)
          setRadioAlert(formatRadioFunctioningMessage(radios))
        },
        onAfterFiberFailure: (vermelhos) => {
          urDiagram.syncUrFallsFromFibers(vermelhos, fiberNetwork.network.urRules)
        },
      })
    },
    [fiberNetwork, radioDiagram, urDiagram],
  )

  const applyClearFiberSimulation = useCallback(() => {
    fiberNetwork.clearSimulation()
    urDiagram.clearUrFallsFromFiberSimulation()
    radioDiagram.clearCascadeHighlight()
    fiberDiagram.reset(fiberDiagram.fiberIds)
    setRadioAlert(null)
  }, [fiberNetwork, radioDiagram, fiberDiagram, urDiagram])

  const applySetUrSemEnergia = useCallback(
    (urNumber, type, ativo) => {
      urDiagram.setUrSemEnergia(urNumber, type, ativo)
    },
    [urDiagram],
  )

  const applyClearUrSemEnergia = useCallback(() => {
    urDiagram.clearAllUrSemEnergia()
  }, [urDiagram])

  const handleRemoteDemoMessage = useCallback(
    (message) => {
      applyDemoSyncMessage(message, {
        onFiberDrop: applyFiberDrop,
        onClearSimulation: applyClearFiberSimulation,
        onUrSemEnergia: applySetUrSemEnergia,
        onClearUrSemEnergia: applyClearUrSemEnergia,
      })
    },
    [
      applyFiberDrop,
      applyClearFiberSimulation,
      applySetUrSemEnergia,
      applyClearUrSemEnergia,
    ],
  )

  const demoSync = useDemoPeerSync({ onMessage: handleRemoteDemoMessage })
  const { canSend: demoCanSend, send: demoSend, isGuest: isDemoGuest } = demoSync

  const sendGuestDemoAction = useCallback(
    (message) => {
      demoSend(message)
    },
    [demoSend],
  )

  const handleSimulateFiberDrop = useCallback(
    (caboIds) => {
      if (isDemoGuest) {
        demoSend(createFiberDropMessage(caboIds))
        return
      }
      applyFiberDrop(caboIds)
    },
    [applyFiberDrop, isDemoGuest, demoSend],
  )

  const handleClearFiberSimulation = useCallback(() => {
    if (isDemoGuest) {
      demoSend(createClearSimulationMessage())
      return
    }
    applyClearFiberSimulation()
  }, [applyClearFiberSimulation, isDemoGuest, demoSend])

  const dismissRadioAlert = useCallback(() => {
    setRadioAlert(null)
  }, [])

  const handleSaveLinkConfig = useCallback(
    (caboId, dados) => {
      fiberNetwork.saveLinkConfig(caboId, dados)
    },
    [fiberNetwork],
  )

  const handleSaveUrRuleConfig = useCallback(
    (urNumber, dados) => {
      fiberNetwork.saveUrRuleConfig(urNumber, dados)
    },
    [fiberNetwork],
  )

  const urCableOptions = useMemo(
    () =>
      [
        ...new Set([
          ...fiberDiagram.fiberIds,
          ...fiberNetwork.urCableIds,
        ]),
      ].sort(),
    [fiberDiagram.fiberIds, fiberNetwork.urCableIds],
  )

  const handleTestDrop = useCallback(
    (caboId) => {
      handleSimulateFiberDrop([caboId])
    },
    [handleSimulateFiberDrop],
  )

  const handleClearUrSemEnergia = useCallback(() => {
    if (isDemoGuest) {
      demoSend(createClearUrSemEnergiaMessage())
      return
    }
    applyClearUrSemEnergia()
  }, [applyClearUrSemEnergia, isDemoGuest, demoSend])

  const { entries: monitoringErrors, clearLog } = useMonitoringErrorLog({
    saveError: fiberNetwork.saveError,
    radioAlert,
    failureCabos: fiberNetwork.activeFailure.cabos,
    semEnergiaPorUr: urDiagram.semEnergiaPorUr,
  })

  const handleClearAllErrors = useCallback(() => {
    clearLog()
    dismissRadioAlert()
    fiberNetwork.clearSaveError()
    handleClearFiberSimulation()
    handleClearUrSemEnergia()
  }, [
    clearLog,
    dismissRadioAlert,
    fiberNetwork,
    handleClearFiberSimulation,
    handleClearUrSemEnergia,
  ])

  const showMobileControl =
    isMobileClient && demoSync.role !== DEMO_PEER_ROLE.HOST

  if (showMobileControl) {
    return (
      <main style={pageStyle}>
        <DemoMobileScreen sync={demoSync} onSend={sendGuestDemoAction} />
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={bodyStyle}>
        <DemoPeerPanel sync={demoSync} />

        <ErrorsPanel errors={monitoringErrors} onClearAll={handleClearAllErrors} />

        <UrConfirmPopup
          urNumber={urDiagram.urConfirm?.number}
          anchorX={urDiagram.urConfirm?.x ?? 0}
          anchorY={urDiagram.urConfirm?.y ?? 0}
          action={urDiagram.urConfirm?.action}
          onConfirm={urDiagram.confirmUrAction}
          onCancel={urDiagram.cancelUrAction}
        />

        <CanvasViewport
          mode={canvasMode}
          toolbar={
            <CanvasModeToolbar
              mode={canvasMode}
              onModeChange={setCanvasMode}
              showFiberConfig={testMode}
            />
          }
        >
          <CanvasWorld
            onSvgReady={handleSvgReady}
            interactionMode={canvasMode}
          />
        </CanvasViewport>

        {testMode && (
        <UrRuleConfigPanel
          visible={canvasMode === INTERACTION_MODE.FIBER_CONFIG}
          urNumber={fiberNetwork.selectedUrNumber}
          rule={
            fiberNetwork.selectedUrNumber
              ? getUrRuleFromNetwork(
                  fiberNetwork.network,
                  fiberNetwork.selectedUrNumber,
                )
              : null
          }
          cableOptions={urCableOptions}
          networkLoading={fiberNetwork.networkLoading}
          saveError={fiberNetwork.saveError}
          onSave={handleSaveUrRuleConfig}
          onClose={() => fiberNetwork.setSelectedUrNumber(null)}
        />
        )}

        {testMode && (
        <FiberConfigPanel
          visible={canvasMode === INTERACTION_MODE.FIBER_CONFIG}
          linkId={fiberNetwork.selectedLinkId}
          network={fiberNetwork.network}
          fiberIds={fiberDiagram.fiberIds}
          networkLoading={fiberNetwork.networkLoading}
          saveError={fiberNetwork.saveError}
          radioLineOptions={radioDiagram.radioLineOptions}
          torreTextoOptions={radioDiagram.torreTextoOptions}
          torreImgOptions={radioDiagram.torreImgOptions}
          onSave={handleSaveLinkConfig}
          onClose={() => fiberNetwork.setSelectedLinkId(null)}
          onTestDrop={handleTestDrop}
        />
        )}

      </div>
    </main>
  )
}
