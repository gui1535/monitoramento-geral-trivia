import { useEffect } from 'react'
import { formatLogTimestamp } from '../errors/formatLogTimestamp'
import { ERROR_CATEGORY_LABELS } from '../errors/monitoringErrors'
import { colors } from '../styles/tokens'

const barStyle = {
  position: 'absolute',
  left: 16,
  right: 16,
  bottom: 16,
  zIndex: 60,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '14px 16px',
  borderRadius: 12,
  background: 'rgba(18, 20, 26, 0.92)',
  border: `1px solid ${colors.border}`,
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35)',
  pointerEvents: 'auto',
  color: colors.triviaWhite,
}

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
}

const btnStyle = {
  padding: '8px 12px',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  color: colors.triviaWhite,
  background: colors.triviaBlue,
  minWidth: 40,
}

const btnGhostStyle = {
  ...btnStyle,
  background: 'rgba(255,255,255,0.12)',
}

const btnDisabledStyle = {
  opacity: 0.35,
  cursor: 'not-allowed',
}

const labelStyle = {
  flex: 1,
  minWidth: 120,
  fontSize: 13,
  lineHeight: 1.4,
  color: 'rgba(255,255,255,0.9)',
}

const timeStyle = {
  fontSize: 12,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  color: 'rgba(255,255,255,0.65)',
  whiteSpace: 'nowrap',
}

const sliderStyle = {
  width: '100%',
  accentColor: colors.triviaBlue,
  cursor: 'pointer',
}

const eventListStyle = {
  maxHeight: 72,
  overflowY: 'auto',
  margin: 0,
  padding: '6px 0 0',
  listStyle: 'none',
  fontSize: 12,
  color: 'rgba(255,255,255,0.75)',
}

const eventItemStyle = (active) => ({
  padding: '4px 0',
  opacity: active ? 1 : 0.55,
  borderBottom: '1px solid rgba(255,255,255,0.08)',
})

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

export function ReviewPlayer({
  visible,
  frameCount,
  currentIndex,
  currentFrame,
  reviewErrors,
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
    if (!visible) return undefined

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
  }, [visible, onStepBack, onStepForward, onTogglePlay, onExit])

  if (!visible) return null

  const progress = frameCount > 1 ? currentIndex / (frameCount - 1) : 0
  const startTime = currentFrame?.timestamp ?? 0

  return (
    <div
      style={barStyle}
      role="region"
      aria-label="Modo review — reprodução de falhas"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div style={rowStyle}>
        <ControlButton
          label={isPlaying ? '⏸' : '▶'}
          onClick={onTogglePlay}
          disabled={!canPlay}
        />
        <ControlButton label="⏮" onClick={onStepBack} disabled={!canStepBack} ghost />
        <ControlButton label="⏭" onClick={onStepForward} disabled={!canStepForward} ghost />
        <ControlButton
          label={`${playbackSpeed}x`}
          onClick={onCycleSpeed}
          ghost
        />
        <span style={labelStyle}>
          {currentFrame?.label || 'Sem eventos'}
        </span>
        <span style={timeStyle}>
          {formatLogTimestamp(startTime)} · {currentIndex + 1}/{frameCount}
        </span>
        <ControlButton label="Sair" onClick={onExit} ghost />
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(0, frameCount - 1)}
        step={1}
        value={currentIndex}
        onChange={(event) => onGoToFrame?.(Number(event.target.value))}
        style={sliderStyle}
        aria-label="Linha do tempo do review"
      />

      {reviewErrors.length > 0 && (
        <ul style={eventListStyle} aria-label="Falhas até este momento">
          {reviewErrors.slice(-4).map((item, index) => {
            const isLatest = index === Math.min(3, reviewErrors.length - 1)
            return (
              <li key={item.id} style={eventItemStyle(isLatest)}>
                <button
                  type="button"
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    display: 'block',
                    width: '100%',
                  }}
                  onClick={() => onGoToFrame?.(currentIndex)}
                >
                  {formatLogTimestamp(item.createdAt)} — {item.title}
                  {item.message ? `: ${item.message}` : ''}
                  {' · '}
                  {ERROR_CATEGORY_LABELS[item.category] ?? item.category}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
