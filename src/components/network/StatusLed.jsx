import { getStatusColor } from './statusColors'

const ledWrapStyle = {
  position: 'absolute',
  top: 6,
  right: 6,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
}

const ledDotStyle = (color) => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: color,
  border: '1px solid rgba(0, 0, 0, 0.15)',
  boxShadow: `0 0 6px ${color}`,
})

export function StatusLed({ status, title }) {
  const color = getStatusColor(status)

  return (
    <div style={ledWrapStyle} title={title ?? status}>
      <span style={ledDotStyle(color)} aria-hidden="true" />
    </div>
  )
}
