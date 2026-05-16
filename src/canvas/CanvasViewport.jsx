import { useEffect } from 'react'
import { colors } from '../styles/tokens'
import { useViewport } from './useViewport'

const viewportStyle = {
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  touchAction: 'none',
  userSelect: 'none',
  background: colors.canvasBg,
}

const stageStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  transformOrigin: '0 0',
  willChange: 'transform',
}

const hudStyle = {
  position: 'absolute',
  right: 16,
  bottom: 16,
  padding: '6px 10px',
  borderRadius: 6,
  fontSize: 12,
  fontFamily: 'ui-monospace, monospace',
  color: colors.textMuted,
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  boxShadow: '0 1px 3px rgba(18, 20, 26, 0.08)',
  pointerEvents: 'none',
}

export function CanvasViewport({ children }) {
  const { transform, isPanning, viewportRef, centerView, handlers } =
    useViewport()

  useEffect(() => {
    centerView()
  }, [centerView])

  return (
    <div
      ref={viewportRef}
      style={{ ...viewportStyle, cursor: isPanning ? 'grabbing' : 'grab' }}
      {...handlers}
    >
      <div
        style={{
          ...stageStyle,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {children}
      </div>

      <div style={hudStyle} aria-hidden="true">
        <span>{Math.round(transform.scale * 100)}%</span>
      </div>
    </div>
  )
}
