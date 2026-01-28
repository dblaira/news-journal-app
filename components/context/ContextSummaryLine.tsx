'use client'

import { useState, useRef } from 'react'
import ContextChip from './ContextChip'
import { ContextCategoryKey, getCategoryEmoji } from './constants'

export interface ContextItem {
  category: ContextCategoryKey
  value: string
}

interface ContextSummaryLineProps {
  items: ContextItem[]
  location?: string
  onReorder?: (items: ContextItem[]) => void
  onRemove?: (index: number) => void
  onClick?: () => void
  expanded?: boolean
  editable?: boolean
}

export default function ContextSummaryLine({
  items,
  location,
  onReorder,
  onRemove,
  onClick,
  expanded = false,
  editable = true,
}: ContextSummaryLineProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Build display items from context items
  const displayItems = items.map((item) => ({
    ...item,
    emoji: getCategoryEmoji(item.category),
    displayValue: Array.isArray(item.value) ? item.value.join(', ') : item.value,
  }))

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    // Add drag styling
    const target = e.target as HTMLElement
    target.style.opacity = '0.5'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDragIndex(null)
    setDragOverIndex(null)
    const target = e.target as HTMLElement
    target.style.opacity = '1'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== dropIndex && onReorder) {
      const newItems = [...items]
      const [draggedItem] = newItems.splice(dragIndex, 1)
      newItems.splice(dropIndex, 0, draggedItem)
      onReorder(newItems)
    }
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const hasContent = displayItems.length > 0 || location

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, rgba(39, 39, 42, 0.95) 0%, rgba(24, 24, 27, 0.98) 100%)',
        borderRadius: '12px',
        padding: '0.875rem 1rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'rgba(220, 20, 60, 0.3)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Summary content */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.5rem',
          minHeight: '1.5rem',
        }}
      >
        {/* Location (always first if present) */}
        {location && (
          <>
            <ContextChip
              emoji="📍"
              label={location}
              variant="summary"
              size="sm"
            />
            {displayItems.length > 0 && (
              <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.8rem' }}>•</span>
            )}
          </>
        )}

        {/* Context items */}
        {displayItems.map((item, index) => (
          <div
            key={`${item.category}-${index}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <ContextChip
              emoji={item.emoji}
              label={item.displayValue}
              variant="summary"
              size="sm"
              draggable={editable && onReorder !== undefined}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onRemove={editable && onRemove ? () => onRemove(index) : undefined}
            />
            {index < displayItems.length - 1 && (
              <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.8rem' }}>•</span>
            )}
          </div>
        ))}

        {/* Empty state */}
        {!hasContent && (
          <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.85rem', fontStyle: 'italic' }}>
            Tap to add context...
          </span>
        )}
      </div>

      {/* Expand indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.5rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <span
          style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: 500,
          }}
        >
          Context
        </span>
        <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>
    </div>
  )
}
