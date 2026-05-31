import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants'
import { CanvasDiagramBase } from './CanvasDiagramBase'
import { CanvasOverlay } from './CanvasOverlay'
import { colors } from '../styles/tokens'

const worldStyle = {
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: colors.canvasWorld,
  boxShadow: '0 2px 8px rgba(18, 20, 26, 0.08)',
}

export function CanvasWorld({ overlay = null, onSvgReady, interactionMode }) {
  return (
    <div
      style={{
        ...worldStyle,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      }}
    >
      <CanvasDiagramBase
        onSvgReady={onSvgReady}
        interactionMode={interactionMode}
      />
      <CanvasOverlay>{overlay}</CanvasOverlay>
    </div>
  )
}
