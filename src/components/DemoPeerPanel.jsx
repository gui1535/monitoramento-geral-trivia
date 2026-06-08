import { useState } from 'react'
import { DEMO_PEER_ROLE, DEMO_PEER_STATUS } from '../demo/useDemoPeerSync'
import { generateRoomCode, isValidRoomCode } from '../demo/demoSyncMessages'
import { colors } from '../styles/tokens'

const panelStyle = {
  position: 'absolute',
  bottom: 16,
  left: 16,
  zIndex: 50,
  width: 'min(320px, calc(100vw - 32px))',
  borderRadius: 12,
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  boxShadow: '0 12px 40px rgba(18, 20, 26, 0.18)',
  pointerEvents: 'auto',
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  padding: '10px 12px',
  borderBottom: `1px solid ${colors.border}`,
}

const titleStyle = {
  margin: 0,
  fontSize: 13,
  fontWeight: 600,
  color: colors.text,
}

const bodyStyle = {
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const hintStyle = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.45,
  color: colors.textMuted,
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  fontSize: 14,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: colors.text,
  boxSizing: 'border-box',
}

const rowStyle = {
  display: 'flex',
  gap: 8,
}

const btnStyle = {
  flex: 1,
  padding: '8px 10px',
  border: 'none',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  color: colors.triviaWhite,
  background: colors.triviaBlue,
}

const btnSecondaryStyle = {
  ...btnStyle,
  color: colors.text,
  background: colors.bg,
  border: `1px solid ${colors.border}`,
}

const statusStyle = (connected) => ({
  margin: 0,
  fontSize: 12,
  fontWeight: 600,
  color: connected ? '#2e7d32' : colors.textMuted,
})

const errorStyle = {
  margin: 0,
  fontSize: 12,
  color: '#c62828',
  lineHeight: 1.4,
}

const collapseBtnStyle = {
  border: 'none',
  background: 'transparent',
  color: colors.textMuted,
  fontSize: 16,
  lineHeight: 1,
  cursor: 'pointer',
  padding: '2px 4px',
}

function getStatusLabel(sync) {
  if (sync.status === DEMO_PEER_STATUS.ERROR) return 'Erro'
  if (sync.role === DEMO_PEER_ROLE.HOST && sync.status === DEMO_PEER_STATUS.CONNECTED) {
    return sync.guestCount > 0 ? `Conectado · ${sync.guestCount} controle` : 'Aguardando celular…'
  }
  if (sync.role === DEMO_PEER_ROLE.GUEST && sync.status === DEMO_PEER_STATUS.CONNECTED) {
    return 'Enviando falhas ao PC'
  }
  if (sync.status === DEMO_PEER_STATUS.CONNECTING) return 'Conectando…'
  return 'Desconectado'
}

export function DemoPeerPanel({ sync }) {
  const [collapsed, setCollapsed] = useState(false)
  const [draftCode, setDraftCode] = useState(sync.roomCode || generateRoomCode())

  const connected =
    sync.status === DEMO_PEER_STATUS.CONNECTED ||
    (sync.role === DEMO_PEER_ROLE.HOST && sync.status === DEMO_PEER_STATUS.CONNECTING)

  if (collapsed) {
    return (
      <div style={panelStyle} onPointerDown={(e) => e.stopPropagation()}>
        <div style={{ ...headerStyle, borderBottom: 'none' }}>
          <button
            type="button"
            style={{ ...btnStyle, flex: 'none', padding: '6px 10px' }}
            onClick={() => setCollapsed(false)}
          >
            Demo remota
          </button>
          <span style={statusStyle(connected)}>{getStatusLabel(sync)}</span>
        </div>
      </div>
    )
  }

  return (
    <div style={panelStyle} onPointerDown={(e) => e.stopPropagation()}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Demo remota (PeerJS)</h2>
        <button
          type="button"
          style={collapseBtnStyle}
          onClick={() => setCollapsed(true)}
          aria-label="Recolher"
        >
          −
        </button>
      </div>

      <div style={bodyStyle}>
        <p style={hintStyle}>
          <strong>Computador:</strong> criar sala e aguardar.{' '}
          <strong>Celular:</strong> entrar com o mesmo código e simular falhas.
        </p>

        <input
          type="text"
          value={draftCode}
          onChange={(e) => setDraftCode(e.target.value.toUpperCase())}
          placeholder="Código da sala"
          style={inputStyle}
          disabled={Boolean(sync.role)}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />

        {!sync.role ? (
          <>
            <div style={rowStyle}>
              <button
                type="button"
                style={btnStyle}
                disabled={!isValidRoomCode(draftCode)}
                onClick={() => sync.connectAsHost(draftCode)}
              >
                Criar sala (PC)
              </button>
              <button
                type="button"
                style={btnSecondaryStyle}
                disabled={!isValidRoomCode(draftCode)}
                onClick={() => sync.connectAsGuest(draftCode)}
              >
                Entrar (celular)
              </button>
            </div>
            <button
              type="button"
              style={{ ...btnSecondaryStyle, width: '100%' }}
              onClick={() => setDraftCode(generateRoomCode())}
            >
              Gerar código
            </button>
          </>
        ) : (
          <>
            <p style={statusStyle(connected)}>
              {sync.role === DEMO_PEER_ROLE.HOST ? 'Modo apresentação' : 'Modo controle'} ·{' '}
              {getStatusLabel(sync)}
            </p>
            {sync.roomCode && (
              <p style={hintStyle}>
                Código: <strong style={{ color: colors.text }}>{sync.roomCode}</strong>
              </p>
            )}
            {sync.error && <p style={errorStyle}>{sync.error}</p>}
            <button type="button" style={{ ...btnSecondaryStyle, width: '100%' }} onClick={sync.disconnect}>
              Desconectar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
