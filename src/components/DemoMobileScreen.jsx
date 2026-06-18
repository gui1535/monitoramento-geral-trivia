import { useState } from 'react'
import {
  DEMO_PRESET_VARIANT,
  DEMO_PRESETS,
  runDemoPreset,
} from '../demo/demoPresets'
import {
  createClearAllMessage,
  generateRoomCode,
  isValidRoomCode,
} from '../demo/demoSyncMessages'
import { DEMO_PEER_STATUS } from '../demo/useDemoPeerSync'
import { colors } from '../styles/tokens'

const screenStyle = {
  width: '100%',
  minHeight: '100svh',
  display: 'flex',
  flexDirection: 'column',
  background: colors.bg,
  color: colors.text,
}

const headerStyle = {
  padding: '20px 20px 12px',
  background: colors.triviaBlue,
  color: colors.triviaWhite,
}

const titleStyle = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
}

const subtitleStyle = {
  margin: '6px 0 0',
  fontSize: 14,
  opacity: 0.9,
}

const contentStyle = {
  flex: 1,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  overflowY: 'auto',
}

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textAlign: 'center',
  textTransform: 'uppercase',
  color: colors.text,
  boxSizing: 'border-box',
  background: colors.surface,
}

const presetBtnStyle = (variant) => {
  const backgrounds = {
    [DEMO_PRESET_VARIANT.DANGER]: '#c62828',
    [DEMO_PRESET_VARIANT.WARNING]: '#e65100',
    [DEMO_PRESET_VARIANT.NEUTRAL]: colors.surface,
  }

  const colorsByVariant = {
    [DEMO_PRESET_VARIANT.DANGER]: colors.triviaWhite,
    [DEMO_PRESET_VARIANT.WARNING]: colors.triviaWhite,
    [DEMO_PRESET_VARIANT.NEUTRAL]: colors.text,
  }

  return {
    width: '100%',
    padding: '16px 18px',
    border:
      variant === DEMO_PRESET_VARIANT.NEUTRAL
        ? `1px solid ${colors.border}`
        : 'none',
    borderRadius: 14,
    textAlign: 'left',
    cursor: 'pointer',
    background: backgrounds[variant] ?? colors.triviaBlue,
    color: colorsByVariant[variant] ?? colors.triviaWhite,
    boxShadow:
      variant === DEMO_PRESET_VARIANT.NEUTRAL
        ? 'none'
        : '0 4px 14px rgba(18, 20, 26, 0.15)',
  }
}

const presetLabelStyle = {
  display: 'block',
  fontSize: 17,
  fontWeight: 700,
  lineHeight: 1.3,
}

const presetDescStyle = (variant) => ({
  display: 'block',
  marginTop: 4,
  fontSize: 13,
  lineHeight: 1.35,
  opacity: variant === DEMO_PRESET_VARIANT.NEUTRAL ? 0.75 : 0.9,
})

const primaryBtnStyle = {
  width: '100%',
  padding: '14px 16px',
  border: 'none',
  borderRadius: 12,
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
  color: colors.triviaWhite,
  background: colors.triviaBlue,
}

const secondaryBtnStyle = {
  ...primaryBtnStyle,
  color: colors.text,
  background: colors.surface,
  border: `1px solid ${colors.border}`,
}

const actionsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  marginTop: 6,
}

const footerStyle = {
  padding: '12px 20px 24px',
  borderTop: `1px solid ${colors.border}`,
  background: colors.surface,
}

const errorStyle = {
  margin: 0,
  padding: '10px 12px',
  borderRadius: 10,
  fontSize: 13,
  color: '#c62828',
  background: '#ffebee',
}

const statusPillStyle = {
  display: 'inline-block',
  marginTop: 10,
  padding: '6px 12px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  background: 'rgba(255,255,255,0.18)',
}

