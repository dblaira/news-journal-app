'use client'

import { useState } from 'react'
import { Entry, ConnectionType } from '@/types'
import { stripHtml } from '@/lib/utils'
import { getEntryPosterWithFocalPoint } from '@/lib/utils/entry-images'

interface ConnectionGridLayoutProps {
  connections: Entry[]
  onViewEntry: (id: string) => void
  entryLookup: Map<string, Entry>
}

const CONNECTION_TYPE_META: Record<ConnectionType, { icon: string; label: string; color: string }> = {
  identity_anchor: { icon: '\u{1FA9E}', label: 'Identity Anchor', color: '#7C3AED' },
  pattern_interrupt: { icon: '\u26A1', label: 'Pattern Interrupt', color: '#D97706' },
  validated_principle: { icon: '\u{1F511}', label: 'Validated Principle', color: '#059669' },
  process_anchor: { icon: '\u{1F504}', label: 'Process Anchor', color: '#2563EB' },
}

function formatSurfacedAgo(lastSurfacedAt: string | null | undefined): string {
  if (!lastSurfacedAt) return 'Never surfaced'
  const diff = Date.now() - new Date(lastSurfacedAt).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Surfaced today'
  if (days === 1) return 'Surfaced yesterday'
  return `Surfaced ${days}d ago`
}

const filterTypes: (ConnectionType | 'all')[] = [
  'all',
  'identity_anchor',
  'pattern_interrupt',
  'validated_principle',
  'process_anchor',
]

export function ConnectionGridLayout({ connections, onViewEntry, entryLookup }: ConnectionGridLayoutProps) {
  const [typeFilter, setTypeFilter] = useState<ConnectionType | 'all'>('all')
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleImageError = (id: string) => {
    setImageErrors(prev => new Set(prev).add(id))
  }

  const filtered = typeFilter === 'all'
    ? connections
    : connections.filter(c => c.connection_type === typeFilter)

  return (
    <div style={{ background: '#FFFFFF', padding: '2.5rem 0' }}>
      <div className="px-4 md:px-6 mx-auto">
        <div style={{
          borderTop: '1px solid #e5e7eb',
          borderBottom: '1px solid #e5e7eb',
          padding: '0.75rem 0',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <h2
            style={{
              fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#1a1a1a',
              margin: 0,
            }}
          >
            All Connections
          </h2>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {filterTypes.map(type => {
              const isActive = typeFilter === type
              const label = type === 'all' ? 'All' : CONNECTION_TYPE_META[type].label
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  style={{
                    padding: '0.3rem 0.7rem',
                    borderRadius: '16px',
                    border: isActive ? '1px solid #DC143C' : '1px solid #d1d5db',
                    background: isActive ? '#DC143C' : 'transparent',
                    color: isActive ? '#fff' : '#4B5563',
                    fontSize: '0.72rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: '#9CA3AF',
          }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>
              No connections of this type yet
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}>
            {filtered.map(conn => {
              const plainContent = stripHtml(conn.content).trim()
              const displayText = plainContent.length > 160 ? plainContent.slice(0, 160) + '...' : plainContent
              const meta = conn.connection_type ? CONNECTION_TYPE_META[conn.connection_type] : null

              const sourceEntry = conn.source_entry_id ? entryLookup.get(conn.source_entry_id) : undefined
              const { url: imgUrl, objectPosition } = sourceEntry ? getEntryPosterWithFocalPoint(sourceEntry) : { url: undefined, objectPosition: '50% 50%' }
              const hasImage = !!imgUrl && !imageErrors.has(conn.id)

              return (
                <button
                  key={conn.id}
                  onClick={() => onViewEntry(conn.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    background: '#FFFFFF',
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#DC143C'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 20, 60, 0.08)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#f0f0f0'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Header image from source entry */}
                  {hasImage && (
                    <div style={{ width: '100%', height: '140px', overflow: 'hidden' }}>
                      <img
                        src={imgUrl}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition,
                          display: 'block',
                        }}
                        onError={() => handleImageError(conn.id)}
                      />
                    </div>
                  )}

                  {/* Text content */}
                  <div style={{
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flexGrow: 1,
                    minHeight: '100px',
                  }}>
                    <div style={{
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      color: '#1a1a1a',
                      lineHeight: 1.55,
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      flexGrow: 1,
                    }}>
                      &ldquo;{displayText}&rdquo;
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginTop: '0.75rem',
                      fontSize: '0.72rem',
                      color: '#9CA3AF',
                    }}>
                      {meta && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: meta.color,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}>
                          {meta.icon} {meta.label}
                        </span>
                      )}
                      <span>{formatSurfacedAgo(conn.last_surfaced_at)}</span>
                      {(conn.surface_count ?? 0) > 0 && (
                        <span style={{ fontWeight: 600, color: '#6B7280' }}>
                          {conn.surface_count}&times;
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
