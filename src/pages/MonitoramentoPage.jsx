import { useCallback, useRef, useState } from 'react'
import { DemoToolsStack } from '../components/DemoToolsStack'
import {
  MONITORING_LEGEND_COLLAPSED_OFFSET_PX,
  MONITORING_LEGEND_EXPANDED_OFFSET_PX,
  MonitoringLegend,
} from '../components/MonitoringLegend'
import { DemoMobileScreen } from '../components/DemoMobileScreen'
import { DemoPeerPanel } from '../components/DemoPeerPanel'
import { ErrorsPanel } from '../components/ErrorsPanel'
import {
  applyDemoSyncMessage,
  createClearSimulationMessage,
  createClearUrSemEnergiaMessage,
  createFiberDropMessage,
} from '../demo/demoSyncMessages'
import { DEMO_PEER_ROLE, useDemoPeerSync } from '../demo/useDemoPeerSync'
import { applyFixedSimulation } from '../demo/fixedSimulation'
import { applyRadioUnstableSimulation } from '../demo/radioSimulation'
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
  const [isMobileClient] = useState(() => isMobileDevice())
  const [showDemoTools] = useState(() => isTestModeEnabled())
  const [legendOpen, setLegendOpen] = useState(false)
  const [canvasMode, setCanvasMode] = useState(INTERACTION_MODE.NAVIGATION)
  const [radioAlert, setRadioAlert] = useState(null)
  const [fixedFailureCabos, setFixedFailureCabos] = useState([])
  const fixedSimStateRef = useRef({
    leftSide: false,
    rightSide: false,
    cancelCascade: null,
  })

  const fiberDiagram = useFiberDiagram()
  const ledDiagram = useLedDiagram()
  const radioDiagram = useRadioDiagram()
  const urDiagram = useUrDiagram(canvasMode)

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
    fixedSimStateRef.current.cancelCascade?.()
    fiberNetwork.clearSimulation()
    urDiagram.clearUrFallsFromFiberSimulation()
    radioDiagram.clearCascadeHighlight()
    radioDiagram.clearUnstable()
    radioDiagram.resetRadios()
    fiberDiagram.reset(fiberDiagram.fiberIds)
    fixedSimStateRef.current = {
      leftSide: false,
      rightSide: false,
      cancelCascade: null,
    }
    setFixedFailureCabos([])
    setRadioAlert(null)
  }, [fiberNetwork, radioDiagram, fiberDiagram, urDiagram])

  const applyFixedSimScenario = useCallback(
    (scenario) => {
      const svg = fiberDiagram.getSvg()
      if (!svg) return

      fixedSimStateRef.current.cancelCascade?.()

      applyFixedSimulation(scenario, {
        svg,
        fiberIds: fiberDiagram.fiberIds,
        radioDiagram,
        urDiagram,
        simStateRef: fixedSimStateRef,
        onRadioAlert: setRadioAlert,
        onFailureCabos: setFixedFailureCabos,
      })
    },
    [fiberDiagram, radioDiagram, urDiagram],
  )

  const applySetUrSemEnergia = useCallback(
    (urNumber, type, ativo) => {
      urDiagram.setUrSemEnergia(urNumber, type, ativo)
    },
    [urDiagram],
  )

  const applySetUrSemEnergiaBatch = useCallback(
    (urNumber, energyTypes, ativo) => {
      urDiagram.setUrSemEnergiaBatch(urNumber, energyTypes, ativo)
    },
    [urDiagram],
  )

  const applyClearUrSemEnergia = useCallback(() => {
    urDiagram.clearAllUrSemEnergia()
  }, [urDiagram])

  const applyRadioUnstable = useCallback(() => {
    applyRadioUnstableSimulation({
      radioDiagram,
      onRadioAlert: setRadioAlert,
    })
  }, [radioDiagram])

  const handleRemoteDemoMessage = useCallback(
    (message) => {
      applyDemoSyncMessage(message, {
        onFiberDrop: applyFiberDrop,
        onFixedSimulation: applyFixedSimScenario,
        onClearSimulation: applyClearFiberSimulation,
        onUrSemEnergia: applySetUrSemEnergia,
        onUrSemEnergiaBatch: applySetUrSemEnergiaBatch,
        onClearUrSemEnergia: applyClearUrSemEnergia,
        onRadioUnstable: applyRadioUnstable,
      })
    },
    [
      applyFiberDrop,
      applyFixedSimScenario,
      applyClearFiberSimulation,
      applySetUrSemEnergia,
      applySetUrSemEnergiaBatch,
      applyClearUrSemEnergia,
      applyRadioUnstable,
    ],
  )

  const demoSync = useDemoPeerSync({ onMessage: handleRemoteDemoMessage })
  const { send: demoSend, isGuest: isDemoGuest } = demoSync

  const sendGuestDemoAction = useCallback(
    (message) => {
      demoSend(message)
    },
    [demoSend],
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
    failureCabos:
      fixedFailureCabos.length > 0
        ? fixedFailureCabos
        : fiberNetwork.activeFailure.cabos,
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

  const handleLegendExpandedChange = useCallback((expanded) => {
    setLegendOpen(expanded)
  }, [])

  const demoToolsTop = legendOpen
    ? MONITORING_LEGEND_EXPANDED_OFFSET_PX
    : MONITORING_LEGEND_COLLAPSED_OFFSET_PX

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

        <MonitoringLegend onExpandedChange={handleLegendExpandedChange} />

        {showDemoTools ? (
          <DemoToolsStack
            top={demoToolsTop}
            onApplyMessage={handleRemoteDemoMessage}
            labelsVisible={fiberDiagram.cableIdLabelsVisible}
            onToggleCableIds={() =>
              fiberDiagram.setCableIdLabelsVisible(!fiberDiagram.cableIdLabelsVisible)
            }
          />
        ) : null}

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
            />
          }
        >
          <CanvasWorld
            onSvgReady={handleSvgReady}
            interactionMode={canvasMode}
          />
        </CanvasViewport>
      </div>
    </main>
  )
}
