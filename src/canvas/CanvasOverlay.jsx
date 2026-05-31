const layerStyle = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
}

export function CanvasOverlay({ children }) {
  return <div style={layerStyle}>{children}</div>
}
