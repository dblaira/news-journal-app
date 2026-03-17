'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Extraction } from '@/types/extraction'
import { WeeklyMatrix, CorrelationPair, AnomalyWeek, CategoryStats } from '@/types/correlation'
import { buildWeeklyMatrix } from '@/lib/correlations/matrix'
import { computeAllCorrelations, computeLaggedCorrelations, computeCategoryStats, detectAnomalies } from '@/lib/correlations/math'
import { CATEGORY_COLORS } from '@/lib/extractions/aggregate'

interface CorrelationsViewProps {
  extractions: Extraction[]
}

function getCatColor(cat: string): string {
  return CATEGORY_COLORS[cat.toLowerCase()] || '#64748B'
}

function formatCoeff(n: number): string {
  return Math.round(Math.abs(n) * 100) + '% of the time'
}

function weekKeyToDateRange(weekKey: string): string {
  const [y, w] = weekKey.split('-W').map(Number)
  const jan1 = new Date(y, 0, 1)
  const dayOffset = (1 - jan1.getDay() + 7) % 7
  const monday = new Date(y, 0, 1 + dayOffset + (w - 1) * 7)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return fmt(monday) + ' – ' + fmt(sunday) + ', ' + y
}

function intensityColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'transparent'
  const ratio = Math.min(value / max, 1)
  const alpha = 0.1 + ratio * 0.7
  return `rgba(220, 20, 60, ${alpha})`
}

