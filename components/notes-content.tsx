'use client'

import { useState, useMemo } from 'react'
import { Entry } from '@/types'
import { formatEntryDateShort, truncate } from '@/lib/utils'
import { getEntryPosterWithFocalPoint } from '@/lib/utils/entry-images'

interface NotesContentProps {
  entries: Entry[]
  lifeArea: string
  onViewEntry: (id: string) => void
}

// ── Constants ────────────────────────────────────────────────────────

const RED = '#DC143C'
const DEVELOPING_WORD_THRESHOLD = 40
const BODONI = "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif"

// ── Category typography — matches lib/mindset.ts SVG identities ──────

interface CategoryTypography {
  fontFamily: string
  fontWeight: number
  letterSpacing: string
  fontStyle: string
  textTransform: 'uppercase' | 'lowercase' | 'capitalize' | 'none'
}

const categoryTypography: Record<string, CategoryTypography> = {
  Business: {
    fontFamily: "'Arial Black', Impact, sans-serif",
    fontWeight: 900,
    letterSpacing: '-0.03em',
    fontStyle: 'normal',
    textTransform: 'uppercase',
  },
  Finance: {
    fontFamily: "'Courier New', Courier, monospace",
    fontWeight: 400,
    letterSpacing: '0',
    fontStyle: 'normal',
    textTransform: 'lowercase',
  },
  Health: {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontWeight: 200,
    letterSpacing: '0.35em',
    fontStyle: 'normal',
    textTransform: 'uppercase',
  },
  Spiritual: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontWeight: 400,
    letterSpacing: '0',
    fontStyle: 'italic',
    textTransform: 'capitalize',
  },
  Fun: {
    fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
    fontWeight: 400,
    letterSpacing: '0.02em',
    fontStyle: 'normal',
    textTransform: 'capitalize',
  },
  Social: {
    fontFamily: "'Georgia', serif",
    fontWeight: 400,
    letterSpacing: '-0.05em',
    fontStyle: 'normal',
    textTransform: 'lowercase',
  },
  Romance: {
    fontFamily: "'Georgia', Garamond, serif",
    fontWeight: 300,
    letterSpacing: '0',
    fontStyle: 'italic',
    textTransform: 'capitalize',
  },
}

const defaultTypography: CategoryTypography = {
  fontFamily: "'Georgia', serif",
  fontWeight: 400,
  letterSpacing: '0',
  fontStyle: 'normal',
  textTransform: 'capitalize',
}

function getCategoryTypography(cat: string): CategoryTypography {
  return categoryTypography[cat] || defaultTypography
}

function getCategoryFont(cat: string): string {
  return getCategoryTypography(cat).fontFamily
}

// ── Helpers ───────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function groupByCategory(notes: Entry[]): { category: string; notes: Entry[] }[] {
  const map = new Map<string, Entry[]>()
  for (const note of notes) {
    const existing = map.get(note.category) || []
    existing.push(note)
    map.set(note.category, existing)
  }

  const groups = Array.from(map.entries()).map(([category, notes]) => ({
    category,
    notes: notes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  }))

  groups.sort((a, b) => {
    const aLatest = new Date(a.notes[0].created_at).getTime()
    const bLatest = new Date(b.notes[0].created_at).getTime()
    return bLatest - aLatest
  })

  return groups
}

// ── Card components ──────────────────────────────────────────────────

