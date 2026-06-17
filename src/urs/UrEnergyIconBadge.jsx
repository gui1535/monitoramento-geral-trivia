import { UR_ENERGY_ICON_URL } from './urEnergyIcon'

export function UrEnergyIconBadge({ size = 18 }) {
  return (
    <img
      src={UR_ENERGY_ICON_URL}
      alt=""
      width={size}
      height={size}
      style={{ display: 'block' }}
      aria-hidden
    />
  )
}
