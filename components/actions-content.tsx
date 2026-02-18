'use client'

import { useState } from 'react'
import { Entry } from '@/types'
import { formatEntryDateShort, truncate } from '@/lib/utils'
import { getEntryPosterWithFocalPoint } from '@/lib/utils/entry-images'
import { StoryCarousel } from './story-carousel'

interface ActionsContentProps {
  entries: Entry[]
  lifeArea: string
  onViewEntry: (id: string) => void
  onToggleComplete: (id: string) => void
}

// Get today's date formatted nicely
function getTodayFormatted(): string {
  const today = new Date()
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  }
  return today.toLocaleDateString('en-US', options)
}

// Get a reflective tagline based on time of day and action counts
function getReflectiveTagline(todayCount: number, overdueCount: number): string {
  const hour = new Date().getHours()
  
  if (overdueCount > 0 && todayCount === 0) {
    return "Clear the past to make room for what's next"
  }
  if (todayCount === 0 && overdueCount === 0) {
    return "A clear slate. What matters most?"
  }
  if (todayCount === 1) {
    return "One intention. Full attention."
  }
  if (todayCount <= 3) {
    return "Focus on what moves the needle"
  }
  if (hour < 12) {
    return "Morning clarity. Evening satisfaction."
  }
  if (hour < 17) {
    return "The afternoon belongs to momentum"
  }
  return "End the day with intention"
}

interface GroupedActions {
  pinned: Entry[]
  overdue: Entry[]
  today: Entry[]
  recentlyCompleted: Entry[]
  upcoming: Entry[]
}

function groupActions(entries: Entry[], lifeArea: string): GroupedActions {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Filter by life area if not "all"
  let filtered = entries.filter(e => e.entry_type === 'action')
  if (lifeArea !== 'all') {
    filtered = filtered.filter(e => e.category.toLowerCase() === lifeArea.toLowerCase())
  }

  const pinned: Entry[] = []
  const overdue: Entry[] = []
  const todayItems: Entry[] = []
  const recentlyCompleted: Entry[] = []
  const upcoming: Entry[] = []

  filtered.forEach(entry => {
    // COMPLETED entries go to Recently Completed (check FIRST, before pinned)
    // This ensures completed actions move out of Pinned/Overdue/Today/Upcoming
    if (entry.completed_at) {
      const completedDate = new Date(entry.completed_at)
      if (completedDate >= sevenDaysAgo) {
        recentlyCompleted.push(entry)
      }
      // Completed entries older than 7 days are not shown
      return
    }

    // Pinned entries (only if NOT completed)
    if (entry.pinned_at) {
      pinned.push(entry)
      return
    }

    // Active entries - categorize by due date
    if (entry.due_date) {
      const dueDate = new Date(entry.due_date)
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

      if (dueDateOnly < today) {
        overdue.push(entry)
      } else if (dueDateOnly.getTime() === today.getTime()) {
        todayItems.push(entry)
      } else {
        upcoming.push(entry)
      }
    } else {
      // No due date - treat as upcoming/inbox
      upcoming.push(entry)
    }
  })

  // Sort each group
  overdue.sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
  todayItems.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  recentlyCompleted.sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
  upcoming.sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  return { pinned, overdue, today: todayItems, recentlyCompleted, upcoming }
}