// LEFT COLUMN: Trending notes — blend into white background
function TrendingCard({ entry, onViewEntry, onImageError }: {
  entry: Entry
  onViewEntry: (id: string) => void
  onImageError: (id: string) => void
}) {
  const { url: imageUrl, objectPosition } = getEntryPosterWithFocalPoint(entry)
  const hasImage = !!imageUrl
  const plainText = stripHtml(entry.content)

  return (
    <div
      onClick={() => onViewEntry(entry.id)}
      style={{
        marginBottom: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
    >
      {hasImage && (
        <div style={{ width: '100%', height: '150px' }}>
          <img
            src={imageUrl}
            alt={entry.headline}
            onError={() => onImageError(entry.id)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition, display: 'block' }}
          />
        </div>
      )}

      <div style={{ padding: '0.85rem 1rem 1rem' }}>
        <div style={{
          fontFamily: BODONI,
          fontSize: '1.1rem',
          fontWeight: 400,
          color: '#1A1A1A',
          lineHeight: 1.3,
          marginBottom: '0.45rem',
        }}>
          {entry.headline}
        </div>

        <div style={{
          fontSize: '0.75rem',
          color: '#5A5650',
          lineHeight: 1.6,
          marginBottom: '0.5rem',
          display: '-webkit-box',
          WebkitLineClamp: 5,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {truncate(plainText, 250)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {(() => {
            const typo = getCategoryTypography(entry.category)
            return (
              <span style={{
                fontFamily: typo.fontFamily, color: RED, fontWeight: typo.fontWeight,
                fontStyle: typo.fontStyle, textTransform: typo.textTransform,
                letterSpacing: typo.letterSpacing, fontSize: '0.65rem', lineHeight: 1,
              }}>
                {entry.category}
              </span>
            )
          })()}
          <span style={{ fontSize: '0.6rem', color: '#9A9590', lineHeight: 1 }}>
            {formatEntryDateShort(entry.created_at)}
          </span>
          {entry.mood && (
            <span style={{ fontSize: '0.6rem', color: '#9A9590', lineHeight: 1 }}>
              &middot; {entry.mood}
            </span>
          )}
        </div>

        {entry.source_entry_id && (
          <div style={{
            marginTop: '0.45rem', paddingTop: '0.4rem',
            borderTop: '1px solid #F0EDE8', fontSize: '0.58rem', color: '#9A9590',
          }}>
            ↑ <span style={{ color: RED, fontWeight: 500 }}>Linked entry</span>
          </div>
        )}
      </div>
    </div>
  )
}

// CENTER COLUMN: Headline notes — float on uniform black
function HeadlineCard({ entry, onViewEntry, onImageError }: {
  entry: Entry
  onViewEntry: (id: string) => void
  onImageError: (id: string) => void
}) {
  const { url: imageUrl, objectPosition } = getEntryPosterWithFocalPoint(entry)
  const hasImage = !!imageUrl
  const plainText = stripHtml(entry.content)

  return (
    <div
      onClick={() => onViewEntry(entry.id)}
      style={{ marginBottom: '1.75rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.92' }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
    >
      {hasImage && (
        <div style={{ width: '100%', height: '180px', position: 'relative', marginBottom: '0.75rem' }}>
          <img
            src={imageUrl}
            alt={entry.headline}
            onError={() => onImageError(entry.id)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition, display: 'block' }}
          />
          <span style={{
            position: 'absolute', top: '0.5rem', right: '0.5rem',
            background: RED, color: '#fff', fontSize: '0.5rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06rem',
            padding: '0.2rem 0.5rem', borderRadius: 0,
          }}>
            Headline
          </span>
        </div>
      )}

      {!hasImage && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
          <span style={{
            background: RED, color: '#fff', fontSize: '0.5rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06rem',
            padding: '0.2rem 0.5rem', borderRadius: 0,
          }}>
            Headline
          </span>
        </div>
      )}

      <div style={{
        fontFamily: BODONI,
        fontSize: '1.25rem', fontWeight: 400, color: '#FFFFFF',
        lineHeight: 1.3, marginBottom: '0.45rem', letterSpacing: '-0.01em',
      }}>
        {entry.headline}
      </div>

      <div style={{
        fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)',
        lineHeight: 1.6, marginBottom: '0.6rem',
      }}>
        {truncate(plainText, 300)}
      </div>

      {(() => {
        const typo = getCategoryTypography(entry.category)
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: typo.fontFamily, color: RED, fontWeight: typo.fontWeight,
              fontStyle: typo.fontStyle, textTransform: typo.textTransform,
              letterSpacing: typo.letterSpacing, fontSize: '0.75rem', lineHeight: 1,
            }}>
              {entry.category}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1 }}>
              {formatEntryDateShort(entry.created_at)}
            </span>
            {entry.mood && (
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1 }}>
                &middot; {entry.mood}
              </span>
            )}
          </div>
        )
      })()}

      {entry.source_entry_id && (
        <div style={{
          marginTop: '0.5rem', paddingTop: '0.45rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)',
        }}>
          ↑ <span style={{ color: '#E8857A', fontWeight: 500 }}>Linked entry</span>
        </div>
      )}
    </div>
  )
}

