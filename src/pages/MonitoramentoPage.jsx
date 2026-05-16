import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CanvasViewport } from '../canvas/CanvasViewport'
import { CanvasWorld } from '../canvas/CanvasWorld'
import { TopologyMap } from '../components/network/TopologyMap'
import { colors, layout } from '../styles/tokens'

const NAV_OPTIONS = [
  { id: 'visao', label: 'Visão geral' },
  { id: 'alertas', label: 'Alertas' },
  { id: 'setores', label: 'Setores' },
  { id: 'relatorios', label: 'Relatórios' },
]

const pageStyle = {
  width: '100%',
  height: '100%',
  minHeight: '100svh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const headerStyle = {
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 24,
  height: layout.headerHeight,
  padding: '0 24px',
  background: colors.bgHeader,
  borderBottom: `3px solid ${colors.triviaOrange}`,
}

const headerLeftStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 140,
}

const logoStyle = {
  height: 32,
  width: 'auto',
  display: 'block',
}

const navStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  flex: 1,
  justifyContent: 'center',
}

const headerRightStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 140,
  justifyContent: 'flex-end',
}

const bodyStyle = {
  flex: 1,
  minHeight: 0,
}

function navButtonStyle(active, hovered) {
  return {
    padding: '8px 16px',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    color: colors.triviaWhite,
    background: active
      ? 'rgba(255, 255, 255, 0.2)'
      : hovered
        ? 'rgba(255, 255, 255, 0.12)'
        : 'transparent',
    transition: 'background 0.15s ease',
  }
}

function actionButtonStyle(hovered) {
  return {
    padding: '8px 14px',
    border: `1px solid rgba(255, 255, 255, 0.35)`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    color: colors.triviaWhite,
    background: hovered ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
    transition: 'background 0.15s ease',
  }
}

function logoutButtonStyle(hovered) {
  return {
    padding: '8px 14px',
    border: `1px solid ${colors.triviaOrange}`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    color: colors.triviaWhite,
    background: hovered ? colors.triviaOrange : 'rgba(245, 63, 16, 0.25)',
    transition: 'background 0.15s ease',
  }
}

function NavButton({ label, active, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      style={navButtonStyle(active, hovered)}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </button>
  )
}

function ActionButton({ label, onClick, variant = 'default' }) {
  const [hovered, setHovered] = useState(false)
  const style =
    variant === 'logout'
      ? logoutButtonStyle(hovered)
      : actionButtonStyle(hovered)

  return (
    <button
      type="button"
      style={style}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </button>
  )
}

export function MonitoramentoPage() {
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState('visao')

  function handleLogout() {
    navigate('/')
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div style={headerLeftStyle}>
          <img src="/logotipo-branco.png" alt="Trivia" style={logoStyle} />
        </div>

        <nav style={navStyle} aria-label="Navegação principal">
          {NAV_OPTIONS.map((option) => (
            <NavButton
              key={option.id}
              label={option.label}
              active={activeNav === option.id}
              onClick={() => setActiveNav(option.id)}
            />
          ))}
        </nav>

        <div style={headerRightStyle}>
          <ActionButton
            label="Sair"
            variant="logout"
            onClick={handleLogout}
          />
        </div>
      </header>

      <div style={bodyStyle}>
        <CanvasViewport>
          <CanvasWorld>
            <TopologyMap />
          </CanvasWorld>
        </CanvasViewport>
      </div>
    </main>
  )
}
