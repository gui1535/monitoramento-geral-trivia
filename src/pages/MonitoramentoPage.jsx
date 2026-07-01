import { useCallback, useEffect, useRef, useState } from 'react'
import { DemoToolsStack } from '../components/DemoToolsStack'
import {
  MONITORING_LEGEND_COLLAPSED_OFFSET_PX,
  MONITORING_LEGEND_EXPANDED_OFFSET_PX,
  MonitoringLegend,
} from '../components/MonitoringLegend'
import { DemoMobileScreen } from '../components/DemoMobileScreen'
import { DemoPeerPanel } from '../components/DemoPeerPanel'
import { ErrorsPanel } from '../components/ErrorsPanel'
import { ReviewPlayer } from '../components/ReviewPlayer'
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
import { useMonitoringReview } from '../review/useMonitoringReview'
import { CanvasModeToolbar } from '../canvas/CanvasModeToolbar'
import { CanvasViewport } from '../canvas/CanvasViewport'
import { CanvasWorld } from '../canvas/CanvasWorld'
import { INTERACTION_MODE } from '../canvas/constants'
import { useFiberDiagram } from '../fibers/fibers'
import { useFiberNetwork } from '../fibers/useFiberNetwork'
import { useLedDiagram } from '../leds/leds'
import { formatRadioFunctioningMessage, useRadioDiagram } from '../radios/radios'
import { UrConfirmPopup } from '../components/UrConfirmPopup'
import { useUrDiagram, UR_CONNECT_DELAY_MS } from '../urs/urs'
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
  const monitoringErrorsRef = useRef([])
  const recordFrameRef = useRef(() => {})
  const svgReadyRef = useRef(false)

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

  const { entries: monitoringErrors, clearLog } = useMonitoringErrorLog({
    saveError: fiberNetwork.saveError,
    radioAlert,
    failureCabos:
      fixedFailureCabos.length > 0
        ? fixedFailureCabos
        : fiberNetwork.activeFailure.cabos,
    semEnergiaPorUr: urDiagram.semEnergiaPorUr,
  })

  monitoringErrorsRef.current = monitoringErrors

  const getCaptureContext = useCallback(
    () => ({
      semEnergiaPorUr: urDiagram.semEnergiaPorUr,
      fallenFromFiber: urDiagram.getFallenFromFiber(),
      activeUrs: urDiagram.getActiveUrs(),
      uprightChaves: urDiagram.getUprightChaves(),
      radioState: radioDiagram.captureReviewState(),
      radioAlert,
      activeFailure: fiberNetwork.activeFailure,
      fixedFailureCabos,
      errors: monitoringErrorsRef.current,
    }),
    [
      urDiagram,
      radioDiagram,
      radioAlert,
      fiberNetwork.activeFailure,
      fixedFailureCabos,
    ],
  )

  const restoreRefs = useCallback(
    (snapshot) => {
      urDiagram.restoreReviewRefs(snapshot.ur)
      radioDiagram.restoreReviewState(snapshot.radio)
      fiberNetwork.restoreActiveFailure(snapshot.react?.activeFailure)
    },
    [urDiagram, radioDiagram, fiberNetwork],
  )

  const handleRestoreReactState = useCallback((reactState) => {
    setRadioAlert(reactState.radioAlert)
    setFixedFailureCabos(reactState.fixedFailureCabos)
  }, [])

  const review = useMonitoringReview({
    getSvg: fiberDiagram.getSvg,
    fiberIds: fiberDiagram.fiberIds,
    getCaptureContext,
    restoreRefs,
    onRestoreReactState: handleRestoreReactState,
  })

  recordFrameRef.current = review.recordFrame

  const scheduleRecord = useCallback((label, delayMs = 200) => {
    window.setTimeout(() => recordFrameRef.current(label), delayMs)
  }, [])

  const handleSvgReady = useCallback(
    (svg) => {
      fiberDiagram.registerSvg(svg)
      ledDiagram.registerSvg(svg)
      radioDiagram.registerSvg(svg)
      urDiagram.registerSvg(svg)
      fiberNetwork.refreshNetworkFromSvg()
      if (!svgReadyRef.current) {
        svgReadyRef.current = true
        window.setTimeout(() => recordFrameRef.current('Estado inicial'), 500)
      }
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
    scheduleRecord('Simulação de fibra limpa')
  }, [fiberNetwork, radioDiagram, fiberDiagram, urDiagram, scheduleRecord])

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

      scheduleRecord(`Simulação fixa: ${scenario}`, 600)
    },
    [fiberDiagram, radioDiagram, urDiagram, scheduleRecord],
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
    scheduleRecord('Falta de energia limpa')
  }, [urDiagram, scheduleRecord])

  const applyRadioUnstable = useCallback(() => {
    applyRadioUnstableSimulation({
      radioDiagram,
      onRadioAlert: setRadioAlert,
    })
  }, [radioDiagram])

  const applyClearAll = useCallback(() => {
    clearLog()
    review.clearRecording()
    fiberNetwork.clearSaveError()
    applyClearFiberSimulation()
    applyClearUrSemEnergia()
    scheduleRecord('Estado inicial', 300)
  }, [
    clearLog,
    review,
    fiberNetwork,
    applyClearFiberSimulation,
    applyClearUrSemEnergia,
    scheduleRecord,
  ])

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
        onClearAll: applyClearAll,
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
      applyClearAll,
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

  const handleClearUrSemEnergia = useCallback(() => {
    if (isDemoGuest) {
      demoSend(createClearUrSemEnergiaMessage())
      return
    }
    applyClearUrSemEnergia()
  }, [applyClearUrSemEnergia, isDemoGuest, demoSend])

  const handleClearAllErrors = useCallback(() => {
    applyClearAll()
  }, [applyClearAll])

  const handleLegendExpandedChange = useCallback((expanded) => {
    setLegendOpen(expanded)
  }, [])

  const handleModeChange = useCallback(
    (mode) => {
      if (mode === INTERACTION_MODE.REVIEW) {
        review.enterReview()
        return
      }

      if (review.isReviewActive) {
        review.exitReview()
      }

      setCanvasMode(mode)
    },
    [review],
  )

  const handleReviewExit = useCallback(() => {
    review.exitReview()
    setCanvasMode(INTERACTION_MODE.NAVIGATION)
  }, [review])

  useEffect(() => {
    urDiagram.setOnUrClick((number, isActive) => {
      if (review.isReviewActive) return

      const label = isActive ? `UR ${number} conectada` : `UR ${number} desconectada`
      const delay = isActive ? UR_CONNECT_DELAY_MS + 150 : 150
      scheduleRecord(label, delay)
    })
  }, [urDiagram, review.isReviewActive, scheduleRecord])

  useEffect(() => {
    if (review.isReviewActive || !svgReadyRef.current) return

    const latest = monitoringErrors[monitoringErrors.length - 1]
    const label = latest
      ? `${latest.title}${latest.message ? `: ${latest.message}` : ''}`
      : 'Alteração no sistema'

    scheduleRecord(label, 250)
  }, [
    monitoringErrors.length,
    urDiagram.semEnergiaPorUr,
    review.isReviewActive,
    scheduleRecord,
  ])

  const displayedErrors = review.isReviewActive
    ? review.reviewErrors
    : monitoringErrors

  const interactionMode = review.isReviewActive
    ? INTERACTION_MODE.NAVIGATION
    : canvasMode

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

        <ErrorsPanel
          errors={displayedErrors}
          onClearAll={handleClearAllErrors}
          reviewActive={review.isReviewActive}
        />

        <ReviewPlayer
          visible={review.isReviewActive}
          frameCount={review.frameCount}
          currentIndex={review.currentIndex}
          currentFrame={review.currentFrame}
          reviewErrors={review.reviewErrors}
          isPlaying={review.isPlaying}
          playbackSpeed={review.playbackSpeed}
          canStepBack={review.canStepBack}
          canStepForward={review.canStepForward}
          canPlay={review.canPlay}
          onTogglePlay={review.togglePlay}
          onStepBack={review.stepBackward}
          onStepForward={review.stepForward}
          onGoToFrame={review.goToFrame}
          onCycleSpeed={review.cycleSpeed}
          onExit={handleReviewExit}
        />

        <MonitoringLegend onExpandedChange={handleLegendExpandedChange} />

        {showDemoTools && !review.isReviewActive ? (
          <DemoToolsStack
            top={demoToolsTop}
            onApplyMessage={handleRemoteDemoMessage}
            labelsVisible={fiberDiagram.cableIdLabelsVisible}
            onToggleCableIds={() =>
              fiberDiagram.setCableIdLabelsVisible(!fiberDiagram.cableIdLabelsVisible)
            }
          />
        ) : null}

        {!review.isReviewActive ? (
          <UrConfirmPopup
            urNumber={urDiagram.urConfirm?.number}
            anchorX={urDiagram.urConfirm?.x ?? 0}
            anchorY={urDiagram.urConfirm?.y ?? 0}
            action={urDiagram.urConfirm?.action}
            onConfirm={urDiagram.confirmUrAction}
            onCancel={urDiagram.cancelUrAction}
          />
        ) : null}

        <CanvasViewport
          mode={interactionMode}
          toolbar={
            <CanvasModeToolbar
              mode={canvasMode}
              onModeChange={handleModeChange}
              reviewActive={review.isReviewActive}
            />
          }
        >
          <CanvasWorld
            onSvgReady={handleSvgReady}
            interactionMode={interactionMode}
          />
        </CanvasViewport>
      </div>
    </main>
  )
}