// RIGHT COLUMN: Opinion — compact note cards
function OpinionCard({ entry, onViewEntry, onImageError }: {
  entry: Entry
  onViewEntry: (id: string) => void
  onImageError: (id: string) => void
}) {
  const { url: imageUrl, objectPosition } = getEntryPosterWithFocalPoint(entry)
  const hasImage = !!imageUrl
  const plainText = stripHtml(entry.content)

  return (
    <div
      onClick={() => onViewEntry(entry.id)}
      style={{
        display: 'flex', gap: '0.6rem', padding: '0.6rem',
        background: '#FFFFFF', border: '1px solid #E8E5DF', borderRadius: 0,
        cursor: 'pointer', transition: 'all 0.15s ease', marginBottom: '0.4rem',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D1CCC4'; e.currentTarget.style.background = '#FDFCFA' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E5DF'; e.currentTarget.style.background = '#FFFFFF' }}
    >
      {hasImage && (
        <div style={{ flexShrink: 0, width: '56px', height: '56px', borderRadius: 0, overflow: 'hidden' }}>
          <img
            src={imageUrl}
            alt=""
            onError={() => onImageError(entry.id)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition, display: 'block' }}
          />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: BODONI,
          fontSize: '0.88rem', fontWeight: 600, color: '#1F2937', lineHeight: 1.3,
          marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {entry.headline}
        </div>
        <div style={{
          fontSize: '0.68rem', color: '#6B7280', lineHeight: 1.4,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {truncate(plainText, 100)}
        </div>
        <div style={{ marginTop: '0.2rem', fontSize: '0.55rem', color: '#9CA3AF' }}>
          {formatEntryDateShort(entry.created_at)}
        </div>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────

export function NotesContent({ entries, lifeArea, onViewEntry }: NotesContentProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const handleImageError = (id: string) => setImageErrors(prev => new Set(prev).add(id))

  // Filter notes by life area
  const filtered = useMemo(() => {
    let notes = entries.filter(e => e.entry_type === 'note')
    if (lifeArea !== 'all') {
      notes = notes.filter(e => e.category.toLowerCase() === lifeArea.toLowerCase())
    }
    return notes
  }, [entries, lifeArea])

  // Classify: headline (center/pinned), trending (left/substantial), opinion (right/lighter)
  const { headline, trending, opinion } = useMemo(() => {
    const headline = filtered.filter(e => e.pinned_at)
    const unpinned = filtered.filter(e => !e.pinned_at)

    // "Trending" = substantial notes still building momentum (long content)
    const trending = unpinned.filter(e => {
      const plainText = stripHtml(e.content)
      return plainText.split(/\s+/).length > DEVELOPING_WORD_THRESHOLD
    })
    const trendingIds = new Set(trending.map(e => e.id))
    // "Opinion" = lighter captures, perspectives, quick references
    const opinion = unpinned.filter(e => !trendingIds.has(e.id))

    return { headline, trending, opinion }
  }, [filtered])

  const groupedTrending = useMemo(() => groupByCategory(trending), [trending])
  const groupedOpinion = useMemo(() => groupByCategory(opinion), [opinion])

  const hasAny = headline.length > 0 || trending.length > 0 || opinion.length > 0

  if (!hasAny) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>📝</div>
        <h3 style={{ fontFamily: BODONI, margin: '0 0 0.5rem', color: '#1F2937', fontSize: '1.25rem', fontWeight: 600 }}>
          No notes yet
        </h3>
        <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>
          Capture quick thoughts and ideas with notes.
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: '#FFFFFF' }}>
      {/* ── BLACK HEADER ──────────────────────────────────────── */}
      <header style={{ background: '#111111', padding: '2rem 1.5rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{
            fontFamily: BODONI,
            fontSize: 'clamp(2.8rem, 5.5vw, 4rem)', fontWeight: 400,
            color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1,
            margin: '0 0 0.25rem',
          }}>
            Notes
          </h1>
          <span style={{
            fontFamily: BODONI,
            fontSize: 'clamp(1.15rem, 2.3vw, 1.5rem)', fontWeight: 400,
            color: '#FFFFFF', letterSpacing: '-0.01em',
            fontStyle: 'italic',
          }}>
            From story to story
          </span>
        </div>
      </header>

      {/* ── 3-COLUMN LAYOUT ───────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        {/* Background layer — extends to viewport edges */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr',
          maxWidth: '1200px', margin: '0 auto', zIndex: 0,
        }}>
          <div style={{ background: '#FFFFFF', boxShadow: '-100vw 0 0 0 #FFFFFF', borderTop: `3px solid ${RED}` }}>
            <div style={{ position: 'absolute', top: 0, left: '-100vw', width: '100vw', height: '3px', background: RED }} />
          </div>
          <div style={{ background: '#111111', borderLeft: `3px solid ${RED}` }} />
          <div style={{ background: '#F5F2ED', boxShadow: '100vw 0 0 0 #F5F2ED', borderTop: `3px solid ${RED}` }}>
            <div style={{ position: 'absolute', top: 0, right: '-100vw', width: '100vw', height: '3px', background: RED }} />
          </div>
        </div>

        {/* Content grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr',
          maxWidth: '1200px', margin: '0 auto',
          minHeight: 'calc(100vh - 160px)',
          position: 'relative', zIndex: 1,
        }}>

          {/* LEFT COLUMN: Trending */}
          <div style={{ padding: '1.25rem 1.25rem 2rem', overflow: 'hidden', minWidth: 0, overflowWrap: 'break-word' as const }}>
            <h2 style={{
              fontFamily: BODONI,
              margin: '0 0 0.75rem', fontSize: '0.7rem', fontWeight: 700,
              color: RED, textTransform: 'uppercase', letterSpacing: '0.1rem',
              paddingBottom: '0.5rem', borderBottom: '1px solid #E5E2DD',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>Trending</span>
              <span style={{
                background: 'rgba(220,20,60,0.08)', color: RED,
                fontSize: '0.55rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 0,
              }}>
                {trending.length}
              </span>
            </h2>

            {trending.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: '#9A9590', fontStyle: 'italic' }}>
                No trending notes yet.
              </p>
            )}

            {groupedTrending.map(group => {
              const typo = getCategoryTypography(group.category)
              return (
                <div key={group.category} style={{ marginBottom: '1rem' }}>
                  <div style={{
                    fontFamily: typo.fontFamily, fontSize: '0.65rem',
                    fontWeight: typo.fontWeight, fontStyle: typo.fontStyle,
                    color: RED, textTransform: typo.textTransform,
                    letterSpacing: typo.letterSpacing, marginBottom: '0.5rem',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                  }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: 0, background: RED, opacity: 0.4 }} />
                    {group.category}
                  </div>
                  {group.notes.map(entry => (
                    <TrendingCard key={entry.id} entry={entry} onViewEntry={onViewEntry} onImageError={handleImageError} />
                  ))}
                </div>
              )
            })}
          </div>

          {/* CENTER COLUMN: Headline */}
          <div style={{ padding: '1.25rem 1.5rem 2rem', overflow: 'hidden', minWidth: 0, overflowWrap: 'break-word' as const }}>
            <h2 style={{
              fontFamily: BODONI,
              margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 700,
              color: RED, textTransform: 'uppercase', letterSpacing: '0.14rem',
              paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center',
            }}>
              Headline
              <span style={{
                background: 'rgba(220,20,60,0.15)', color: RED,
                fontSize: '0.55rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 0,
                marginLeft: '0.5rem', verticalAlign: 'middle',
              }}>
                {headline.length}
              </span>
            </h2>

            {headline.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
                Pin your most important notes to make them headlines.
              </p>
            )}

            {headline.map(entry => (
              <HeadlineCard key={entry.id} entry={entry} onViewEntry={onViewEntry} onImageError={handleImageError} />
            ))}
          </div>

          {/* RIGHT COLUMN: Opinion */}
          <div style={{ padding: '1.25rem 1.25rem 2rem', overflow: 'hidden', minWidth: 0, overflowWrap: 'break-word' as const }}>
            <h2 style={{
              fontFamily: BODONI,
              margin: '0 0 0.75rem', fontSize: '0.7rem', fontWeight: 700,
              color: RED, textTransform: 'uppercase', letterSpacing: '0.1rem',
              paddingBottom: '0.5rem', borderBottom: '1px solid #E0DBD3',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>Opinion</span>
              <span style={{
                background: 'rgba(220,20,60,0.08)', color: RED,
                fontSize: '0.55rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 0,
              }}>
                {opinion.length}
              </span>
            </h2>

            {opinion.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: '#9A9590', fontStyle: 'italic' }}>
                No opinion notes yet.
              </p>
            )}

            {groupedOpinion.map(group => {
              const typo = getCategoryTypography(group.category)
              return (
                <div key={group.category} style={{ marginBottom: '1rem' }}>
                  <div style={{
                    fontFamily: typo.fontFamily, fontSize: '0.65rem',
                    fontWeight: typo.fontWeight, fontStyle: typo.fontStyle,
                    color: RED, textTransform: typo.textTransform,
                    letterSpacing: typo.letterSpacing, marginBottom: '0.4rem',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                  }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: 0, background: RED, opacity: 0.4 }} />
                    {group.category}
                    <span style={{ color: '#B5AFA7', fontWeight: 500, marginLeft: 'auto' }}>
                      {group.notes.length}
                    </span>
                  </div>
                  {group.notes.map(entry => (
                    <OpinionCard key={entry.id} entry={entry} onViewEntry={onViewEntry} onImageError={handleImageError} />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
