'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  forceSimulation,
  forceCenter,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  SimulationNodeDatum,
} from 'd3-force'
import { MapNode } from '@/types/extraction'

interface SimNode extends SimulationNodeDatum, MapNode {
  x: number
  y: number
  radius: number
}

interface InfluenceMapProps {
  nodes: MapNode[]
  onSelectNode: (node: MapNode) => void
}

const CATEGORY_RADIUS_MIN = 30
const CATEGORY_RADIUS_MAX = 80
const CONCEPT_RADIUS_MIN = 20
const CONCEPT_RADIUS_MAX = 42
const MIN_TAP_TARGET = 22

function mapRadius(importance: number, type: 'category' | 'concept'): number {
  if (type === 'category') {
    return CATEGORY_RADIUS_MIN + importance * (CATEGORY_RADIUS_MAX - CATEGORY_RADIUS_MIN)
  }
  return CONCEPT_RADIUS_MIN + importance * (CONCEPT_RADIUS_MAX - CONCEPT_RADIUS_MIN)
}

function mapOpacity(confidence: number): number {
  return 0.3 + confidence * 0.7
}

function truncateLabel(label: string, maxLen: number): string {
  if (label.length <= maxLen) return label
  return label.slice(0, maxLen - 1) + '…'
}

function seededRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash |= 0
  }
  const x = Math.sin(hash) * 10000
  return x - Math.floor(x)
}

