import { colors } from '../../styles/tokens'

const iconColors = {
  fill: colors.surface,
  stroke: colors.triviaBlue,
  detail: colors.textMuted,
}

export function NetworkIcon({ type }) {
  switch (type) {
    case 'switch':
      return <SwitchIcon />
    case 'router':
      return <RouterIcon />
    case 'tower':
      return <TowerIcon />
    case 'computer':
    default:
      return <ComputerIcon />
  }
}

function ComputerIcon() {
  return (
    <svg width="48" height="40" viewBox="0 0 48 40" aria-hidden="true">
      <rect
        x="6"
        y="4"
        width="36"
        height="24"
        rx="3"
        fill={iconColors.fill}
        stroke={iconColors.stroke}
        strokeWidth="2"
      />
      <rect x="18" y="30" width="12" height="4" fill={iconColors.stroke} />
      <rect x="12" y="34" width="24" height="3" rx="1" fill={iconColors.stroke} />
    </svg>
  )
}

function SwitchIcon() {
  return (
    <svg width="56" height="36" viewBox="0 0 56 36" aria-hidden="true">
      <rect
        x="4"
        y="8"
        width="48"
        height="20"
        rx="4"
        fill={iconColors.fill}
        stroke={iconColors.stroke}
        strokeWidth="2"
      />
      {[14, 22, 30, 38, 46].map((x) => (
        <circle key={x} cx={x} cy="18" r="2.5" fill={iconColors.detail} />
      ))}
    </svg>
  )
}

function RouterIcon() {
  return (
    <svg width="48" height="44" viewBox="0 0 48 44" aria-hidden="true">
      <rect
        x="8"
        y="16"
        width="32"
        height="22"
        rx="4"
        fill={iconColors.fill}
        stroke={iconColors.stroke}
        strokeWidth="2"
      />
      <line x1="14" y1="10" x2="14" y2="16" stroke={iconColors.stroke} strokeWidth="2" />
      <line x1="24" y1="6" x2="24" y2="16" stroke={iconColors.stroke} strokeWidth="2" />
      <line x1="34" y1="10" x2="34" y2="16" stroke={iconColors.stroke} strokeWidth="2" />
      <circle cx="24" cy="27" r="4" fill={iconColors.detail} />
    </svg>
  )
}

function TowerIcon() {
  return (
    <svg width="40" height="56" viewBox="0 0 40 56" aria-hidden="true">
      <line x1="20" y1="8" x2="20" y2="48" stroke={iconColors.stroke} strokeWidth="3" />
      <line x1="20" y1="14" x2="8" y2="22" stroke={iconColors.stroke} strokeWidth="2" />
      <line x1="20" y1="14" x2="32" y2="22" stroke={iconColors.stroke} strokeWidth="2" />
      <line x1="20" y1="24" x2="6" y2="32" stroke={iconColors.stroke} strokeWidth="2" />
      <line x1="20" y1="24" x2="34" y2="32" stroke={iconColors.stroke} strokeWidth="2" />
      <rect x="14" y="48" width="12" height="6" rx="2" fill={iconColors.stroke} />
    </svg>
  )
}
