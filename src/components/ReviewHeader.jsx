import { useEffect } from 'react'
import { formatLogTimestamp } from '../errors/formatLogTimestamp'
import { colors } from '../styles/tokens'

const headerStyle = {
  flexShrink: 0,
  zIndex: 100,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '14px 20px',
  background: colors.triviaBlue,
  color: colors.triviaWhite,
  borderBottom: `1px solid rgba(255,255,255,0.15)`,
  boxShadow: '0 4px 20px rgba(2, 0, 164, 0.25)',
}

const topRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
}

const titleBlockStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minWidth: 0,
}

const titleStyle = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  opacity: 0.75,
}

const eventStyle = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
  lineHeight: 1.35,
  wordBreak: 'break-word',
}

const timeStyle = {
  margin: 0,
  fontSize: 14,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  opacity: 0.9,
}

const controlsRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
}

const btnStyle = {
  padding: '8px 14px',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  color: colors.triviaBlue,
  background: colors.triviaWhite,
  minWidth: 44,
}

const btnGhostStyle = {
  ...btnStyle,
  color: colors.triviaWhite,
  background: 'rgba(255,255,255,0.15)',
}

const btnDisabledStyle = {
  opacity: 0.4,
  cursor: 'not-allowed',
}

const counterStyle = {
  fontSize: 13,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  opacity: 0.85,
  whiteSpace: 'nowrap',
}

const sliderRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const sliderStyle = {
  flex: 1,
  minWidth: 120,
  accentColor: colors.triviaWhite,
  cursor: 'pointer',
}

function ControlButton({ label, onClick, disabled = false, ghost = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      style={{
        ...(ghost ? btnGhostStyle : btnStyle),
        ...(disabled ? btnDisabledStyle : {}),
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  )
}

export function ReviewHeader({
  frameCount,
  currentIndex,
  currentFrame,
  isPlaying,
  playbackSpeed,
  canStepBack,
  canStepForward,
  canPlay,
  onTogglePlay,
  onStepBack,
  onStepForward,
  onGoToFrame,
  onCycleSpeed,
  onExit,
}) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onStepBack?.()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        onStepForward?.()
      } else if (event.key === ' ') {
        event.preventDefault()
        onTogglePlay?.()
      } else if (event.key === 'Escape') {
        onExit?.()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onStepBack, onStepForward, onTogglePlay, onExit])

  const frameTime = currentFrame?.timestamp ?? 0

  return (
    <header style={headerStyle} role="banner" aria-label="Review de falhas">
      <div style={topRowStyle}>
        <div style={titleBlockStyle}>
          <p style={titleStyle}>Review</p>
          <p style={eventStyle}>{currentFrame?.label || 'Sem eventos registrados'}</p>
          <p style={timeStyle}>{formatLogTimestamp(frameTime)}</p>
        </div>

        <div style={controlsRowStyle}>
          <ControlButton
            label={isPlaying ? '⏸' : '▶'}
            onClick={onTogglePlay}
            disabled={!canPlay}
          />
          <ControlButton label="⏮" onClick={onStepBack} disabled={!canStepBack} ghost />
          <ControlButton label="⏭" onClick={onStepForward} disabled={!canStepForward} ghost />
          <ControlButton label={`${playbackSpeed}x`} onClick={onCycleSpeed} ghost />
          <span style={counterStyle}>
            {currentIndex + 1} / {frameCount}
          </span>
          <ControlButton label="Voltar ao monitoramento" onClick={onExit} ghost />
        </div>
      </div>

      <div style={sliderRowStyle}>
        <span style={{ fontSize: 12, opacity: 0.75, flexShrink: 0 }}>Linha do tempo</span>
        <input
          type="range"
          min={0}
          max={Math.max(0, frameCount - 1)}
          step={1}
          value={currentIndex}
          onChange={(event) => onGoToFrame?.(Number(event.target.value))}
          style={sliderStyle}
          aria-label="Navegar entre momentos do review"
        />
      </div>
    </header>
  )
}
