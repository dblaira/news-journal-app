'use client'

import { useState, useEffect } from 'react'

interface HistoryItem {
  id: string
  action: string
  surfaced_at: string | null
  responded_at: string | null
  connection_id: string
  connection_content: string
  connection_type: string
  connection_headline: string
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  landed: { label: 'Landed', color: '#166534' },
  snooze: { label: 'Snoozed', color: '#92400e' },
  opened: { label: 'Opened', color: '#374151' },
}

const TYPE_LABELS: Record<string, string> = {
  identity_anchor: 'Identity Anchor',
  pattern_interrupt: 'Pattern Interrupt',
  validated_principle: 'Validated Principle',
  process_anchor: 'Process Anchor',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export function NotificationHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/notifications/history')
        const data = await res.json()
        if (res.ok) {
          setHistory(data.history || [])
        } else {
          setError(data.error || 'Failed to load')
        }
      } catch {
        setError('Network error')
      }
      setIsLoading(false)
    }
    fetchHistory()
  }, [])

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: '1rem' }}>
        Notification History
      </h3>

      {isLoading && (
        <div style={{ fontSize: '0.85rem', color: '#9CA3AF', padding: '1rem 0' }}>Loading...</div>
      )}

      {error && (
        <div style={{ fontSize: '0.85rem', color: '#DC2626', padding: '1rem 0' }}>{error}</div>
      )}

      {!isLoading && !error && history.length === 0 && (
        <div style={{ fontSize: '0.85rem', color: '#9CA3AF', padding: '1rem 0' }}>
          No notification responses yet. Responses will appear here after you interact with notifications.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {history.map(item => {
          const actionMeta = ACTION_LABELS[item.action] || { label: item.action, color: '#6B7280' }
          const typeLabel = TYPE_LABELS[item.connection_type] || 'Connection'

          return (
            <div key={item.id} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #f3f4f6',
              background: '#fafafa',
            }}>
              <div style={{
                padding: '0.2rem 0.5rem',
                borderRadius: '10px',
                background: actionMeta.color + '18',
                color: actionMeta.color,
                fontSize: '0.7rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                marginTop: '0.1rem',
              }}>
                {actionMeta.label}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', color: '#374151', lineHeight: 1.4 }}>
                  {item.connection_content || 'Connection content'}
                  {item.connection_content.length >= 100 && '...'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                  {typeLabel} &middot; {item.responded_at ? timeAgo(item.responded_at) : ''}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