const feedbackStyle = {
  margin: 0,
  padding: '10px 12px',
  borderRadius: 10,
  fontSize: 13,
  color: '#1b5e20',
  background: '#e8f5e9',
  textAlign: 'center',
}

function PresetButton({ preset, onRun, disabled }) {
  return (
    <button
      type="button"
      style={presetBtnStyle(preset.variant)}
      onClick={() => onRun(preset)}
      disabled={disabled}
    >
      <span style={presetLabelStyle}>{preset.label}</span>
      {preset.description && (
        <span style={presetDescStyle(preset.variant)}>{preset.description}</span>
      )}
    </button>
  )
}

function JoinView({ sync }) {
  const [draftCode, setDraftCode] = useState(sync.roomCode || generateRoomCode())
  const connecting = sync.status === DEMO_PEER_STATUS.CONNECTING

  return (
  <>
    <p style={{ margin: 0, fontSize: 14, color: colors.textMuted, lineHeight: 1.5 }}>
      Digite o código exibido no computador e conecte para controlar a demonstração.
    </p>

    <input
      type="text"
      value={draftCode}
      onChange={(e) => setDraftCode(e.target.value.toUpperCase())}
      placeholder="Código"
      style={inputStyle}
      disabled={connecting}
      autoCapitalize="characters"
      autoCorrect="off"
      spellCheck={false}
    />

    <button
      type="button"
      style={primaryBtnStyle}
      disabled={!isValidRoomCode(draftCode) || connecting}
      onClick={() => sync.connectAsGuest(draftCode)}
    >
      {connecting ? 'Conectando…' : 'Conectar ao computador'}
    </button>

    <button
      type="button"
      style={secondaryBtnStyle}
      disabled={connecting}
      onClick={() => setDraftCode(generateRoomCode())}
    >
      Gerar código aleatório
    </button>

    {sync.error && <p style={errorStyle}>{sync.error}</p>}
  </>
  )
}

function ControllerView({ sync, onSend }) {
  const [lastAction, setLastAction] = useState(null)

  function notifyAction(label) {
    setLastAction(label)
    window.setTimeout(() => setLastAction(null), 2000)
  }

  function handleRun(preset) {
    runDemoPreset(preset, onSend)
    notifyAction(preset.label)
  }

  function handleClearAll() {
    onSend(createClearAllMessage())
    notifyAction('Limpar tudo')
  }

  return (
    <>
      {lastAction && (
        <p style={feedbackStyle}>Enviado: {lastAction}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DEMO_PRESETS.map((preset) => (
          <PresetButton key={preset.id} preset={preset} onRun={handleRun} />
        ))}
      </div>

      <div style={actionsStyle}>
        <button type="button" style={secondaryBtnStyle} onClick={sync.disconnect}>
          Desconectar
        </button>

        <button type="button" style={primaryBtnStyle} onClick={handleClearAll}>
          Limpar tudo
        </button>
      </div>
    </>
  )
}

export function DemoMobileScreen({ sync, onSend }) {
  const connected = sync.isConnected

  return (
    <div style={screenStyle} onPointerDown={(e) => e.stopPropagation()}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Controle remoto</h1>
        <p style={subtitleStyle}>
          {connected
            ? 'Toque em um cenário para aplicar no computador.'
            : 'Conecte-se à sala de demonstração.'}
        </p>
        {sync.roomCode && (
          <span style={statusPillStyle}>
            Sala {sync.roomCode}
            {connected ? ' · conectado' : ''}
          </span>
        )}
      </header>

      <div style={contentStyle}>
        {connected ? (
          <ControllerView sync={sync} onSend={onSend} />
        ) : (
          <JoinView sync={sync} />
        )}
      </div>

      {connected && (
        <footer style={footerStyle}>
          <p style={{ margin: 0, fontSize: 12, color: colors.textMuted, textAlign: 'center' }}>
            As falhas aparecem apenas no computador conectado.
          </p>
        </footer>
      )}
    </div>
  )
}
