import { useCallback, useEffect, useState } from 'react'
import { FiberConfigPanel } from '../components/FiberConfigPanel'
import { FiberTestFab } from '../components/FiberTestFab'
import { RadioFunctioningAlert } from '../components/RadioFunctioningAlert'
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

const FIBER_DROP_CABLE_ID = 'cabo-37'

const dropFiberBtnStyle = {
  position: 'absolute',
  top: 16,
  right: 16,
  zIndex: 31,
  padding: '10px 16px',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  color: '#ffffff',
  background: '#c62828',
  boxShadow: '0 2px 8px rgba(198, 40, 40, 0.35)',
  cursor: 'pointer',
  pointerEvents: 'auto',
}

export function MonitoramentoPage() {
  const [testMode] = useState(() => isTestModeEnabled())
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

  const handleSimulateFiberDrop = useCallback(
    (caboIds) => {
      fiberNetwork.simulateDrop(caboIds, {
        onReachFim: ({ radios }) => {
          radioDiagram.highlightForCascade(radios)
          setRadioAlert(formatRadioFunctioningMessage(radios))
        },
      })
    },
    [fiberNetwork, radioDiagram],
  )

  const handleClearFiberSimulation = useCallback(() => {
    fiberNetwork.clearSimulation()
    radioDiagram.clearCascadeHighlight()
    fiberDiagram.reset(fiberDiagram.fiberIds)
    setRadioAlert(null)
  }, [fiberNetwork, radioDiagram, fiberDiagram])

  const dismissRadioAlert = useCallback(() => {
    setRadioAlert(null)
  }, [])

  const handleSaveLinkConfig = useCallback(
    (caboId, dados) => {
      fiberNetwork.saveLinkConfig(caboId, dados)
    },
    [fiberNetwork],
  )

  const handleTestDrop = useCallback(
    (caboId) => {
      handleSimulateFiberDrop([caboId])
    },
    [handleSimulateFiberDrop],
  )

  return (
    <main style={pageStyle}>
      <div style={bodyStyle}>
        <RadioFunctioningAlert alert={radioAlert} onDismiss={dismissRadioAlert} />

        <UrConfirmPopup
          urNumber={urDiagram.urConfirm?.number}
          anchorX={urDiagram.urConfirm?.x ?? 0}
          anchorY={urDiagram.urConfirm?.y ?? 0}
          action={urDiagram.urConfirm?.action}
          onConfirm={urDiagram.confirmUrAction}
          onCancel={urDiagram.cancelUrAction}
        />

        <button
          type="button"
          style={dropFiberBtnStyle}
          onClick={() => handleSimulateFiberDrop([FIBER_DROP_CABLE_ID])}
          onPointerDown={(e) => e.stopPropagation()}
        >
          Cair fibra
        </button>

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

        {testMode && (
        <FiberTestFab
          setFibers={fiberDiagram.setFibers}
          fiberIds={fiberDiagram.fiberIds}
          cableIdLabelsVisible={fiberDiagram.cableIdLabelsVisible}
          setCableIdLabelsVisible={fiberDiagram.setCableIdLabelsVisible}
          setLeds={ledDiagram.setLeds}
          ledPairs={ledDiagram.ledPairs}
          applyVisibility={radioDiagram.applyVisibility}
          radioLineOptions={radioDiagram.radioLineOptions}
          torreTextoOptions={radioDiagram.torreTextoOptions}
          torreImgOptions={radioDiagram.torreImgOptions}
          resetRadios={radioDiagram.resetRadios}
          network={fiberNetwork.network}
          onSimulateFiberDrop={handleSimulateFiberDrop}
          onClearFiberSimulation={handleClearFiberSimulation}
          onExportNetwork={fiberNetwork.exportNetwork}
          onImportNetwork={fiberNetwork.importNetwork}
          getAfetadosPreview={(caboId) => fiberNetwork.getAfetados(caboId)}
          onLoadExampleNetwork={fiberNetwork.loadExample}
        />
        )}
      </div>
    </main>
  )
}