function ActionItem({ 
  entry, 
  onViewEntry,
  onToggleComplete,
  onImageError,
}: { 
  entry: Entry
  onViewEntry: (id: string) => void
  onToggleComplete: (id: string) => void
  onImageError?: (id: string) => void
}) {
  const [isToggling, setIsToggling] = useState(false)
  const isCompleted = !!entry.completed_at
  const isOverdue = entry.due_date && new Date(entry.due_date) < new Date() && !isCompleted
  const { url: imageUrl, objectPosition } = getEntryPosterWithFocalPoint(entry)

  // Extract plain text from HTML content for preview
  const plainText = entry.content.replace(/<[^>]*>/g, '').trim()
  const preview = truncate(plainText, 80)

  const handleCheckboxClick = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (isToggling) return
    setIsToggling(true)
    try {
      await onToggleComplete(entry.id)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div
      onClick={() => onViewEntry(entry.id)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        marginBottom: '0.75rem',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#DC143C'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#E5E7EB'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Full-width header image */}
      {imageUrl && (
        <div style={{
          width: '100%',
          height: '160px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <img
            src={imageUrl}
            alt=""
            onError={() => onImageError?.(entry.id)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition,
              display: 'block',
              opacity: isCompleted ? 0.5 : 1,
            }}
          />
          {entry.pinned_at && (
            <span style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              fontSize: '0.85rem',
            }}>📌</span>
          )}
        </div>
      )}

      <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <button
          onClick={handleCheckboxClick}
          disabled={isToggling}
          aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          style={{
            flexShrink: 0,
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            border: isCompleted ? 'none' : `2px solid ${isOverdue ? '#DC143C' : '#D1D5DB'}`,
            background: isCompleted ? '#10B981' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isToggling ? 'wait' : 'pointer',
            opacity: isToggling ? 0.6 : 1,
            transition: 'all 0.15s ease',
            padding: 0,
          }}
        >
          {isCompleted && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: isCompleted ? '#9CA3AF' : '#1F2937',
              textDecoration: isCompleted ? 'line-through' : 'none',
              marginBottom: '0.25rem',
              lineHeight: 1.4,
            }}
          >
            {entry.headline}
          </div>

          {preview && (
            <div
              style={{
                fontSize: '0.8rem',
                color: '#6B7280',
                lineHeight: 1.4,
                marginBottom: '0.5rem',
              }}
            >
              {preview}
            </div>
          )}

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
                background: '#F3F4F6',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.03rem',
              }}
            >
              {entry.category}
            </span>

            {entry.due_date && !isCompleted && (
              <span style={{ color: isOverdue ? '#DC143C' : '#6B7280', fontWeight: isOverdue ? 600 : 400 }}>
                {isOverdue ? 'Overdue: ' : 'Due: '}
                {formatEntryDateShort(entry.due_date)}
              </span>
            )}

            {entry.completed_at && (
              <span style={{ color: '#10B981' }}>
                Completed {formatEntryDateShort(entry.completed_at)}
              </span>
            )}
          </div>
        </div>

        {/* Pin indicator (only when no image -- image cards show pin on the image) */}
        {entry.pinned_at && !imageUrl && (
          <span style={{ color: '#DC143C', fontSize: '0.9rem' }}>📌</span>
        )}
      </div>
    </div>
  )
}

