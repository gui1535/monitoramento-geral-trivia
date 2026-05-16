import { colors } from '../../styles/tokens'
import { getNodeSize } from '../../topology/utils'
import { NetworkIcon } from './NetworkIcon'
import { StatusLed } from './StatusLed'

const nodeStyle = {
  position: 'absolute',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  padding: '8px 6px 6px',
  borderRadius: 10,
  border: `1px solid ${colors.border}`,
  background: colors.surface,
  boxShadow: '0 2px 6px rgba(18, 20, 26, 0.1)',
  pointerEvents: 'auto',
}

const labelStyle = {
  margin: '6px 0 0',
  fontSize: 11,
  fontWeight: 600,
  color: colors.text,
  textAlign: 'center',
  lineHeight: 1.2,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const typeLabelStyle = {
  margin: '2px 0 0',
  fontSize: 9,
  fontWeight: 500,
  color: colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const TYPE_LABELS = {
  computer: 'Computador',
  switch: 'Switch',
  router: 'Roteador',
  tower: 'Torre',
}

export function NetworkNode({ node }) {
  const size = getNodeSize(node.type)

  return (
    <div
      style={{
        ...nodeStyle,
        left: node.x,
        top: node.y,
        width: size.width,
        height: size.height,
      }}
    >
      <StatusLed status={node.status} title={`Status: ${node.status}`} />
      <NetworkIcon type={node.type} />
      <p style={labelStyle}>{node.label}</p>
      <span style={typeLabelStyle}>{TYPE_LABELS[node.type]}</span>
    </div>
  )
}