export function InfluenceMap({ nodes, onSelectNode }: InfluenceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [simNodes, setSimNodes] = useState<SimNode[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [settled, setSettled] = useState(false)
  const simulationRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null)

  useEffect(() => {
    function measure() {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setDimensions({
        width: Math.max(rect.width, 320),
        height: Math.max(rect.height, 400),
      })
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (nodes.length === 0) return

    const { width, height } = dimensions
    const cx = width / 2
    const cy = height / 2

    const initial: SimNode[] = nodes.map(node => ({
      ...node,
      x: cx + (seededRandom(node.id + 'x') - 0.5) * 40,
      y: cy + (seededRandom(node.id + 'y') - 0.5) * 40,
      radius: mapRadius(node.importance, node.type),
    }))

    const categoryPositions = new Map<string, SimNode>()
    for (const n of initial) {
      if (n.type === 'category') categoryPositions.set(n.id, n)
    }

    setSettled(false)

    const sim = forceSimulation<SimNode>(initial)
      .force('center', forceCenter<SimNode>(cx, cy).strength(0.05))
      .force('charge', forceManyBody<SimNode>().strength(-60))
      .force('collide', forceCollide<SimNode>(d => d.radius + 8).strength(0.9).iterations(4))
      .force('x', forceX<SimNode>(d => {
        if (d.type === 'concept' && d.parentId) {
          const parent = categoryPositions.get(d.parentId)
          if (parent) return parent.x
        }
        return cx
      }).strength(d => d.type === 'concept' ? 0.12 : 0.03))
      .force('y', forceY<SimNode>(d => {
        if (d.type === 'concept' && d.parentId) {
          const parent = categoryPositions.get(d.parentId)
          if (parent) return parent.y
        }
        return cy
      }).strength(d => d.type === 'concept' ? 0.12 : 0.03))
      .alphaDecay(0.02)
      .velocityDecay(0.4)
      .on('tick', () => {
        const edgePadding = 20
        for (const n of initial) {
          n.x = Math.max(n.radius + edgePadding, Math.min(width - n.radius - edgePadding, n.x))
          n.y = Math.max(n.radius + edgePadding, Math.min(height - n.radius - edgePadding, n.y))
        }

        for (const n of initial) {
          if (n.type === 'category') categoryPositions.set(n.id, n)
        }

        setSimNodes([...initial])
      })
      .on('end', () => {
        setSettled(true)
      })

    simulationRef.current = sim

    return () => {
      sim.stop()
    }
  }, [nodes, dimensions])

  const handleNodeClick = useCallback((node: MapNode) => {
    onSelectNode(node)
  }, [onSelectNode])

  if (nodes.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '4rem 2rem',
      }}>
        <p style={{
          fontFamily: 'var(--font-bodoni-moda), Georgia, serif',
          fontSize: '1.6rem',
          color: '#1A1A1A',
          marginBottom: '0.75rem',
        }}>
          No patterns yet
        </p>
        <p style={{
          fontFamily: 'var(--font-inter), sans-serif',
          fontSize: '0.95rem',
          color: 'var(--text-muted, #666)',
          maxWidth: '45ch',
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          Run an extraction to discover patterns across your journal entries.
        </p>
      </div>
    )
  }

  const { width, height } = dimensions

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 'calc(100vh - 280px)',
        minHeight: '400px',
        position: 'relative',
        cursor: 'default',
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Layer 1: Connection lines */}
        {simNodes
          .filter(n => n.type === 'concept' && n.parentId)
          .map(n => {
            const parent = simNodes.find(p => p.id === n.parentId)
            if (!parent) return null
            return (
              <line
                key={`line-${n.id}`}
                x1={parent.x}
                y1={parent.y}
                x2={n.x}
                y2={n.y}
                stroke={n.color}
                strokeOpacity={0.1}
                strokeWidth={1}
              />
            )
          })}

        {/* Layer 2: Circles + hit areas (interactive) */}
        {simNodes.map(node => {
          const isHovered = hoveredId === node.id
          const scale = isHovered ? 1.08 : 1
          const opacity = mapOpacity(node.confidence)
          const hitRadius = Math.max(node.radius, MIN_TAP_TARGET)

          return (
            <g
              key={node.id}
              role="button"
              tabIndex={0}
              aria-label={`${node.label} — ${node.occurrences} occurrence${node.occurrences !== 1 ? 's' : ''}, ${Math.round(node.confidence * 100)}% confidence`}
              transform={`translate(${node.x}, ${node.y}) scale(${scale})`}
              style={{
                cursor: 'pointer',
                transition: settled ? 'transform 200ms ease-out' : 'none',
              }}
              onClick={() => handleNodeClick(node)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNodeClick(node) }}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {hitRadius > node.radius && (
                <circle r={hitRadius} fill="transparent" />
              )}
              <circle
                r={node.radius}
                fill={node.color}
                fillOpacity={opacity}
                stroke={node.color}
                strokeOpacity={Math.min(1, opacity + 0.15)}
                strokeWidth={isHovered ? 2 : 1}
              />
            </g>
          )
        })}

        {/* Layer 3: Labels (always on top of all circles) */}
        {simNodes.map(node => {
          const labelSize = node.type === 'category'
            ? Math.max(10, Math.min(14, node.radius * 0.28))
            : Math.max(9, Math.min(11, node.radius * 0.4))
          const maxChars = node.type === 'category'
            ? Math.floor(node.radius * 0.28)
            : Math.floor(node.radius * 0.35)

          if (node.type === 'category') {
            const fitChars = Math.floor((node.radius * 2 - 10) / (labelSize * 0.7))
            const safeMaxChars = Math.min(maxChars, fitChars)
            return (
              <text
                key={`label-${node.id}`}
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#fff"
                fontFamily="var(--font-inter), sans-serif"
                fontSize={labelSize}
                fontWeight={700}
                letterSpacing="0.04em"
                style={{
                  textTransform: 'uppercase',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {truncateLabel(node.label, Math.max(4, safeMaxChars))}
              </text>
            )
          }

          if (node.radius >= 24) {
            const fitChars = Math.floor((node.radius * 2 - 8) / (labelSize * 0.7))
            const safeMaxChars = Math.min(maxChars, fitChars)
            return (
              <text
                key={`label-${node.id}`}
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#fff"
                fontFamily="var(--font-inter), sans-serif"
                fontSize={labelSize}
                fontWeight={600}
                letterSpacing="0.04em"
                style={{
                  textTransform: 'uppercase',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {truncateLabel(node.label, Math.max(3, safeMaxChars))}
              </text>
            )
          }

          return null
        })}
      </svg>

      {hoveredId && (() => {
        const node = simNodes.find(n => n.id === hoveredId)
        if (!node) return null
        const tooltipWidth = 200
        const nearRightEdge = node.x + node.radius + tooltipWidth + 20 > width
        const tooltipX = nearRightEdge
          ? Math.max(8, node.x - node.radius - tooltipWidth - 12)
          : node.x + node.radius + 12
        const tooltipY = Math.max(node.y - 20, 8)

        return (
          <div
            style={{
              position: 'absolute',
              left: tooltipX,
              top: tooltipY,
              background: 'rgba(0, 0, 0, 0.88)',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '4px',
              fontFamily: 'var(--font-inter), sans-serif',
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              lineHeight: 1.4,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            <div style={{ textTransform: 'uppercase', marginBottom: '2px' }}>
              {node.label}
            </div>
            <div style={{ fontWeight: 400, opacity: 0.8 }}>
              {node.occurrences} occurrence{node.occurrences !== 1 ? 's' : ''} · {Math.round(node.confidence * 100)}% confidence
            </div>
          </div>
        )
      })()}
    </div>
  )
}
