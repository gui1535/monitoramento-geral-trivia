import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants'
import { colors } from '../styles/tokens'

const worldStyle = {
  position: 'relative',
  backgroundColor: colors.canvasWorld,
  backgroundImage:
    'radial-gradient(circle at 1px 1px, rgba(18, 20, 26, 0.1) 1px, transparent 0)',
  backgroundSize: '24px 24px',
  boxShadow: '0 2px 8px rgba(18, 20, 26, 0.12)',
}

export function CanvasWorld({ children }) {
  return (
    <div
      style={{
        ...worldStyle,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      }}
    >
      {children}
    </div>
  )
}
