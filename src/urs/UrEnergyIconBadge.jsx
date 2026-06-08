import { UR_ENERGY_ICON_COLOR, UR_ENERGY_LETTER } from './urEnergyIcon'

export function UrEnergyIconBadge({ size = 18 }) {
  return (
    <span
      style={{
        color: UR_ENERGY_ICON_COLOR,
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1,
        fontFamily: "system-ui, 'Segoe UI', sans-serif",
      }}
      aria-hidden
    >
      {UR_ENERGY_LETTER}
    </span>
  )
}
