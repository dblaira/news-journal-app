'use client'

import { useState, useRef } from 'react'
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
    e.stopPropagation() // Prevent onClick from firing
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString()) // Required for Firefox
    const target = e.target as HTMLElement
    target.style.opacity = '0.5'
    target.style.transform = 'scale(1.05)'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDragIndex(null)
    setDragOverIndex(null)
    const target = e.target as HTMLElement
    target.style.opacity = '1'
    target.style.transform = 'scale(1)'
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

  // Build the summary text for display
  const summaryParts: string[] = []
  if (location) {
    summaryParts.push(`📍 ${location}`)
  }
  displayItems.forEach((item) => {
    summaryParts.push(`${item.emoji} ${item.displayValue}`)
  })

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      style={{
        background: '#F5F0E8',
        borderRadius: expanded ? '8px 8px 0 0' : '8px',
        padding: '1rem 1.25rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        borderLeft: '3px solid #DC143C',
        boxShadow: expanded ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Hero Summary Line */}
      <div
        style={{
          fontSize: '1.1rem',
          fontWeight: 500,
          color: '#1A1A1A',
          lineHeight: 1.5,
          minHeight: '1.75rem',
        }}
      >
        {hasContent ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
            {/* Location (always first, not draggable) */}
            {location && (
              <>
                <span style={{ whiteSpace: 'nowrap' }}>📍 {location}</span>
                {displayItems.length > 0 && (
                  <span style={{ color: '#999', margin: '0 0.25rem' }}>•</span>
                )}
              </>
            )}
            
            {/* Draggable context items */}
            {displayItems.map((item, index) => (
              <span
                key={`${item.category}-${index}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: editable && onReorder ? 'grab' : 'default',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  transition: 'all 0.15s ease',
                  background: dragIndex === index 
                    ? 'rgba(220, 20, 60, 0.15)' 
                    : dragOverIndex === index 
                      ? 'rgba(220, 20, 60, 0.08)'
                      : 'rgba(0, 0, 0, 0.03)',
                  border: dragOverIndex === index 
                    ? '2px dashed #DC143C' 
                    : '2px solid transparent',
                  boxShadow: dragIndex === index ? '0 2px 8px rgba(220, 20, 60, 0.2)' : 'none',
                }}
                draggable={editable && onReorder !== undefined}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onMouseEnter={(e) => {
                  if (editable && onReorder && dragIndex === null) {
                    e.currentTarget.style.background = 'rgba(220, 20, 60, 0.06)'
                    e.currentTarget.style.cursor = 'grab'
                  }
                }}
                onMouseLeave={(e) => {
                  if (dragIndex !== index && dragOverIndex !== index) {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)'
                  }
                }}
                title={editable && onReorder ? 'Drag to reorder' : undefined}
              >
                <span>{item.emoji}</span>
                <span>{item.displayValue}</span>
                {editable && onRemove && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(index)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#999',
                      cursor: 'pointer',
                      padding: '0 0.2rem',
                      fontSize: '1rem',
                      lineHeight: 1,
                      marginLeft: '0.1rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#DC143C'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#999'
                    }}
                  >
                    ×
                  </button>
                )}
                {index < displayItems.length - 1 && (
                  <span style={{ color: '#999', marginLeft: '0.5rem' }}>•</span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: '#666', fontStyle: 'italic', fontSize: '1rem' }}>
            Ground yourself — add context to this moment...
          </span>
        )}
      </div>

      {/* Expand/collapse indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.75rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <span
          style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1rem',
            color: '#DC143C',
            fontWeight: 700,
          }}
        >
          {expanded ? '▼ Context' : '▶ Context'}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#999', fontStyle: 'italic' }}>
          {editable && onReorder ? 'drag items to reorder' : editable ? 'tap to edit' : ''}
        </span>
      </div>
    </div>
  )
}
