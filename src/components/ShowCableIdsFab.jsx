import { colors } from '../styles/tokens'

const fabStyle = (active, fullWidth) => ({
  width: fullWidth ? '100%' : 'auto',
  padding: '10px 14px',
  border: active ? 'none' : `1px solid ${colors.border}`,
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  color: active ? colors.triviaWhite : colors.text,
  background: active ? colors.triviaBlue : colors.surface,
  boxShadow: '0 2px 8px rgba(18, 20, 26, 0.2)',
  cursor: 'pointer',
  pointerEvents: 'auto',
  boxSizing: 'border-box',
})

export function ShowCableIdsFab({ labelsVisible, onToggle, fullWidth = false }) {
  return (
    <button
      type="button"
      style={fabStyle(labelsVisible, fullWidth)}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onToggle}
      aria-pressed={labelsVisible}
    >
      {labelsVisible ? 'Ocultar IDs' : 'Mostrar IDs'}
    </button>
  )
}
