'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ContextCategoryKey, getCategoryEmoji } from './constants'

export interface ContextItem {
  category: ContextCategoryKey
  value: string
}

interface SortableChipProps {
  id: string
  emoji: string
  displayValue: string
  editable: boolean
  onRemove?: () => void
}

function SortableChip({ id, emoji, displayValue, editable, onRemove }: SortableChipProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    cursor: editable ? 'grab' : 'default',
    padding: '0.25rem 0.6rem',
    borderRadius: '6px',
    background: isDragging ? 'rgba(220, 20, 60, 0.15)' : 'rgba(0, 0, 0, 0.03)',
    border: isDragging ? '2px solid #DC143C' : '2px solid transparent',
    boxShadow: isDragging ? '0 4px 12px rgba(220, 20, 60, 0.25)' : 'none',
    userSelect: 'none' as const,
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 100 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <span>{emoji}</span>
      <span>{displayValue}</span>
      {editable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          onPointerDown={(e) => e.stopPropagation()}
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
    </div>
  )
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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Build display items with unique IDs
  const displayItems = items.map((item, index) => ({
    ...item,
    id: `${item.category}-${index}`,
    emoji: getCategoryEmoji(item.category),
    displayValue: Array.isArray(item.value) ? item.value.join(', ') : item.value,
  }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    console.log('🎯 dnd-kit drag end:', { activeId: active.id, overId: over?.id })
    
    if (over && active.id !== over.id && onReorder) {
      const oldIndex = displayItems.findIndex((item) => item.id === active.id)
      const newIndex = displayItems.findIndex((item) => item.id === over.id)
      
      console.log('🎯 Reordering:', { oldIndex, newIndex })
      
      const newItems = arrayMove(items, oldIndex, newIndex)
      onReorder(newItems)
    }
  }

  const hasContent = displayItems.length > 0 || location

  return (
    <div
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
            
            {/* Draggable context items with dnd-kit */}
            {editable && onReorder ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={displayItems.map(item => item.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                    {displayItems.map((item, index) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center' }}>
                        <SortableChip
                          id={item.id}
                          emoji={item.emoji}
                          displayValue={item.displayValue}
                          editable={editable}
                          onRemove={onRemove ? () => onRemove(index) : undefined}
                        />
                        {index < displayItems.length - 1 && (
                          <span style={{ color: '#999', marginLeft: '0.5rem' }}>•</span>
                        )}
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              // Non-editable view
              displayItems.map((item, index) => (
                <span key={item.id} style={{ whiteSpace: 'nowrap' }}>
                  {item.emoji} {item.displayValue}
                  {index < displayItems.length - 1 && (
                    <span style={{ color: '#999', margin: '0 0.5rem' }}>•</span>
                  )}
                </span>
              ))
            )}
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
          {editable && onReorder ? 'drag to reorder' : editable ? 'tap to edit' : ''}
        </span>
      </div>
    </div>
  )
}
