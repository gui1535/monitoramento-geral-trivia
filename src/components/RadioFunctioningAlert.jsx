import { RADIO_OK_COLOR } from '../radios/radios'
import { colors } from '../styles/tokens'

const bannerStyle = {
  position: 'absolute',
  bottom: 16,
  right: 16,
  zIndex: 45,
  width: 'min(340px, calc(100vw - 32px))',
  padding: '14px 16px 14px 18px',
  borderRadius: 12,
  background: colors.surface,
  border: `2px solid ${RADIO_OK_COLOR}`,
  boxShadow: '0 8px 28px rgba(0, 255, 72, 0.25)',
  pointerEvents: 'auto',
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
}

const iconStyle = {
  flexShrink: 0,
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: RADIO_OK_COLOR,
  color: colors.triviaWhite,
  fontSize: 16,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
}

const titleStyle = {
  margin: 0,
  fontSize: 15,
  fontWeight: 600,
  color: colors.text,
}

const detailStyle = {
  margin: '4px 0 0',
  fontSize: 13,
  lineHeight: 1.45,
  color: colors.textMuted,
}

const closeBtnStyle = {
  flexShrink: 0,
  marginLeft: 'auto',
  padding: '2px 8px',
  border: 'none',
  borderRadius: 6,
  background: 'transparent',
  color: colors.textMuted,
  fontSize: 18,
  lineHeight: 1,
  cursor: 'pointer',
}

export function RadioFunctioningAlert({ alert, onDismiss }) {
  if (!alert) return null

  return (
    <div style={bannerStyle} role="alert" aria-live="assertive">
      <span style={iconStyle} aria-hidden>
        ✓
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={titleStyle}>{alert.title}</p>
        <p style={detailStyle}>{alert.detail}</p>
      </div>
      <button
        type="button"
        style={closeBtnStyle}
        onClick={onDismiss}
        aria-label="Fechar alerta"
      >
        ×
      </button>
    </div>
  )
}