export function CorrelationsView({ extractions }: CorrelationsViewProps) {
  const router = useRouter()
  const [dateFrom, setDateFrom] = useState('2024-06-01')
  const today = new Date().toISOString().split('T')[0]
  const [dateTo, setDateTo] = useState(today)
  const [pendingFrom, setPendingFrom] = useState('2024-06-01')
  const [pendingTo, setPendingTo] = useState(today)
  const [tab, setTab] = useState<'matrix' | 'correlations' | 'anomalies'>('matrix')
  const [hoveredCell, setHoveredCell] = useState<{ week: string; cat: string } | null>(null)

  const matrix = useMemo(
    () => buildWeeklyMatrix(extractions, dateFrom, dateTo || undefined),
    [extractions, dateFrom, dateTo]
  )

  const stats = useMemo(() => computeCategoryStats(matrix), [matrix])
  const correlations = useMemo(() => computeAllCorrelations(matrix), [matrix])
  const lagged = useMemo(() => computeLaggedCorrelations(matrix), [matrix])
  const anomalies = useMemo(() => detectAnomalies(matrix, 2.5), [matrix])

  const maxCellValue = useMemo(() => {
    let max = 0
    for (const w of matrix.weeks) {
      for (const cat of matrix.categories) {
        if ((w.counts[cat] || 0) > max) max = w.counts[cat]
      }
    }
    return max
  }, [matrix])

  return (
    <div style={{ background: '#2A2A2A', color: '#E5E5E5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#F5F0E8', borderBottom: '2px solid var(--color-red, #DC143C)', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <button
            onClick={() => router.push('/extractions')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted, #666)', fontSize: '0.85rem', cursor: 'pointer', padding: 0, marginBottom: '1rem', fontFamily: 'var(--font-inter)' }}
          >
            &larr; Back to Extractions
          </button>
          <h1 style={{ fontFamily: "var(--font-bodoni-moda), Georgia, serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#1A1A1A', margin: 0 }}>
            Cross-Domain Correlations
          </h1>
          <p style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: '0.95rem', color: 'var(--text-muted, #666)', marginTop: '0.5rem', lineHeight: 1.6 }}>
            {matrix.totalExtractions} extractions across {matrix.weeks.length} weeks &middot; {matrix.categories.length} categories
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Date filter + tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
          <label style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', fontWeight: 600, color: '#999', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            From
            <input
              type="date"
              value={pendingFrom}
              onChange={(e) => {
                setPendingFrom(e.target.value)
                if (e.target.value) setDateFrom(e.target.value)
              }}
              style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', padding: '0.4rem 0.6rem', border: '1px solid rgba(255,255,255,0.15)', background: '#333', color: '#E5E5E5' }}
            />
          </label>
          <label style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', fontWeight: 600, color: '#999', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            To
            <input
              type="date"
              value={pendingTo}
              onChange={(e) => {
                setPendingTo(e.target.value)
                if (e.target.value) setDateTo(e.target.value)
              }}
              placeholder="present"
              style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', padding: '0.4rem 0.6rem', border: '1px solid rgba(255,255,255,0.15)', background: '#333', color: '#E5E5E5' }}
            />
          </label>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 0 }}>
            {(['matrix', 'correlations', 'anomalies'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.05rem',
                  textTransform: 'uppercase',
                  padding: '0.5rem 1rem',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRight: t === 'anomalies' ? '1px solid rgba(255,255,255,0.15)' : 'none',
                  background: tab === t ? '#DC143C' : '#333',
                  color: tab === t ? '#fff' : '#999',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Category stats bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {stats.sort((a, b) => b.totalCount - a.totalCount).map(s => (
            <span
              key={s.category}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08rem',
                padding: '0.3rem 0.6rem',
                background: getCatColor(s.category) + '20',
                color: getCatColor(s.category),
                borderLeft: `3px solid ${getCatColor(s.category)}`,
              }}
            >
              {s.category} &middot; {s.totalCount} total &middot; {s.coveragePercent}% of weeks
            </span>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'matrix' && (
          <MatrixTab matrix={matrix} maxCellValue={maxCellValue} hoveredCell={hoveredCell} setHoveredCell={setHoveredCell} />
        )}
        {tab === 'correlations' && (
          <CorrelationsTab correlations={correlations} lagged={lagged} />
        )}
        {tab === 'anomalies' && (
          <AnomaliesTab anomalies={anomalies} matrix={matrix} />
        )}
      </div>
    </div>
  )
}


function MatrixTab({ matrix, maxCellValue, hoveredCell, setHoveredCell }: {
  matrix: WeeklyMatrix
  maxCellValue: number
  hoveredCell: { week: string; cat: string } | null
  setHoveredCell: (v: { week: string; cat: string } | null) => void
}) {
  const reversedWeeks = useMemo(() => [...matrix.weeks].reverse(), [matrix.weeks])

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: 'var(--font-inter)', fontSize: '0.75rem' }}>
        <thead>
          <tr>
            <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08rem', color: '#999', position: 'sticky', left: 0, background: '#2A2A2A', zIndex: 2 }}>
              Week
            </th>
            {matrix.categories.map(cat => (
              <th key={cat} style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05rem', color: getCatColor(cat), fontSize: '0.65rem', minWidth: '60px' }}>
                {cat.slice(0, 6)}
              </th>
            ))}
            <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700, color: '#999' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {reversedWeeks.map(w => (
            <tr key={w.weekKey} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '0.4rem 0.5rem', fontWeight: 600, whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#2A2A2A', zIndex: 1, color: '#CCC' }}>
                {weekKeyToDateRange(w.weekKey)}
              </td>
              {matrix.categories.map(cat => {
                const val = w.counts[cat] || 0
                const isHovered = hoveredCell?.week === w.weekKey && hoveredCell?.cat === cat
                const domainData = matrix.domainBreakdown[w.weekKey]?.[cat]
                return (
                  <td
                    key={cat}
                    onMouseEnter={() => setHoveredCell({ week: w.weekKey, cat })}
                    onMouseLeave={() => setHoveredCell(null)}
                    style={{
                      padding: '0.4rem',
                      textAlign: 'center',
                      background: intensityColor(val, maxCellValue),
                      fontWeight: val > 0 ? 600 : 400,
                      color: val > 0 ? '#fff' : '#555',
                      position: 'relative',
                      cursor: val > 0 ? 'default' : 'auto',
                    }}
                  >
                    {val}
                    {isHovered && domainData && (
                      <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#1A1A1A',
                        color: '#fff',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.7rem',
                        whiteSpace: 'nowrap',
                        zIndex: 10,
                        pointerEvents: 'none',
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{cat} &middot; {w.weekKey}</div>
                        {Object.entries(domainData).map(([dom, cnt]) => (
                          <div key={dom}>{dom}: {cnt}</div>
                        ))}
                      </div>
                    )}
                  </td>
                )
              })}
              <td style={{ padding: '0.4rem', textAlign: 'center', fontWeight: 700, color: '#E5E5E5' }}>
                {w.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


function CorrelationsTab({ correlations, lagged }: { correlations: CorrelationPair[]; lagged: CorrelationPair[] }) {
  const positive = correlations.filter(c => c.coefficient > 0)
  const negative = correlations.filter(c => c.coefficient < 0)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      {/* Same-week correlations */}
      <div>
        <h2 style={{ fontFamily: "var(--font-bodoni-moda), Georgia, serif", fontSize: '1.6rem', fontWeight: 400, marginBottom: '1rem', color: '#E5E5E5' }}>
          Rise Together
        </h2>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: '#999', marginBottom: '1rem' }}>
          When one goes up, the other goes up too.
        </p>
        {positive.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: '#999' }}>No significant co-movements found.</p>
        ) : (
          positive.map((c, i) => <PairRow key={i} pair={c} />)
        )}
      </div>

      <div>
        <h2 style={{ fontFamily: "var(--font-bodoni-moda), Georgia, serif", fontSize: '1.6rem', fontWeight: 400, marginBottom: '1rem', color: '#E5E5E5' }}>
          Trade Off
        </h2>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: '#999', marginBottom: '1rem' }}>
          When one goes up, the other tends to go down.
        </p>
        {negative.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: '#999' }}>No significant inverse pairs found.</p>
        ) : (
          negative.map((c, i) => <PairRow key={i} pair={c} />)
        )}
      </div>

      {/* Leading indicators */}
      <div style={{ gridColumn: '1 / -1' }}>
        <h2 style={{ fontFamily: "var(--font-bodoni-moda), Georgia, serif", fontSize: '1.6rem', fontWeight: 400, marginBottom: '1rem', color: '#E5E5E5' }}>
          One Predicts the Other
        </h2>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: '#999', marginBottom: '1rem' }}>
          Activity in one category shows up 1-2 weeks before a spike in another.
        </p>
        {lagged.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: '#999' }}>No strong leading indicators found in this date range.</p>
        ) : (
          lagged.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', fontWeight: 700, color: getCatColor(c.categoryA), textTransform: 'uppercase', letterSpacing: '0.05rem' }}>
                {c.categoryA}
              </span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: '#999' }}>
                &rarr; {c.lag} week{c.lag > 1 ? 's' : ''} later &rarr;
              </span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', fontWeight: 700, color: getCatColor(c.categoryB), textTransform: 'uppercase', letterSpacing: '0.05rem' }}>
                {c.categoryB}
              </span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', fontWeight: 700, color: c.coefficient >= 0 ? '#16a34a' : '#DC143C', marginLeft: 'auto' }}>
                {formatCoeff(c.coefficient)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}


