import { useState } from 'react'
import {
  DEMO_PRESET_VARIANT,
  DEMO_PRESETS,
  runDemoPreset,
} from '../demo/demoPresets'
import { colors } from '../styles/tokens'

const panelStyle = {
  width: '100%',
  padding: 14,
  borderRadius: 12,
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  boxShadow: '0 8px 24px rgba(18, 20, 26, 0.15)',
  boxSizing: 'border-box',
}

const titleStyle = {
  margin: '0 0 10px',
  fontSize: 13,
  fontWeight: 600,
  color: colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const btnStyle = (variant) => {
  const backgrounds = {
    [DEMO_PRESET_VARIANT.DANGER]: '#c62828',
    [DEMO_PRESET_VARIANT.WARNING]: '#e65100',
  }

  return {
    width: '100%',
    padding: '10px 12px',
    marginBottom: 8,
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'left',
    cursor: 'pointer',
    color: colors.triviaWhite,
    background: backgrounds[variant] ?? colors.triviaBlue,
  }
}

const feedbackStyle = {
  margin: '0 0 8px',
  padding: '6px 10px',
  borderRadius: 8,
  fontSize: 12,
  color: '#1b5e20',
  background: '#e8f5e9',
}

export function DemoTestPanel({ onApplyMessage }) {
  const [lastAction, setLastAction] = useState(null)

  function handleRun(preset) {
    runDemoPreset(preset, onApplyMessage)
    setLastAction(preset.label)
    window.setTimeout(() => setLastAction(null), 2000)
  }

  return (
    <aside
      style={panelStyle}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label="Simulador de demonstração"
    >
      <h3 style={titleStyle}>Simulador</h3>

      {lastAction && <p style={feedbackStyle}>Aplicado: {lastAction}</p>}

      {DEMO_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          style={btnStyle(preset.variant)}
          onClick={() => handleRun(preset)}
        >
          {preset.label}
        </button>
      ))}
    </aside>
  )
}
