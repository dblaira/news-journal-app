'use client'

import { useMemo } from 'react'
import { WeeklyMatrix } from '@/types/correlation'
import { CATEGORY_COLORS } from '@/lib/extractions/aggregate'

interface SparklineGridProps {
  matrix: WeeklyMatrix
  hoveredPair: { catA: string; catB: string } | null
  onHoverPair: (pair: { catA: string; catB: string } | null) => void
}

function getCatColor(cat: string): string {
  return CATEGORY_COLORS[cat.toLowerCase()] || '#64748B'
}

function Sparkline({ data, color, max, highlighted, dimmed, width = 280, height = 32 }: {
  data: number[]
  color: string
  max: number
  highlighted: boolean
  dimmed: boolean
  width?: number
  height?: number
}) {
  if (data.length < 2) return null

  const padding = 2
  const plotW = width - padding * 2
  const plotH = height - padding * 2
  const step = plotW / (data.length - 1)
  const scale = max > 0 ? plotH / max : 0

  const points = data.map((v, i) => ({
    x: padding + i * step,
    y: padding + plotH - v * scale,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

  const fillD = pathD +
    ` L ${points[points.length - 1].x.toFixed(1)} ${(padding + plotH).toFixed(1)}` +
    ` L ${points[0].x.toFixed(1)} ${(padding + plotH).toFixed(1)} Z`

  return (
    <svg
      width={width}
      height={height}
      style={{
        display: 'block',
        opacity: dimmed ? 0.15 : 1,
        transition: 'opacity 200ms',
      }}
    >
      <path
        d={fillD}
        fill={color}
        opacity={highlighted ? 0.2 : 0.08}
      />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={highlighted ? 2.5 : 1.5}
        opacity={highlighted ? 1 : 0.7}
      />
      {highlighted && points.map((p, i) => {
        if (data[i] === 0) return null
        const showDot = data.length < 40 || i % Math.ceil(data.length / 20) === 0
        if (!showDot) return null
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={2}
            fill={color}
          />
        )
      })}
    </svg>
  )
}

export function SparklineGrid({ matrix, hoveredPair, onHoverPair }: SparklineGridProps) {
  const sortedCategories = useMemo(() => {
    return [...matrix.categories].sort((a, b) => {
      const totalA = matrix.weeks.reduce((sum, w) => sum + (w.counts[a] || 0), 0)
      const totalB = matrix.weeks.reduce((sum, w) => sum + (w.counts[b] || 0), 0)
      return totalB - totalA
    })
  }, [matrix])

  const seriesData = useMemo(() => {
    const result: Record<string, number[]> = {}
    for (const cat of matrix.categories) {
      result[cat] = matrix.weeks.map(w => w.counts[cat] || 0)
    }
    return result
  }, [matrix])

  const globalMax = useMemo(() => {
    let max = 0
    for (const cat of matrix.categories) {
      for (const w of matrix.weeks) {
        if ((w.counts[cat] || 0) > max) max = w.counts[cat]
      }
    }
    return max
  }, [matrix])

  const catMaxes = useMemo(() => {
    const result: Record<string, number> = {}
    for (const cat of matrix.categories) {
      result[cat] = Math.max(...matrix.weeks.map(w => w.counts[cat] || 0), 1)
    }
    return result
  }, [matrix])

  const isHighlighted = (cat: string) => {
    if (!hoveredPair) return false
    if (hoveredPair.catB === '__ALL__') return hoveredPair.catA === cat
    return hoveredPair.catA === cat || hoveredPair.catB === cat
  }

  const isDimmed = (cat: string) => {
    if (!hoveredPair) return false
    return !isHighlighted(cat)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
        <h3 style={{ fontFamily: 'var(--font-bodoni-moda), Georgia, serif', fontSize: '1.2rem', fontWeight: 400, color: '#E5E5E5', margin: 0 }}>
          Weekly Activity
        </h3>
        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: '#666' }}>
          {matrix.weeks.length} weeks &middot; hover the graph above to highlight pairs
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.25rem' }}>
        {sortedCategories.map(cat => {
          const total = seriesData[cat].reduce((a, b) => a + b, 0)
          const avg = (total / matrix.weeks.length).toFixed(1)
          const highlighted = isHighlighted(cat)
          const dimmed = isDimmed(cat)

          return (
            <div
              key={cat}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.6rem',
                background: highlighted ? 'rgba(255,255,255,0.05)' : 'transparent',
                borderLeft: `3px solid ${highlighted ? getCatColor(cat) : 'transparent'}`,
                transition: 'all 200ms',
                cursor: 'default',
              }}
              onMouseEnter={() => onHoverPair({ catA: cat, catB: '__ALL__' })}
              onMouseLeave={() => onHoverPair(null)}
            >
              <div style={{ minWidth: '80px' }}>
                <div style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05rem',
                  color: getCatColor(cat),
                  opacity: dimmed ? 0.3 : 1,
                  transition: 'opacity 200ms',
                }}>
                  {cat}
                </div>
                <div style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.65rem',
                  color: '#777',
                  opacity: dimmed ? 0.3 : 1,
                  transition: 'opacity 200ms',
                }}>
                  avg {avg}/wk
                </div>
              </div>
              <Sparkline
                data={seriesData[cat]}
                color={getCatColor(cat)}
                max={catMaxes[cat]}
                highlighted={highlighted}
                dimmed={dimmed}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
