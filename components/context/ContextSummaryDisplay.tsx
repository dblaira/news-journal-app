'use client'

import { EntryMetadata } from '@/types/metadata'
import { getCategoryEmoji, ContextCategoryKey } from './constants'

interface ContextSummaryDisplayProps {
  metadata?: EntryMetadata
  variant?: 'card' | 'inline' | 'full'
  showLocation?: boolean
  maxItems?: number
}

/**
 * Read-only context summary display for entry cards and feeds.
 * Shows emoji-prefixed context chips in a compact, glanceable format.
 */
export default function ContextSummaryDisplay({
  metadata,
  variant = 'inline',
  showLocation = true,
  maxItems = 4,
}: ContextSummaryDisplayProps) {
  if (!metadata) return null

  const enrichment = metadata.enrichment
  const location = metadata.location?.display_name || metadata.location?.raw_name

  // Build context items
  const items: { emoji: string; value: string }[] = []

  // Location
  if (showLocation && location) {
    items.push({ emoji: getCategoryEmoji('location'), value: location })
  }

  // Environment
  if (enrichment?.environment) {
    items.push({ emoji: getCategoryEmoji('environment'), value: enrichment.environment })
  }

  // Activity
  if (enrichment?.activity) {
    items.push({ emoji: getCategoryEmoji('activity'), value: enrichment.activity })
  }

  // Energy
  if (enrichment?.energy) {
    items.push({ emoji: getCategoryEmoji('energy'), value: enrichment.energy })
  }

  // Mood (show first mood if multiple)
  if (enrichment?.mood && enrichment.mood.length > 0) {
    const moodDisplay = enrichment.mood.length > 1
      ? `${enrichment.mood[0]} +${enrichment.mood.length - 1}`
      : enrichment.mood[0]
    items.push({ emoji: getCategoryEmoji('mood'), value: moodDisplay })
  }

  // Limit items
  const displayItems = items.slice(0, maxItems)
  const hasMore = items.length > maxItems

  if (displayItems.length === 0) return null

  // Styles based on variant
  const getContainerStyle = (): React.CSSProperties => {
    switch (variant) {
      case 'card':
        return {
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginTop: '0.5rem',
          padding: '0.5rem',
          background: 'var(--bg-panel-alt, rgba(39, 39, 42, 0.5))',
          borderRadius: '6px',
        }
      case 'full':
        return {
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          background: 'linear-gradient(135deg, rgba(39, 39, 42, 0.95) 0%, rgba(24, 24, 27, 0.98) 100%)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }
      case 'inline':
      default:
        return {
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted, #6B7280)',
        }
    }
  }

  const getChipStyle = (): React.CSSProperties => {
    switch (variant) {
      case 'card':
      case 'full':
        return {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem 0.5rem',
          background: 'rgba(220, 20, 60, 0.1)',
          border: '1px solid rgba(220, 20, 60, 0.2)',
          borderRadius: '12px',
          fontSize: '0.7rem',
          color: '#DC143C',
          whiteSpace: 'nowrap',
        }
      case 'inline':
      default:
        return {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.2rem',
          whiteSpace: 'nowrap',
        }
    }
  }

  const separatorStyle: React.CSSProperties = {
    color: variant === 'inline' ? 'var(--text-muted, #6B7280)' : 'rgba(255, 255, 255, 0.3)',
    fontSize: variant === 'inline' ? '0.6rem' : '0.75rem',
  }

  return (
    <div style={getContainerStyle()}>
      {displayItems.map((item, index) => (
        <span key={index} style={{ display: 'contents' }}>
          <span style={getChipStyle()}>
            <span>{item.emoji}</span>
            <span>{item.value}</span>
          </span>
          {variant === 'inline' && index < displayItems.length - 1 && (
            <span style={separatorStyle}>•</span>
          )}
        </span>
      ))}
      {hasMore && (
        <span style={{ ...getChipStyle(), opacity: 0.7 }}>
          +{items.length - maxItems} more
        </span>
      )}
    </div>
  )
}
