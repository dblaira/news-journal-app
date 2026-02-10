'use client'

import { useState } from 'react'

// ── Sample data ──────────────────────────────────────────────────────

interface SampleNote {
  id: string
  headline: string
  content: string
  category: string
  created_at: string
  pinned_at?: string | null
  imageUrl?: string
  source_headline?: string
  mood?: string
}

const SAMPLE_NOTES: SampleNote[] = [
  // Pinned notes (center column)
  {
    id: 'p1',
    headline: 'The delegation problem isn\'t about trust',
    content: 'It\'s about articulation. I can\'t delegate what I can\'t describe. The real bottleneck is that I haven\'t thought through the process clearly enough to hand it off. Writing the delegation brief IS the thinking.',
    category: 'Business',
    created_at: '2026-02-08T10:30:00Z',
    pinned_at: '2026-02-08T11:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    source_headline: 'Delegation Framework Using C.L.E.A.R.',
  },
  {
    id: 'p2',
    headline: 'Morning ritual refinement',
    content: 'Cold plunge before journal, not after. The clarity from cold exposure makes the writing sharper. Three weeks of data confirms this. The sequence matters more than the duration.',
    category: 'Health',
    created_at: '2026-02-07T06:15:00Z',
    pinned_at: '2026-02-07T07:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
    mood: 'focused',
  },
  {
    id: 'p3',
    headline: 'Revenue model — subscription vs freemium',
    content: 'Three paths: (1) subscription at $9/mo with trial, (2) freemium with AI as the paid gate, (3) one-time purchase. Subscription aligns with ongoing AI costs but market is fatigued. Freemium builds word of mouth faster.',
    category: 'Business',
    created_at: '2026-02-06T16:40:00Z',
    pinned_at: '2026-02-06T17:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    source_headline: 'Understood App Business Strategy',
  },
  // Developing notes (left column)
  {
    id: 'd1',
    headline: 'Systems Thinking Applied to Sports Betting',
    content: 'You don\'t need to predict games — you need to predict how the market misprices them. This is fundamentally different. The market is a crowd of bettors, each with their own biases. Your edge comes from understanding the crowd\'s blind spots.\n\nThree areas of persistent mispricing: (1) recency bias on injuries, (2) travel fatigue in Thursday NFL games, (3) public sentiment on rivalry games inflates lines 1.5-2 points.\n\nThis is pattern recognition. Competitive dynamics. "Who\'s gaining an edge and why?"',
    category: 'Finance',
    created_at: '2026-02-03T15:20:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=300&fit=crop',
    source_headline: 'Sports Analytics Deep Dive',
  },
  {
    id: 'd2',
    headline: 'The Compound Journal Thesis',
    content: 'What if the journal itself is the product of compounding? Each entry creates a node in a growing network of ideas. The AI rewrites aren\'t decoration — they\'re lenses.\n\nOver time, connections between entries become more valuable than any single entry. Weekly themes are the first hint.\n\nThe pitch: "Your thoughts compound like interest. We help you see the returns."',
    category: 'Business',
    created_at: '2026-02-02T11:45:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=400&h=300&fit=crop',
  },
  {
    id: 'd3',
    headline: 'Sleep architecture and HRV correlation',
    content: 'Magnesium glycinate 400mg at 8pm instead of 9pm. The earlier timing gives it a full hour before melatonin cascade. Blue-light glasses from 7pm — early results promising. HRV up 12% this week. Deep sleep stage 3 extended by ~18 minutes on average.',
    category: 'Health',
    created_at: '2026-02-05T21:30:00Z',
    mood: 'calm',
  },
  // All notes (right column) — grouped by category
  {
    id: 'a1',
    headline: 'Look into Readwise Reader API',
    content: 'Could auto-import highlights as notes. Check rate limits.',
    category: 'Business',
    created_at: '2026-02-09T14:22:00Z',
  },
  {
    id: 'a2',
    headline: 'Notification architecture sketch',
    content: 'Three trigger types: entry-based, time-based, location-based. Need a unified queue. Consider Vercel Cron for time-based, geofencing API for location.',
    category: 'Business',
    created_at: '2026-02-09T09:05:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
  },
  {
    id: 'a3',
    headline: 'Call Marcus about the property',
    content: 'Before Thursday. Ask about zoning change timeline.',
    category: 'Finance',
    created_at: '2026-02-09T09:05:00Z',
  },
  {
    id: 'a4',
    headline: 'Compound interest visualization for Dad',
    content: 'He responds to visuals. Build a simple chart showing the difference between starting at 25 vs 35. Use his actual numbers if he shares them.',
    category: 'Finance',
    created_at: '2026-02-07T18:30:00Z',
  },
  {
    id: 'a5',
    headline: '"The obstacle is the way"',
    content: 'Re-read this. Applies to the client situation.',
    category: 'Spiritual',
    created_at: '2026-02-08T22:10:00Z',
  },
  {
    id: 'a6',
    headline: 'Conversation with Dad about legacy',
    content: '"The things you build matter less than the way you build them." Need to sit with this. Changes how I think about speed vs. craft.',
    category: 'Social',
    created_at: '2026-02-04T19:00:00Z',
  },
  {
    id: 'a7',
    headline: 'Running form cue from Giacomo',
    content: '"Land with your foot under your hip, not in front of it." Immediate difference in knee pressure. Film next run for comparison.',
    category: 'Health',
    created_at: '2026-02-08T07:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1461896836934-bd45ba0c0e6e?w=400&h=300&fit=crop',
  },
  {
    id: 'a8',
    headline: 'Playlist curation idea',
    content: 'What if the app generated a playlist mood based on your week\'s entries? Match journal mood to music mood.',
    category: 'Fun',
    created_at: '2026-02-06T20:15:00Z',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────

const RED = '#DC143C'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function groupByCategory(notes: SampleNote[]): { category: string; notes: SampleNote[] }[] {
  const map = new Map<string, SampleNote[]>()
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

// Category typographic identities — matching lib/mindset.ts SVG treatments
// Each category has a unique font, weight, spacing, and style
interface CategoryTypography {
  fontFamily: string
  fontWeight: number
  letterSpacing: string
  fontStyle: string
  textTransform: 'uppercase' | 'lowercase' | 'capitalize' | 'none'
}

const categoryTypography: Record<string, CategoryTypography> = {
  Business: {
    // "The Architect" — Heavy, geometric, authoritative
    fontFamily: "'Arial Black', Impact, sans-serif",
    fontWeight: 900,
    letterSpacing: '-0.03em',
    fontStyle: 'normal',
    textTransform: 'uppercase',
  },
  Finance: {
    // "The Ledger" — Precise, digital, calculated
    fontFamily: "'Courier New', Courier, monospace",
    fontWeight: 400,
    letterSpacing: '0',
    fontStyle: 'normal',
    textTransform: 'lowercase',
  },
  Health: {
    // "The Breath" — Organic, clean, dramatically wide spacing
    fontFamily: "Arial, Helvetica, sans-serif",
    fontWeight: 200,
    letterSpacing: '0.35em',
    fontStyle: 'normal',
    textTransform: 'uppercase',
  },
  Spiritual: {
    // "The Horizon" — Ethereal, expansive, deep
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontWeight: 400,
    letterSpacing: '0',
    fontStyle: 'italic',
    textTransform: 'capitalize',
  },
  Fun: {
    // "The Spark" — Elegant, cursive, playful
    fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
    fontWeight: 400,
    letterSpacing: '0.02em',
    fontStyle: 'normal',
    textTransform: 'capitalize',
  },
  Social: {
    // "The Connection" — Warm, conversational, overlapping
    fontFamily: "'Georgia', serif",
    fontWeight: 400,
    letterSpacing: '-0.05em',
    fontStyle: 'normal',
    textTransform: 'lowercase',
  },
  Romance: {
    // "The Poetry" — Soft, intimate, classic
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

// ── Card components ──────────────────────────────────────────────────

// LEFT COLUMN: Developing notes — white cards on light background
function DevelopingCard({ note }: { note: SampleNote }) {
  const hasImage = !!note.imageUrl

  return (
    <div style={{
      marginBottom: '1.5rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.opacity = '0.85'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.opacity = '1'
    }}
    >
      {hasImage && (
        <div style={{
          width: '100%',
          height: '150px',
          position: 'relative',
        }}>
          <img
            src={note.imageUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%', display: 'block' }}
          />
        </div>
      )}

      {/* No image → show category in distinctive theme font */}
      {!hasImage && (
        <div style={{
          padding: '1.25rem 1rem 0.25rem',
          fontFamily: getCategoryFont(note.category),
          fontSize: '1.5rem',
          fontWeight: 300,
          color: '#D1CCC4',
          lineHeight: 1,
          letterSpacing: '0.02em',
          textTransform: 'lowercase',
          fontStyle: 'italic',
        }}>
          {note.category}
        </div>
      )}

      <div style={{ padding: '0.85rem 1rem 1rem' }}>
        <div style={{
          fontFamily: "'Playfair Display', 'Times New Roman', serif",
          fontSize: '0.95rem',
          fontWeight: 400,
          color: '#1A1A1A',
          lineHeight: 1.3,
          marginBottom: '0.45rem',
        }}>
          {note.headline}
        </div>

        <div style={{
          fontSize: '0.75rem',
          color: '#5A5650',
          lineHeight: 1.6,
          marginBottom: '0.5rem',
          whiteSpace: 'pre-line',
          display: '-webkit-box',
          WebkitLineClamp: 5,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {note.content}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          {(() => {
            const typo = getCategoryTypography(note.category)
            return hasImage ? (
              <span style={{
                fontFamily: typo.fontFamily,
                color: RED,
                fontWeight: typo.fontWeight,
                fontStyle: typo.fontStyle,
                textTransform: typo.textTransform,
                letterSpacing: typo.letterSpacing,
                fontSize: '0.65rem',
                lineHeight: 1,
              }}>
                {note.category}
              </span>
            ) : null
          })()}
          <span style={{
            fontSize: '0.6rem',
            color: '#9A9590',
            lineHeight: 1,
          }}>{formatDate(note.created_at)}</span>
          {note.mood && <span style={{
            fontSize: '0.6rem',
            color: '#9A9590',
            lineHeight: 1,
          }}>&middot; {note.mood}</span>}
        </div>

        {note.source_headline && (
          <div style={{
            marginTop: '0.45rem',
            paddingTop: '0.4rem',
            borderTop: '1px solid #F0EDE8',
            fontSize: '0.58rem',
            color: '#9A9590',
          }}>
            ↑ From: <span style={{ color: RED, fontWeight: 500 }}>{note.source_headline}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// CENTER COLUMN: Pinned notes — uniform black background, cards dissolve into it
function PinnedCard({ note }: { note: SampleNote }) {
  const hasImage = !!note.imageUrl

  return (
    <div style={{
      marginBottom: '1.75rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.opacity = '0.92'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.opacity = '1'
    }}
    >
      {/* Floating image */}
      {hasImage && (
        <div style={{
          width: '100%',
          height: '180px',
          position: 'relative',
          marginBottom: '0.75rem',
        }}>
          <img
            src={note.imageUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%', display: 'block' }}
          />
          <span style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            background: RED,
            color: '#fff',
            fontSize: '0.5rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06rem',
            padding: '0.2rem 0.5rem',
            borderRadius: 0,
          }}>
            Pinned
          </span>
        </div>
      )}

      {!hasImage && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '0.25rem',
        }}>
          <span style={{
            background: RED,
            color: '#fff',
            fontSize: '0.5rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06rem',
            padding: '0.2rem 0.5rem',
            borderRadius: 0,
          }}>
            Pinned
          </span>
        </div>
      )}

      <div style={{
        fontFamily: "'Playfair Display', 'Times New Roman', serif",
        fontSize: '1.1rem',
        fontWeight: 400,
        color: '#FFFFFF',
        lineHeight: 1.3,
        marginBottom: '0.45rem',
        letterSpacing: '-0.01em',
      }}>
        {note.headline}
      </div>

      <div style={{
        fontSize: '0.8rem',
        color: 'rgba(255,255,255,0.65)',
        lineHeight: 1.6,
        marginBottom: '0.6rem',
      }}>
        {note.content}
      </div>

      {/* Meta row */}
      {(() => {
        const typo = getCategoryTypography(note.category)
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontFamily: typo.fontFamily,
              color: RED,
              fontWeight: typo.fontWeight,
              fontStyle: typo.fontStyle,
              textTransform: typo.textTransform,
              letterSpacing: typo.letterSpacing,
              fontSize: '0.75rem',
              lineHeight: 1,
            }}>
              {note.category}
            </span>
            <span style={{
              fontSize: '0.65rem',
              color: 'rgba(255,255,255,0.4)',
              lineHeight: 1,
            }}>{formatDate(note.created_at)}</span>
            {note.mood && <span style={{
              fontSize: '0.65rem',
              color: 'rgba(255,255,255,0.4)',
              lineHeight: 1,
            }}>&middot; {note.mood}</span>}
          </div>
        )
      })()}

      {note.source_headline && (
        <div style={{
          marginTop: '0.5rem',
          paddingTop: '0.45rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: '0.58rem',
          color: 'rgba(255,255,255,0.4)',
        }}>
          ↑ From: <span style={{ color: '#E8857A', fontWeight: 500 }}>{note.source_headline}</span>
        </div>
      )}
    </div>
  )
}

// RIGHT COLUMN: All notes — compact, grouped by category
function CompactNoteCard({ note }: { note: SampleNote }) {
  const hasImage = !!note.imageUrl

  return (
    <div style={{
      display: 'flex',
      gap: '0.6rem',
      padding: '0.6rem',
      background: '#FFFFFF',
      border: '1px solid #E8E5DF',
      borderRadius: 0,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      marginBottom: '0.4rem',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = '#D1CCC4'
      e.currentTarget.style.background = '#FDFCFA'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = '#E8E5DF'
      e.currentTarget.style.background = '#FFFFFF'
    }}
    >
      {hasImage && (
        <div style={{
          flexShrink: 0,
          width: '56px',
          height: '56px',
          borderRadius: 0,
          overflow: 'hidden',
        }}>
          <img
            src={note.imageUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%', display: 'block' }}
          />
        </div>
      )}

      {/* No image → small decorative theme font as avatar, bg matches card */}
      {!hasImage && (
        <div style={{
          flexShrink: 0,
          width: '56px',
          height: '56px',
          borderRadius: 0,
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: getCategoryFont(note.category),
          fontSize: '1.4rem',
          fontWeight: 300,
          color: '#C4BFB7',
          fontStyle: 'italic',
          lineHeight: 1,
        }}>
          {note.category.charAt(0)}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#1F2937',
          lineHeight: 1.3,
          marginBottom: '0.2rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {note.headline}
        </div>
        <div style={{
          fontSize: '0.68rem',
          color: '#6B7280',
          lineHeight: 1.4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {note.content}
        </div>
        <div style={{
          marginTop: '0.2rem',
          fontSize: '0.55rem',
          color: '#9CA3AF',
        }}>
          {formatDate(note.created_at)}
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────

export default function NotesLayoutDemo() {
  const pinned = SAMPLE_NOTES.filter(n => n.pinned_at)
  const developing = SAMPLE_NOTES.filter(n => !n.pinned_at && n.content.split(/\s+/).length > 40)
  const allNotes = SAMPLE_NOTES.filter(n => !n.pinned_at && n.content.split(/\s+/).length <= 40)
  const groupedAll = groupByCategory(allNotes)
  const groupedDeveloping = groupByCategory(developing)

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>

      {/* ── BLACK HEADER ────────────────────────────────────────── */}
      <header style={{
        background: '#111111',
        padding: '2.5rem 2rem 2rem',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', 'Times New Roman', serif",
            fontSize: 'clamp(2.4rem, 5vw, 3.5rem)',
            fontWeight: 400,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            margin: '0 0 0.3rem',
          }}>
            Notes
          </h1>
          <span style={{
            fontFamily: "'Playfair Display', 'Times New Roman', serif",
            fontSize: 'clamp(1rem, 2vw, 1.3rem)',
            fontWeight: 400,
            color: '#FFFFFF',
            letterSpacing: '-0.01em',
          }}>
            From story to story
          </span>
        </div>
      </header>

      {/* ── 3-COLUMN LAYOUT ─────────────────────────────────────── */}
      {/* Full-width background stripe with red top rules */}
      <div style={{ position: 'relative' }}>
        {/* Background colors extending to viewport edges */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1.4fr 1fr',
          maxWidth: '1200px',
          margin: '0 auto',
          zIndex: 0,
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
          display: 'grid',
          gridTemplateColumns: '1fr 1.4fr 1fr',
          maxWidth: '1200px',
          margin: '0 auto',
          minHeight: 'calc(100vh - 130px)',
          position: 'relative',
          zIndex: 1,
        }}>

          {/* LEFT COLUMN: Developing */}
          <div style={{
            padding: '1.25rem 1.25rem 2rem',
          }}>
            <h2 style={{
              margin: '0 0 0.75rem',
              fontSize: '0.6rem',
              fontWeight: 700,
              color: RED,
              textTransform: 'uppercase',
              letterSpacing: '0.1rem',
              paddingBottom: '0.5rem',
              borderBottom: `1px solid #E5E2DD`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>Developing</span>
              <span style={{
                background: 'rgba(220,20,60,0.08)',
                color: RED,
                fontSize: '0.55rem',
                fontWeight: 700,
                padding: '0.1rem 0.4rem',
                borderRadius: 0,
              }}>
                {developing.length}
              </span>
            </h2>

            {groupedDeveloping.map(group => {
              const typo = getCategoryTypography(group.category)
              return (
              <div key={group.category} style={{ marginBottom: '1rem' }}>
                <div style={{
                  fontFamily: typo.fontFamily,
                  fontSize: '0.65rem',
                  fontWeight: typo.fontWeight,
                  fontStyle: typo.fontStyle,
                  color: RED,
                  textTransform: typo.textTransform,
                  letterSpacing: typo.letterSpacing,
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}>
                  <div style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: 0,
                    background: RED,
                    opacity: 0.4,
                  }} />
                  {group.category}
                </div>
                {group.notes.map(note => (
                  <DevelopingCard key={note.id} note={note} />
                ))}
              </div>
              )
            })}
          </div>

          {/* CENTER COLUMN: Pinned */}
          <div style={{
            padding: '1.25rem 1.5rem 2rem',
          }}>
            <h2 style={{
              margin: '0 0 0.75rem',
              fontSize: '0.6rem',
              fontWeight: 700,
              color: RED,
              textTransform: 'uppercase',
              letterSpacing: '0.1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>Pinned</span>
              <span style={{
                background: 'rgba(220,20,60,0.15)',
                color: RED,
                fontSize: '0.55rem',
                fontWeight: 700,
                padding: '0.1rem 0.4rem',
                borderRadius: 0,
              }}>
                {pinned.length}
              </span>
            </h2>

            {pinned.map(note => (
              <PinnedCard key={note.id} note={note} />
            ))}
          </div>

          {/* RIGHT COLUMN: All Notes */}
          <div style={{
            padding: '1.25rem 1.25rem 2rem',
          }}>
            <h2 style={{
              margin: '0 0 0.75rem',
              fontSize: '0.6rem',
              fontWeight: 700,
              color: RED,
              textTransform: 'uppercase',
              letterSpacing: '0.1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #E0DBD3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>All Notes</span>
              <span style={{
                background: 'rgba(220,20,60,0.08)',
                color: RED,
                fontSize: '0.55rem',
                fontWeight: 700,
                padding: '0.1rem 0.4rem',
                borderRadius: 0,
              }}>
                {allNotes.length}
              </span>
            </h2>

            {groupedAll.map(group => {
              const typo = getCategoryTypography(group.category)
              return (
              <div key={group.category} style={{ marginBottom: '1rem' }}>
                <div style={{
                  fontFamily: typo.fontFamily,
                  fontSize: '0.65rem',
                  fontWeight: typo.fontWeight,
                  fontStyle: typo.fontStyle,
                  color: RED,
                  textTransform: typo.textTransform,
                  letterSpacing: typo.letterSpacing,
                  marginBottom: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}>
                  <div style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: 0,
                    background: RED,
                    opacity: 0.4,
                  }} />
                  {group.category}
                  <span style={{
                    color: '#B5AFA7',
                    fontWeight: 500,
                    marginLeft: 'auto',
                  }}>
                    {group.notes.length}
                  </span>
                </div>
                {group.notes.map(note => (
                  <CompactNoteCard key={note.id} note={note} />
                ))}
              </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Responsive note */}
      <div style={{
        padding: '1rem 2rem',
        background: '#E8E5DF',
        fontSize: '0.72rem',
        color: '#8A8580',
        textAlign: 'center',
        lineHeight: 1.6,
      }}>
        <strong style={{ color: '#6B6560' }}>Desktop 3-column layout:</strong> Developing (warm) | Pinned (dark editorial, red left rule) | All Notes (warm).
        No-image cards show category in distinctive theme fonts. Labels are crimson red throughout.
        <br />Mobile would stack: Pinned &rarr; Developing &rarr; All Notes.
      </div>
    </div>
  )
}
