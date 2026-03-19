'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  forceSimulation,
  forceCenter,
  forceManyBody,
  forceCollide,
  forceLink,
  forceX,
  forceY,
  SimulationNodeDatum,
} from 'd3-force'
import { CorrelationPair, CategoryStats } from '@/types/correlation'
import { CATEGORY_COLORS } from '@/lib/extractions/aggregate'

interface NetworkNode extends SimulationNodeDatum {
  id: string
  category: string
  totalCount: number
  radius: number
  color: string
}

interface NetworkLink {
  source: string | NetworkNode
  target: string | NetworkNode
  coefficient: number
  type: 'positive' | 'negative' | 'lagged'
  lag?: number
}

interface CorrelationNetworkProps {
  correlations: CorrelationPair[]
  lagged: CorrelationPair[]
  stats: CategoryStats[]
  onHoverPair: (pair: { catA: string; catB: string } | null) => void
  hoveredPair: { catA: string; catB: string } | null
}

function getCatColor(cat: string): string {
  return CATEGORY_COLORS[cat.toLowerCase()] || '#64748B'
}

export function CorrelationNetwork({ correlations, lagged, stats, onHoverPair, hoveredPair }: CorrelationNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [nodes, setNodes] = useState<NetworkNode[]>([])
  const [links, setLinks] = useState<NetworkLink[]>([])
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })
  const simulationRef = useRef<ReturnType<typeof forceSimulation<NetworkNode>> | null>(null)

  useEffect(() => {
    const container = svgRef.current?.parentElement
    if (!container) return
    const obs = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect
      setDimensions({ width: Math.max(400, width), height: Math.max(350, Math.min(500, width * 0.5)) })
    })
    obs.observe(container)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (stats.length === 0) return

    const maxCount = Math.max(...stats.map(s => s.totalCount))
    const minRadius = 18
    const maxRadius = 45

    const newNodes: NetworkNode[] = stats.map(s => ({
      id: s.category,
      category: s.category,
      totalCount: s.totalCount,
      radius: minRadius + (Math.log(s.totalCount + 1) / Math.log(maxCount + 1)) * (maxRadius - minRadius),
      color: getCatColor(s.category),
    }))

    const newLinks: NetworkLink[] = []

    for (const c of correlations) {
      newLinks.push({
        source: c.categoryA,
        target: c.categoryB,
        coefficient: c.coefficient,
        type: c.coefficient >= 0 ? 'positive' : 'negative',
      })
    }

    for (const c of lagged) {
      const alreadyExists = newLinks.some(
        l =>
          ((typeof l.source === 'string' ? l.source : l.source.id) === c.categoryA &&
           (typeof l.target === 'string' ? l.target : l.target.id) === c.categoryB) ||
          ((typeof l.source === 'string' ? l.source : l.source.id) === c.categoryB &&
           (typeof l.target === 'string' ? l.target : l.target.id) === c.categoryA)
      )
      if (!alreadyExists) {
        newLinks.push({
          source: c.categoryA,
          target: c.categoryB,
          coefficient: c.coefficient,
          type: 'lagged',
          lag: c.lag,
        })
      }
    }

    setNodes(newNodes)
    setLinks(newLinks)
  }, [correlations, lagged, stats])

  useEffect(() => {
    if (nodes.length === 0 || dimensions.width === 0) return

    if (simulationRef.current) {
      simulationRef.current.stop()
    }

    const sim = forceSimulation<NetworkNode>(nodes)
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('charge', forceManyBody<NetworkNode>().strength(-300))
      .force('collide', forceCollide<NetworkNode>(d => d.radius + 12).strength(0.8).iterations(3))
      .force('link', forceLink<NetworkNode, NetworkLink>(links)
        .id(d => d.id)
        .distance(d => {
          const strength = Math.abs(d.coefficient)
          return 180 - strength * 80
        })
        .strength(d => Math.abs(d.coefficient) * 0.5)
      )
      .force('x', forceX(dimensions.width / 2).strength(0.05))
      .force('y', forceY(dimensions.height / 2).strength(0.05))
      .alpha(0.8)
      .alphaDecay(0.02)
      .on('tick', () => {
        const pad = 50
        for (const n of nodes) {
          n.x = Math.max(pad, Math.min(dimensions.width - pad, n.x || 0))
          n.y = Math.max(pad, Math.min(dimensions.height - pad, n.y || 0))
        }
        setNodes([...nodes])
      })

    simulationRef.current = sim

    return () => { sim.stop() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, links.length, dimensions.width, dimensions.height])

  const getEdgeOpacity = useCallback((link: NetworkLink) => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id

    if (hoveredPair) {
      const matches =
        (hoveredPair.catA === sourceId && hoveredPair.catB === targetId) ||
        (hoveredPair.catA === targetId && hoveredPair.catB === sourceId)
      return matches ? 1 : 0.08
    }
    return 0.15 + Math.abs(link.coefficient) * 0.6
  }, [hoveredPair])

  const getNodeOpacity = useCallback((node: NetworkNode) => {
    if (!hoveredPair) return 1
    return (hoveredPair.catA === node.id || hoveredPair.catB === node.id) ? 1 : 0.25
  }, [hoveredPair])

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="arrow-lagged" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 3 L 0 6 z" fill="#F59E0B" opacity="0.7" />
          </marker>
        </defs>

        {links.map((link, i) => {
          const source = typeof link.source === 'string' ? nodes.find(n => n.id === link.source) : link.source
          const target = typeof link.target === 'string' ? nodes.find(n => n.id === link.target) : link.target
          if (!source?.x || !target?.x) return null

          const strength = Math.abs(link.coefficient)
          const strokeWidth = 1 + strength * 5
          const color = link.type === 'lagged' ? '#F59E0B' : link.type === 'positive' ? '#16a34a' : '#DC143C'
          const dashArray = link.type === 'lagged' ? '6,4' : 'none'

          const sourceId = typeof link.source === 'string' ? link.source : link.source.id
          const targetId = typeof link.target === 'string' ? link.target : link.target.id

          return (
            <line
              key={i}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              opacity={getEdgeOpacity(link)}
              style={{ transition: 'opacity 200ms', cursor: 'pointer' }}
              markerEnd={link.type === 'lagged' ? 'url(#arrow-lagged)' : undefined}
              onMouseEnter={() => onHoverPair({ catA: sourceId, catB: targetId })}
              onMouseLeave={() => onHoverPair(null)}
            />
          )
        })}

        {nodes.map(node => {
          if (!node.x || !node.y) return null

          const fontSize = Math.max(8, Math.min(12, node.radius * 0.42))
          const labelFits = node.radius >= 22

          return (
            <g
              key={node.id}
              opacity={getNodeOpacity(node)}
              style={{ transition: 'opacity 200ms', cursor: 'pointer' }}
              onMouseEnter={() => {
                const connected = links
                  .map(l => {
                    const sId = typeof l.source === 'string' ? l.source : l.source.id
                    const tId = typeof l.target === 'string' ? l.target : l.target.id
                    if (sId === node.id) return tId
                    if (tId === node.id) return sId
                    return null
                  })
                  .filter(Boolean)
                if (connected.length > 0) {
                  onHoverPair({ catA: node.id, catB: '__ALL__' })
                }
              }}
              onMouseLeave={() => onHoverPair(null)}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={node.color}
                opacity={0.85}
              />
              {labelFits && (
                <text
                  x={node.x}
                  y={node.y - (node.radius > 30 ? 4 : 0)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontFamily="var(--font-inter), sans-serif"
                  fontWeight={700}
                  fontSize={fontSize}
                  letterSpacing="0.03em"
                  style={{ textTransform: 'uppercase', pointerEvents: 'none' }}
                >
                  {node.category.length > 8 ? node.category.slice(0, 7) + '.' : node.category}
                </text>
              )}
              {labelFits && node.radius > 28 && (
                <text
                  x={node.x}
                  y={node.y + fontSize + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="rgba(255,255,255,0.7)"
                  fontFamily="var(--font-inter), sans-serif"
                  fontWeight={400}
                  fontSize={fontSize - 2}
                  style={{ pointerEvents: 'none' }}
                >
                  {node.totalCount}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '24px', height: '3px', background: '#16a34a' }} />
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: '#999' }}>Rise together</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '24px', height: '3px', background: '#DC143C' }} />
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: '#999' }}>Trade off</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '24px', height: '3px', background: '#F59E0B', borderTop: '1px dashed #F59E0B' }} />
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: '#999' }}>Predicts (lagged)</span>
        </div>
      </div>
    </div>
  )
}
