import { useEffect, useRef } from 'react'
import { INTERACTION_MODE } from './constants'
import diagramSvg from '/esquema-gerencia.svg?raw'

const layerStyle = {
  position: 'absolute',
  inset: 0,
  userSelect: 'none',
}

export function CanvasDiagramBase({ onSvgReady, interactionMode }) {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const onSvgReadyRef = useRef(onSvgReady)

  onSvgReadyRef.current = onSvgReady

  useEffect(() => {
    const container = containerRef.current
    if (!container || container.dataset.svgMounted === 'true') return

    container.innerHTML = diagramSvg
    container.dataset.svgMounted = 'true'

    const svg = container.querySelector('svg')
    if (!svg) return

    svg.style.display = 'block'
    svg.style.width = '100%'
    svg.style.height = '100%'
    svgRef.current = svg
    onSvgReadyRef.current?.(svg)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const isAction = interactionMode === INTERACTION_MODE.ACTION
    container.style.pointerEvents = isAction ? 'auto' : 'none'
  }, [interactionMode])

  return <div ref={containerRef} style={layerStyle} />
}