function ActionSection({ 
  title, 
  entries, 
  onViewEntry,
  onToggleComplete,
  onImageError,
  variant = 'default',
  collapsible = false,
  defaultCollapsed = false,
}: { 
  title: string
  entries: Entry[]
  onViewEntry: (id: string) => void
  onToggleComplete: (id: string) => void
  onImageError?: (id: string) => void
  variant?: 'default' | 'overdue' | 'completed' | 'today'
  collapsible?: boolean
  defaultCollapsed?: boolean
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  if (entries.length === 0) return null

  const titleColors: Record<string, string> = {
    default: '#6B7280',
    overdue: '#DC143C',
    completed: '#9CA3AF',
    today: '#1F2937',
  }

  const badgeStyles: Record<string, { bg: string; color: string }> = {
    default: { bg: '#F3F4F6', color: '#6B7280' },
    overdue: { bg: '#FEE2E2', color: '#DC143C' },
    completed: { bg: '#F3F4F6', color: '#9CA3AF' },
    today: { bg: '#DCFCE7', color: '#16A34A' },
  }

  const badge = badgeStyles[variant] || badgeStyles.default

  return (
    <section style={{ marginBottom: '1.75rem' }}>
      <button
        onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'transparent',
          border: 'none',
          padding: '0',
          marginBottom: '0.75rem',
          cursor: collapsible ? 'pointer' : 'default',
        }}
      >
        {collapsible && (
          <span style={{ color: '#9CA3AF', fontSize: '0.7rem', transition: 'transform 0.15s' }}>
            {isCollapsed ? '▸' : '▾'}
          </span>
        )}
        <h3
          style={{
            margin: 0,
            fontSize: '0.7rem',
            fontWeight: 600,
            color: titleColors[variant],
            textTransform: 'uppercase',
            letterSpacing: '0.1rem',
          }}
        >
          {title}
        </h3>
        <span
          style={{
            background: badge.bg,
            color: badge.color,
            fontSize: '0.65rem',
            fontWeight: 600,
            padding: '0.125rem 0.4rem',
            borderRadius: '10px',
          }}
        >
          {entries.length}
        </span>
      </button>

      {!isCollapsed && (
        <div>
          {entries.map(entry => (
            <ActionItem 
              key={entry.id} 
              entry={entry} 
              onViewEntry={onViewEntry}
              onToggleComplete={onToggleComplete}
              onImageError={onImageError}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export function ActionsContent({ entries, lifeArea, onViewEntry, onToggleComplete }: ActionsContentProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const handleImageError = (id: string) => setImageErrors(prev => new Set(prev).add(id))

  const grouped = groupActions(entries, lifeArea)
  const hasAnyActions = 
    grouped.pinned.length > 0 || 
    grouped.overdue.length > 0 || 
    grouped.today.length > 0 || 
    grouped.upcoming.length > 0 ||
    grouped.recentlyCompleted.length > 0

  const tagline = getReflectiveTagline(grouped.today.length, grouped.overdue.length)
  const todayFormatted = getTodayFormatted()

  // Find the first action with an image for the hero
  const allActions = [...grouped.pinned, ...grouped.today, ...grouped.overdue, ...grouped.upcoming]
  const heroAction = allActions.find(e => {
    const { url } = getEntryPosterWithFocalPoint(e)
    return !!url && !imageErrors.has(e.id)
  })
  const heroImage = heroAction ? getEntryPosterWithFocalPoint(heroAction) : null
  const hasHeroImage = !!heroImage?.url

  const HeroHeader = () => (
    <section style={{ width: '100%' }}>
      {/* Beige branding area */}
      <div style={{
        background: '#E8E2D8',
        width: '100%',
        padding: '3rem 3rem 2.5rem',
      }}>
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
            {todayFormatted}
          </span>
        </div>

        <h1 style={{
          fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
          fontSize: 'clamp(2.8rem, 5.5vw, 4rem)',
          fontWeight: 400,
          color: '#DC143C',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          margin: '0 0 0.75rem 0',
        }}>
          Today
        </h1>

        <p style={{
          fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
          fontSize: '1.3rem',
          fontStyle: 'italic',
          color: '#6B7280',
          margin: 0,
          lineHeight: 1.4,
        }}>
          {tagline}
        </p>
      </div>

      {/* Black image area (split layout when hero image available) */}
      {hasHeroImage && heroAction && (
        <div style={{
          background: '#000000',
          width: '100%',
          borderTop: '3px solid #DC143C',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          minHeight: '320px',
        }}>
          <div style={{
            padding: '2.5rem 3rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            <span style={{
              color: '#DC143C',
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.1rem',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}>
              {heroAction.category}
            </span>
            <h2 style={{
              fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
              fontWeight: 400,
              color: '#FFFFFF',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              margin: 0,
            }}>
              {heroAction.headline}
            </h2>
            {heroAction.due_date && (
              <span style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.75rem',
                marginTop: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05rem',
              }}>
                Due {formatEntryDateShort(heroAction.due_date)}
              </span>
            )}
          </div>
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            minHeight: '320px',
          }}>
            <img
              src={heroImage.url}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: heroImage.objectPosition,
                display: 'block',
                filter: 'saturate(1.1)',
              }}
              onError={() => handleImageError(heroAction.id)}
            />
          </div>
        </div>
      )}
    </section>
  )

  if (!hasAnyActions) {
    return (
      <div style={{ background: '#FFFFFF' }}>
        <HeroHeader />
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
          <div 
            style={{ 
              fontSize: '2.5rem', 
              marginBottom: '1rem', 
              opacity: 0.4,
            }}
          >
            ✧
          </div>
          <h3 
            style={{ 
              margin: '0 0 0.5rem', 
              fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
              color: '#1F2937', 
              fontSize: '1.4rem', 
              fontWeight: 400,
            }}
          >
            Nothing on the horizon
          </h3>
          <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>
            Use Compose to set an intention for today.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#FFFFFF' }}>
      <HeroHeader />

      {/* Carousel for quick-swipe on mobile */}
      {allActions.length > 0 && (
        <StoryCarousel
          entries={allActions}
          title="ACTIONS"
          onViewEntry={onViewEntry}
        />
      )}
      
      <div style={{ padding: '2.5rem 3rem' }}>
      <ActionSection
        title="Pinned"
        entries={grouped.pinned}
        onViewEntry={onViewEntry}
        onToggleComplete={onToggleComplete}
        onImageError={handleImageError}
      />
      
      <ActionSection
        title="Overdue"
        entries={grouped.overdue}
        onViewEntry={onViewEntry}
        onToggleComplete={onToggleComplete}
        onImageError={handleImageError}
        variant="overdue"
      />
      
      <ActionSection
        title="Due Today"
        entries={grouped.today}
        onViewEntry={onViewEntry}
        onToggleComplete={onToggleComplete}
        onImageError={handleImageError}
        variant="today"
      />
      
      <ActionSection
        title="Upcoming"
        entries={grouped.upcoming}
        onViewEntry={onViewEntry}
        onToggleComplete={onToggleComplete}
        onImageError={handleImageError}
      />
      
      <ActionSection
        title="Recently Completed"
        entries={grouped.recentlyCompleted}
        onViewEntry={onViewEntry}
        onToggleComplete={onToggleComplete}
        onImageError={handleImageError}
        variant="completed"
        collapsible
        defaultCollapsed
      />
      </div>
    </div>
  )
}
