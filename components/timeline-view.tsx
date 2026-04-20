'use client'

import { useState, useEffect, useCallback } from 'react'
import { Entry, EntryType } from '@/types'
import { formatEntryDateShort, truncateHtml } from '@/lib/utils'
import { getEntryPosterWithFocalPoint } from '@/lib/utils/entry-images'
import { StoryCarousel } from './story-carousel'

const BODONI = "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif"

function getTodayFormatted(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

interface TimelineViewProps {
  entries: Entry[]
  lifeArea: string
  entryType: EntryType | null
  searchQuery: string
  onViewEntry: (id: string) => void
}

interface MonthGroup {
  label: string
  entries: Entry[]
}

function groupEntriesByMonth(entries: Entry[]): MonthGroup[] {
  const groups = new Map<string, Entry[]>()

  for (const entry of entries) {
    const date = new Date(entry.created_at)
    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(entry)
  }

  // Convert to sorted array (newest first)
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, entries]) => ({
      label: new Date(entries[0].created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
      entries,
    }))
}

function getEntryTypeIcon(entryType?: EntryType): string {
  switch (entryType) {
    case 'action': return '☑'
    case 'note': return '📝'
    case 'story':
    default: return '📰'
  }
}

function getEntryTypeLabel(entryType?: EntryType): string {
  switch (entryType) {
    case 'action': return 'Action'
    case 'note': return 'Note'
    case 'story':
    default: return 'Story'
  }
}

export function TimelineView({
  entries,
  lifeArea,
  entryType,
  searchQuery,
  onViewEntry,
}: TimelineViewProps) {
  const [displayCount, setDisplayCount] = useState(30)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleImageError = (entryId: string) => {
    setImageErrors((prev) => new Set(prev).add(entryId))
  }

  // Filter entries
  let filtered = [...entries]
  if (lifeArea !== 'all') {
    filtered = filtered.filter(
      (e) => e.category.toLowerCase() === lifeArea.toLowerCase()
    )
  }
  if (entryType) {
    filtered = filtered.filter((e) => (e.entry_type || 'story') === entryType)
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter((entry) => {
      const haystack = [
        entry.headline,
        entry.subheading,
        entry.content,
        entry.mood,
        entry.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }

  // Paginate
  const displayedEntries = filtered.slice(0, displayCount)
  const hasMore = displayCount < filtered.length
  const monthGroups = groupEntriesByMonth(displayedEntries)

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 30)
  }

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(30)
  }, [lifeArea, entryType, searchQuery])

  if (filtered.length === 0) {
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
        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>
          {searchQuery ? '🔍' : '📅'}
        </div>
        <h3 style={{ margin: '0 0 0.5rem', color: '#1F2937', fontSize: '1.1rem', fontWeight: 600 }}>
          {searchQuery ? 'No matching entries' : 'No entries yet'}
        </h3>
        <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>
          {searchQuery
            ? `No entries match "${searchQuery}". Try a different search.`
            : 'Create entries to see them in your timeline.'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      {/* ── BEIGE HEADER ──────────────────────────────────────── */}
      <header style={{ background: '#E8E2D8', padding: '3rem 3rem 2.5rem', borderBottom: '3px solid #DC143C' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            fontSize: '0.75rem',
            letterSpacing: '0.1rem',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginBottom: '1.5rem',
          }}>
            <span style={{ color: '#DC143C' }}>
              {lifeArea === 'all' ? 'All Areas' : lifeArea}
            </span>
            <span style={{ color: '#8B8178' }}>
              {getTodayFormatted()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h1 style={{
              fontFamily: BODONI,
              fontSize: 'clamp(2.8rem, 5.5vw, 4rem)', fontWeight: 400,
              color: '#DC143C', letterSpacing: '-0.02em', lineHeight: 1.1,
              margin: '0 0 0.25rem',
            }}>
              All Entries
            </h1>
            <span style={{ fontSize: '0.85rem', color: '#8B8178', fontWeight: 500 }}>
              {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <span style={{
            fontFamily: BODONI,
            fontSize: 'clamp(1.15rem, 2.3vw, 1.5rem)', fontWeight: 400,
            color: '#6B7280', letterSpacing: '-0.01em',
            fontStyle: 'italic',
          }}>
            Your complete archive
          </span>
        </div>
      </header>

      {/* Carousel for quick-swipe on mobile */}
      {filtered.length > 0 && (
        <StoryCarousel
          entries={filtered.slice(0, 15)}
          title="LATEST"
          onViewEntry={onViewEntry}
        />
      )}

      {/* Month Groups */}
      {monthGroups.map((group) => (
        <div key={group.label}>
          {/* Month Header */}
          <div
            style={{
              padding: '1.25rem 2rem 0.75rem',
              background: '#FAFAFA',
              borderBottom: '1px solid #F3F4F6',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            <h3
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: 0,
              }}
            >
              {group.label}
            </h3>
          </div>

          {/* Entries */}
          <div>
            {group.entries.map((entry) => {
              const { url: imageUrl, objectPosition } = getEntryPosterWithFocalPoint(entry)
              const hasRealImage = !!imageUrl && !imageErrors.has(entry.id)
              const typeLabel = getEntryTypeLabel(entry.entry_type)
              const typeIcon = getEntryTypeIcon(entry.entry_type)

              return (
                <div
                  key={entry.id}
                  onClick={() => onViewEntry(entry.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderBottom: '1px solid #F3F4F6',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F9FAFB'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {hasRealImage && (
                    <div
                      style={{
                        width: '100%',
                        height: '180px',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt={entry.headline}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition,
                        }}
                        onError={() => handleImageError(entry.id)}
                      />
                    </div>
                  )}

                  <div style={{ padding: '1rem 2rem', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: '#DC143C',
                        }}
                      >
                        {entry.category}
                      </span>
                      <span style={{ color: '#D1D5DB', fontSize: '0.65rem' }}>|</span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: '#9CA3AF',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <span>{typeIcon}</span>
                        {typeLabel}
                      </span>
                    </div>

                    <h4
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#111827',
                        margin: '0 0 0.25rem',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.headline}
                    </h4>

                    {entry.subheading && (
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: '#6B7280',
                          margin: '0 0 0.25rem',
                          fontStyle: 'italic',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {entry.subheading}
                      </p>
                    )}

                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: '#9CA3AF',
                        margin: 0,
                      }}
                    >
                      {formatEntryDateShort(entry.created_at)}
                      {entry.mood && (
                        <span style={{ marginLeft: '0.5rem' }}>
                          · {entry.mood}
                        </span>
                      )}
                      {entry.entry_type === 'action' && entry.completed_at && (
                        <span style={{ marginLeft: '0.5rem', color: '#22C55E' }}>
                          · Completed
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Load More */}
      {hasMore && (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <button
            onClick={handleLoadMore}
            style={{
              padding: '0.75rem 2rem',
              background: '#111827',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1F2937'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#111827'
            }}
          >
            Load More ({filtered.length - displayCount} remaining)
          </button>
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && filtered.length > 0 && (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#D1D5DB',
            fontSize: '0.8rem',
          }}
        >
          Showing all {filtered.length} entries
        </div>
      )}
    </div>
  )
}