function PairRow({ pair }: { pair: CorrelationPair }) {
  const barWidth = Math.abs(pair.coefficient) * 100
  const isPositive = pair.coefficient >= 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', fontWeight: 700, color: getCatColor(pair.categoryA), textTransform: 'uppercase', letterSpacing: '0.05rem', minWidth: '70px' }}>
        {pair.categoryA}
      </span>
      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', position: 'relative' }}>
        <div style={{ height: '100%', width: `${barWidth}%`, background: isPositive ? '#16a34a' : '#DC143C', transition: 'width 300ms ease-out' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', fontWeight: 700, color: getCatColor(pair.categoryB), textTransform: 'uppercase', letterSpacing: '0.05rem', minWidth: '70px', textAlign: 'right' }}>
        {pair.categoryB}
      </span>
      <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', fontWeight: 700, color: isPositive ? '#16a34a' : '#DC143C', minWidth: '55px', textAlign: 'right' }}>
        {formatCoeff(pair.coefficient)}
      </span>
    </div>
  )
}


function AnomaliesTab({ anomalies, matrix }: { anomalies: AnomalyWeek[]; matrix: WeeklyMatrix }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: '#999', marginBottom: '1.5rem' }}>
        Weeks where something unusual happened — a category was way higher or lower than your normal. {anomalies.length} unusual weeks found.
      </p>

      {anomalies.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.95rem', color: '#999' }}>No anomaly weeks in this date range.</p>
      ) : (
        anomalies.map(a => (
          <div key={a.weekKey} style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', background: '#333' }}>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.02rem', color: '#E5E5E5', marginBottom: '0.75rem' }}>
              {weekKeyToDateRange(a.weekKey)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {a.anomalies.map((an, i) => (
                <div key={i} style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.75rem',
                  padding: '0.4rem 0.75rem',
                  background: an.direction === 'spike' ? 'rgba(220, 20, 60, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  color: an.direction === 'spike' ? '#FF4D6A' : '#60A5FA',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}>
                  <span style={{ textTransform: 'uppercase', letterSpacing: '0.05rem' }}>{an.category}</span>
                  <span>{an.direction === 'spike' ? '↑ way up' : '↓ way down'}</span>
                  <span style={{ color: '#BBB', fontWeight: 400 }}>({an.value} that week, usually {an.mean})</span>
                </div>
              ))}
            </div>
            {/* Domain breakdown for this week */}
            {Object.keys(a.domainBreakdown).length > 0 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {Object.entries(a.domainBreakdown).map(([cat, domains]) => (
                  <div key={cat} style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: '#BBB' }}>
                    <span style={{ fontWeight: 700, color: getCatColor(cat), textTransform: 'uppercase' }}>{cat}</span>:{' '}
                    {Object.entries(domains).map(([d, c]) => `${d} ${c}`).join(', ')}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
