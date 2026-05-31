import { useState } from 'react'
import { INTERACTION_MODE } from './constants'
import { colors } from '../styles/tokens'

const toolbarStyle = {
  position: 'absolute',
  top: 16,
  left: 16,
  display: 'flex',
  gap: 4,
  padding: 4,
  borderRadius: 10,
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  boxShadow: '0 2px 8px rgba(18, 20, 26, 0.1)',
  pointerEvents: 'auto',
}

function modeButtonStyle(active, hovered) {
  return {
    padding: '8px 14px',
    border: 'none',
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    color: active ? colors.triviaWhite : colors.text,
    background: active
      ? colors.triviaBlue
      : hovered
        ? colors.bg
        : 'transparent',
    transition: 'background 0.15s ease, color 0.15s ease',
  }
}

function ModeButton({ label, active, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      style={modeButtonStyle(active, hovered)}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </button>
  )
}

const BASE_MODES = [
  { id: INTERACTION_MODE.NAVIGATION, label: 'Navegação' },
  { id: INTERACTION_MODE.ACTION, label: 'Ação' },
]

const FIBER_CONFIG_MODE = {
  id: INTERACTION_MODE.FIBER_CONFIG,
  label: 'Configurar fibra',
}

export function CanvasModeToolbar({ mode, onModeChange, showFiberConfig = false }) {
  const modes = showFiberConfig
    ? [...BASE_MODES, FIBER_CONFIG_MODE]
    : BASE_MODES

  return (
    <div
      style={toolbarStyle}
      role="toolbar"
      aria-label="Modo do canvas"
      onPointerDown={(event) => event.stopPropagation()}
    >
      {modes.map((item) => (
        <ModeButton
          key={item.id}
          label={item.label}
          active={mode === item.id}
          onClick={() => onModeChange(item.id)}
        />
      ))}
    </div>
  )
}
