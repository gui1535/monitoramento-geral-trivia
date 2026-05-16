import { NODE_SIZE } from './types'

export function getNodeSize(type) {
  return NODE_SIZE[type] ?? NODE_SIZE.computer
}

export function getNodeCenter(node) {
  const { width, height } = getNodeSize(node.type)
  return {
    x: node.x + width / 2,
    y: node.y + height / 2,
  }
}

export function getNodeAnchor(node, side) {
  const { width, height } = getNodeSize(node.type)

  switch (side) {
    case 'top':
      return { x: node.x + width / 2, y: node.y }
    case 'bottom':
      return { x: node.x + width / 2, y: node.y + height }
    case 'left':
      return { x: node.x, y: node.y + height / 2 }
    case 'right':
      return { x: node.x + width, y: node.y + height / 2 }
    default:
      return getNodeCenter(node)
  }
}
