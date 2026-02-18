'use client'

import { useState } from 'react'
import { Entry, ConnectionType } from '@/types'
import { stripHtml } from '@/lib/utils'

interface ConnectionsContentProps {
  entries: Entry[]
  lifeArea: string
  onViewEntry: (id: string) => void
}

const CONNECTION_TYPE_META: Record<ConnectionType, { icon: string; label: string }> = {
  identity_anchor: { icon: '🪞', label: 'Identity Anchor' },
  pattern_interrupt: { icon: '⚡', label: 'Pattern Interrupt' },
  validated_principle: { icon: '🔑', label: 'Validated Principle' },
  process_anchor: { icon: '🔄', label: 'Process Anchor' },
}

function formatSurfacedAgo(lastSurfacedAt: string | null | undefined): string {
  if (!lastSurfacedAt) return 'Never surfaced'
  const diff = Date.now() - new Date(lastSurfacedAt).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Surfaced today'
  if (days === 1) return 'Surfaced yesterday'
  return `Surfaced ${days} days ago`
}

export function ConnectionsContent({ entries, lifeArea, onViewEntry }: ConnectionsContentProps) {
  const [typeFilter, setTypeFilter] = useState<ConnectionType | 'all'>('all')

  let connections = entries.filter(e => e.entry_type === 'connection')
  if (lifeArea !== 'all') {
    connections = connections.filter(e => e.category.toLowerCase() === lifeArea.toLowerCase())
  }
  if (typeFilter !== 'all') {
    connections = connections.filter(e => e.connection_type === typeFilter)
  }

  connections.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const filterTypes: (ConnectionType | 'all')[] = ['all', 'identity_anchor', 'pattern_interrupt', 'validated_principle', 'process_anchor']

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
          fontSize: '1.8rem',
          fontWeight: 400,
          color: '#1a1a1a',
          marginBottom: '0.25rem',
        }}>
          Belief Library
        </h2>
        <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0 }}>
          {connections.length} connection{connections.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Type filter chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {filterTypes.map(type => {
          const isActive = typeFilter === type
          const label = type === 'all' ? 'All' : CONNECTION_TYPE_META[type].label
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '16px',
                border: isActive ? '1px solid #1a1a1a' : '1px solid #d1d5db',
                background: isActive ? '#1a1a1a' : 'transparent',
                color: isActive ? '#fff' : '#4B5563',
                fontSize: '0.75rem',
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

      {/* Connection list */}
      {connections.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: '#9CA3AF',
        }}>
          <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔗</p>
          <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>No connections yet</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
            Select text in any entry and tap Connect, or capture a short principle via Compose.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {connections.map(conn => {
            const meta = conn.connection_type ? CONNECTION_TYPE_META[conn.connection_type] : null
            const plainContent = stripHtml(conn.content).trim()
            const displayText = plainContent.length > 140 ? plainContent.slice(0, 140) + '...' : plainContent

            return (
              <button
                key={conn.id}
                onClick={() => onViewEntry(conn.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  width: '100%',
                  padding: '0.85rem 1rem',
                  background: '#fff',
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  marginBottom: '0.5rem',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = '#e5e5e5' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#f0f0f0' }}
              >
                <div style={{
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: '#1a1a1a',
                  lineHeight: 1.5,
                  fontFamily: "'Georgia', serif",
                }}>
                  &ldquo;{displayText}&rdquo;
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.72rem',
                  color: '#9CA3AF',
                }}>
                  {meta && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: '#6B7280',
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
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
