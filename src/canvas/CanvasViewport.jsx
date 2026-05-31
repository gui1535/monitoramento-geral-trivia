import { useEffect } from 'react'
import { colors } from '../styles/tokens'
import { INTERACTION_MODE } from './constants'
import { getCanvasCursor } from './interaction'
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

const chromeStyle = {
  position: 'absolute',
  inset: 0,
  zIndex: 20,
  pointerEvents: 'none',
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
  zIndex: 20,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
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

const modeLabels = {
  [INTERACTION_MODE.NAVIGATION]: 'Navegação',
  [INTERACTION_MODE.ACTION]: 'Ação',
}

const touchSurfaceStyle = {
  position: 'absolute',
  inset: 0,
  zIndex: 10,
  touchAction: 'none',
  WebkitTouchCallout: 'none',
  WebkitUserSelect: 'none',
}

export function CanvasViewport({ mode = INTERACTION_MODE.NAVIGATION, toolbar, children }) {
  const {
    transform,
    isPanning,
    viewportRef,
    touchSurfaceRef,
    fitToViewport,
    mouseHandlers,
    showTouchSurface,
  } = useViewport(mode)

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    let fitted = false

    const observer = new ResizeObserver(() => {
      if (fitted || viewport.clientWidth === 0 || viewport.clientHeight === 0) {
        return
      }

      fitToViewport()
      fitted = true
      observer.disconnect()
    })

    observer.observe(viewport)

    return () => observer.disconnect()
  }, [fitToViewport, viewportRef])

  const cursor = getCanvasCursor(mode, isPanning)

  return (
    <div ref={viewportRef} style={viewportStyle}>
      <div style={chromeStyle}>{toolbar}</div>

      <div
        style={{
          ...stageStyle,
          cursor,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {children}
      </div>

      {showTouchSurface ? (
        <div
          ref={touchSurfaceRef}
          style={touchSurfaceStyle}
          aria-hidden="true"
          {...mouseHandlers}
        />
      ) : null}

      <div style={hudStyle} aria-hidden="true">
        <span>{modeLabels[mode]}</span>
        <span>·</span>
        <span>{Math.round(transform.scale * 100)}%</span>
      </div>
    </div>
  )
}
