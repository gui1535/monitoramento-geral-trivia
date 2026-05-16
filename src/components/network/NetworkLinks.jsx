import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../../canvas/constants'
import { getNodeAnchor } from '../../topology/utils'
import { getStatusColor } from './statusColors'

const svgStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  pointerEvents: 'none',
  overflow: 'visible',
}

function getLinkPoints(link, nodeMap) {
  const fromNode = nodeMap.get(link.from)
  const toNode = nodeMap.get(link.to)
  if (!fromNode || !toNode) return null

  const from = getNodeAnchor(fromNode, link.fromAnchor ?? 'center')
  const to = getNodeAnchor(toNode, link.toAnchor ?? 'center')

  return { from, to }
}

export function NetworkLinks({ links, nodes }) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))

  return (
    <svg style={svgStyle} aria-hidden="true">
      {links.map((link) => {
        const points = getLinkPoints(link, nodeMap)
        if (!points) return null

        const color = getStatusColor(link.status)
        const isOffline = link.status === 'offline'

        return (
          <g key={link.id}>
            <line
              x1={points.from.x}
              y1={points.from.y}
              x2={points.to.x}
              y2={points.to.y}
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray={isOffline ? '6 4' : undefined}
              opacity={isOffline ? 0.6 : 1}
            />
          </g>
        )
      })}
    </svg>
  )
}
