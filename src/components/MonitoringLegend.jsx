import { useState } from 'react'
import { FIBER_FALLEN_COLOR, FIBER_STATUS_COLORS, FIBER_STATUS } from '../fibers/fibers'
import { RADIO_OK_COLOR, RADIO_UNSTABLE_COLOR } from '../radios/radios'
import { UR_COLORS, UR_STATUS } from '../urs/urs'
import { colors } from '../styles/tokens'

const FIBER_NORMAL_COLOR = '#5500C5'

export const MONITORING_LEGEND_COLLAPSED_OFFSET_PX = 52
export const MONITORING_LEGEND_EXPANDED_OFFSET_PX = 200

const wrapperStyle = {
  position: 'absolute',
  top: 16,
  right: 16,
  zIndex: 30,
  width: 'min(220px, calc(100vw - 32px))',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 8,
  pointerEvents: 'auto',
}

const toggleStyle = (active) => ({
  padding: '8px 14px',
  border: active ? 'none' : `1px solid ${colors.border}`,
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  color: active ? colors.triviaWhite : colors.text,
  background: active ? colors.triviaBlue : colors.surface,
  boxShadow: '0 2px 8px rgba(18, 20, 26, 0.15)',
  cursor: 'pointer',
  boxSizing: 'border-box',
})

const panelStyle = {
  padding: '12px 14px',
  borderRadius: 10,
  background: 'rgba(255, 255, 255, 0.94)',
  border: `1px solid ${colors.border}`,
  boxShadow: '0 4px 16px rgba(18, 20, 26, 0.12)',
  boxSizing: 'border-box',
}

const titleStyle = {
  margin: '0 0 8px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: colors.textMuted,
}

const sectionStyle = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
}

const sectionGap = {
  marginTop: 10,
}

const itemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 5,
  fontSize: 12,
  lineHeight: 1.3,
  color: colors.text,
}

function LineSwatch({ color, thick = false }) {
  return (
    <span
      aria-hidden
      style={{
        flexShrink: 0,
        width: 22,
        height: thick ? 4 : 3,
        borderRadius: 2,
        background: color,
      }}
    />
  )
}

function DotSwatch({ fill, stroke }) {
  return (
    <span
      aria-hidden
      style={{
        flexShrink: 0,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: fill,
        border: `2px solid ${stroke}`,
      }}
    />
  )
}

function LegendSection({ title, items, style }) {
  return (
    <div style={style}>
      <p style={titleStyle}>{title}</p>
      <ul style={sectionStyle}>
        {items.map((item) => (
          <li key={item.label} style={itemStyle}>
            {item.swatch}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const FIBER_ITEMS = [
  {
    label: 'Azul — normal',
    swatch: <LineSwatch color={FIBER_NORMAL_COLOR} />,
  },
  {
    label: 'Vermelha — alerta',
    swatch: <LineSwatch color={FIBER_STATUS_COLORS[FIBER_STATUS.ALERT]} />,
  },
  {
    label: 'Vermelho escuro — queda real',
    swatch: <LineSwatch color={FIBER_FALLEN_COLOR} thick />,
  },
  {
    label: 'Verde — trecho ativo',
    swatch: <LineSwatch color={FIBER_STATUS_COLORS[FIBER_STATUS.ACTIVE]} />,
  },
]

const UR_ITEMS = [
  {
    label: 'Verde — conectada',
    swatch: (
      <DotSwatch
        fill={UR_COLORS[UR_STATUS.ACTIVE].fill}
        stroke={UR_COLORS[UR_STATUS.ACTIVE].stroke}
      />
    ),
  },
  {
    label: 'Amarela — conectando',
    swatch: (
      <DotSwatch
        fill={UR_COLORS[UR_STATUS.CONNECTING].fill}
        stroke={UR_COLORS[UR_STATUS.CONNECTING].stroke}
      />
    ),
  },
  {
    label: 'Vermelha — fora / falha',
    swatch: (
      <DotSwatch
        fill={UR_COLORS[UR_STATUS.INACTIVE].fill}
        stroke={UR_COLORS[UR_STATUS.INACTIVE].stroke}
      />
    ),
  },
]

const RADIO_ITEMS = [
  {
    label: 'Verde — em funcionamento',
    swatch: <LineSwatch color={RADIO_OK_COLOR} />,
  },
  {
    label: 'Laranja — instável',
    swatch: <LineSwatch color={RADIO_UNSTABLE_COLOR} />,
  },
]

export function MonitoringLegend({ onExpandedChange }) {
  const [open, setOpen] = useState(false)

  function toggle() {
    setOpen((current) => {
      const next = !current
      onExpandedChange?.(next)
      return next
    })
  }

  return (
    <div style={wrapperStyle} onPointerDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        style={toggleStyle(open)}
        onClick={toggle}
        aria-expanded={open}
        aria-controls="monitoring-legend-panel"
      >
        {open ? 'Ocultar legenda' : 'Legenda'}
      </button>

      {open ? (
        <aside
          id="monitoring-legend-panel"
          style={panelStyle}
          aria-label="Legenda do monitoramento"
        >
          <LegendSection title="Fibras" items={FIBER_ITEMS} />
          <LegendSection title="URs" items={UR_ITEMS} style={sectionGap} />
          <LegendSection title="Rádio" items={RADIO_ITEMS} style={sectionGap} />
        </aside>
      ) : null}
    </div>
  )
}
