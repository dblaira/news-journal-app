'use client'

import { Entry } from '@/types'
import { formatEntryDateShort, truncate } from '@/lib/utils'

interface NotesContentProps {
  entries: Entry[]
  lifeArea: string
  onViewEntry: (id: string) => void
}

function NoteCard({ entry, onViewEntry }: { entry: Entry; onViewEntry: (id: string) => void }) {
  // Extract plain text from HTML content
  const plainText = entry.content.replace(/<[^>]*>/g, '').trim()
  const preview = truncate(plainText, 150)

  return (
    <button
      onClick={() => onViewEntry(entry.id)}
      style={{
        display: 'block',
        width: '100%',
        padding: '1.25rem',
        background: '#FFFBEB',
        border: '1px solid #FDE68A',
        borderRadius: '8px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        marginBottom: '0.75rem',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#F59E0B'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#FDE68A'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Headline */}
      <div
        style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: '#1F2937',
          marginBottom: '0.5rem',
          lineHeight: 1.4,
        }}
      >
        {entry.headline}
        {entry.pinned_at && <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }}>📌</span>}
      </div>

      {/* Preview */}
      {preview && (
        <div
          style={{
            fontSize: '0.85rem',
            color: '#6B7280',
            lineHeight: 1.5,
            marginBottom: '0.75rem',
          }}
        >
          {preview}
        </div>
      )}

      {/* Meta row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.7rem',
          color: '#9CA3AF',
        }}
      >
        <span
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#D97706',
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.03rem',
          }}
        >
          {entry.category}
        </span>
        <span>{formatEntryDateShort(entry.created_at)}</span>
      </div>
    </button>
  )
}

export function NotesContent({ entries, lifeArea, onViewEntry }: NotesContentProps) {
  // Filter notes by life area
  let filtered = entries.filter(e => e.entry_type === 'note')
  if (lifeArea !== 'all') {
    filtered = filtered.filter(e => e.category.toLowerCase() === lifeArea.toLowerCase())
  }

  // Separate pinned and unpinned
  const pinned = filtered.filter(e => e.pinned_at)
  const unpinned = filtered.filter(e => !e.pinned_at)

  // Sort by created date (newest first)
  unpinned.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const hasAny = pinned.length > 0 || unpinned.length > 0

  if (!hasAny) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>📝</div>
        <h3 style={{ margin: '0 0 0.5rem', color: '#1F2937', fontSize: '1.1rem', fontWeight: 600 }}>
          No notes yet
        </h3>
        <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>
          Capture quick thoughts and ideas with notes.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Pinned section */}
      {pinned.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h3
            style={{
              margin: '0 0 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#1F2937',
              textTransform: 'uppercase',
              letterSpacing: '0.08rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            Pinned
            <span
              style={{
                background: '#F3F4F6',
                color: '#6B7280',
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '0.15rem 0.5rem',
                borderRadius: '10px',
              }}
            >
              {pinned.length}
            </span>
          </h3>
          {pinned.map(entry => (
            <NoteCard key={entry.id} entry={entry} onViewEntry={onViewEntry} />
          ))}
        </section>
      )}

      {/* All notes */}
      {unpinned.length > 0 && (
        <section>
          {pinned.length > 0 && (
            <h3
              style={{
                margin: '0 0 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.08rem',
              }}
            >
              All Notes
            </h3>
          )}
          {unpinned.map(entry => (
            <NoteCard key={entry.id} entry={entry} onViewEntry={onViewEntry} />
          ))}
        </section>
      )}
    </div>
  )
}
