import { useLayoutEffect, useRef, useState } from 'react'
import { colors } from '../styles/tokens'

const POPUP_WIDTH = 240
const POPUP_OFFSET = 12
const VIEWPORT_PAD = 8

const popupStyle = {
  position: 'fixed',
  zIndex: 55,
  width: POPUP_WIDTH,
  padding: '14px 16px',
  borderRadius: 10,
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  boxShadow: '0 10px 32px rgba(18, 20, 26, 0.22)',
  pointerEvents: 'auto',
}

const messageStyle = {
  margin: '0 0 12px',
  fontSize: 14,
  lineHeight: 1.45,
  color: colors.text,
}

const actionsStyle = {
  display: 'flex',
  gap: 8,
  justifyContent: 'flex-end',
}

function btnStyle(variant) {
  return {
    padding: '8px 16px',
    border: variant === 'yes' ? 'none' : `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    color: variant === 'yes' ? colors.triviaWhite : colors.text,
    background: variant === 'yes' ? colors.triviaBlue : colors.surface,
  }
}

function clampPosition(anchorX, anchorY, width, height) {
  let left = anchorX + POPUP_OFFSET
  let top = anchorY + POPUP_OFFSET

  if (left + width > window.innerWidth - VIEWPORT_PAD) {
    left = anchorX - width - POPUP_OFFSET
  }

  if (top + height > window.innerHeight - VIEWPORT_PAD) {
    top = anchorY - height - POPUP_OFFSET
  }

  left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - width - VIEWPORT_PAD))
  top = Math.max(VIEWPORT_PAD, Math.min(top, window.innerHeight - height - VIEWPORT_PAD))

  return { left, top }
}

export function UrConfirmPopup({
  urNumber,
  anchorX,
  anchorY,
  action = 'connect',
  onConfirm,
  onCancel,
}) {
  const popupRef = useRef(null)
  const [position, setPosition] = useState({ left: anchorX, top: anchorY })

  useLayoutEffect(() => {
    const element = popupRef.current
    if (!element) return

    const { width, height } = element.getBoundingClientRect()
    setPosition(clampPosition(anchorX, anchorY, width, height))
  }, [anchorX, anchorY, urNumber])

  if (urNumber == null) return null

  return (
    <div
      ref={popupRef}
      style={{ ...popupStyle, left: position.left, top: position.top }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ur-confirm-title"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <p id="ur-confirm-title" style={messageStyle}>
        {action === 'connect' ? (
          <>
            Deseja conectar a <strong>UR {urNumber}</strong>?
          </>
        ) : (
          <>
            Tem certeza que deseja desconectar a <strong>UR {urNumber}</strong>?
          </>
        )}
      </p>
      <div style={actionsStyle}>
        <button type="button" style={btnStyle('no')} onClick={onCancel}>
          Não
        </button>
        <button type="button" style={btnStyle('yes')} onClick={onConfirm}>
          Sim
        </button>
      </div>
    </div>
  )
}
