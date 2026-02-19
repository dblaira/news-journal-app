'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Entry, ConnectionType } from '@/types'
import { stripHtml } from '@/lib/utils'
import { getEntryPosterWithFocalPoint } from '@/lib/utils/entry-images'

interface ConnectionGridLayoutProps {
  connections: Entry[]
  onViewEntry: (id: string) => void
  entryLookup: Map<string, Entry>
  userId?: string
}

const CONNECTION_TYPE_META: Record<ConnectionType, { label: string; color: string }> = {
  identity_anchor: { label: 'Identity Anchor', color: '#7C3AED' },
  pattern_interrupt: { label: 'Pattern Interrupt', color: '#D97706' },
  validated_principle: { label: 'Validated Principle', color: '#059669' },
  process_anchor: { label: 'Process Anchor', color: '#2563EB' },
}

const filterTypes: (ConnectionType | 'all')[] = [
  'all',
  'identity_anchor',
  'pattern_interrupt',
  'validated_principle',
  'process_anchor',
]

function getStorageKey(userId: string): string {
  return `connection-order-${userId}`
}

function readStoredOrder(userId: string): string[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function writeStoredOrder(userId: string, ids: string[]): void {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(ids))
  } catch {
    // localStorage full or unavailable
  }
}

function applyStoredOrder(connections: Entry[], storedIds: string[]): Entry[] {
  if (storedIds.length === 0) return connections

  const idSet = new Set(storedIds)
  const ordered: Entry[] = []
  const byId = new Map(connections.map(c => [c.id, c]))

  // First: entries in stored order
  for (const id of storedIds) {
    const entry = byId.get(id)
    if (entry) ordered.push(entry)
  }

  // Then: new entries not yet in stored order (appear at top)
  const newEntries = connections.filter(c => !idSet.has(c.id))
  return [...newEntries, ...ordered]
}

// ─── Sortable Card ─────────────────────────────────────────────────

interface SortableConnectionCardProps {
  conn: Entry
  onViewEntry: (id: string) => void
  entryLookup: Map<string, Entry>
  imageErrors: Set<string>
  onImageError: (id: string) => void
}

function SortableConnectionCard({ conn, onViewEntry, entryLookup, imageErrors, onImageError }: SortableConnectionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: conn.id })

  const plainContent = stripHtml(conn.content).trim()
  const displayText = plainContent.length > 160 ? plainContent.slice(0, 160) + '...' : plainContent
  const meta = conn.connection_type ? CONNECTION_TYPE_META[conn.connection_type] : null

  const sourceEntry = conn.source_entry_id ? entryLookup.get(conn.source_entry_id) : undefined
  const { url: imgUrl, objectPosition } = sourceEntry ? getEntryPosterWithFocalPoint(sourceEntry) : { url: undefined, objectPosition: '50% 50%' }
  const hasImage = !!imgUrl && !imageErrors.has(conn.id)

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.92 : 1,
    zIndex: isDragging ? 50 : 'auto',
    touchAction: 'manipulation',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <button
        onClick={() => onViewEntry(conn.id)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          background: '#FFFFFF',
          border: isDragging ? '2px solid #DC143C' : '1px solid #f0f0f0',
          borderRadius: '8px',
          textAlign: 'left',
          cursor: isDragging ? 'grabbing' : 'pointer',
          transition: isDragging ? 'none' : 'all 0.15s ease',
          overflow: 'hidden',
          boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.15)' : 'none',
          transform: isDragging ? 'scale(1.02)' : 'none',
        }}
        onMouseEnter={e => {
          if (!isDragging) {
            e.currentTarget.style.borderColor = '#DC143C'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 20, 60, 0.08)'
          }
        }}
        onMouseLeave={e => {
          if (!isDragging) {
            e.currentTarget.style.borderColor = '#f0f0f0'
            e.currentTarget.style.boxShadow = 'none'
          }
        }}
      >
        {hasImage && (
          <div style={{ width: '100%', height: '140px', overflow: 'hidden' }}>
            <img
              src={imgUrl}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition,
                display: 'block',
              }}
              onError={() => onImageError(conn.id)}
            />
          </div>
        )}

        <div style={{
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexGrow: 1,
          minHeight: '100px',
        }}>
          <div style={{
            fontSize: '1.05rem',
            fontWeight: 500,
            color: '#1a1a1a',
            lineHeight: 1.55,
            fontFamily: "Georgia, 'Times New Roman', serif",
            flexGrow: 1,
          }}>
            &ldquo;{displayText}&rdquo;
          </div>

          {meta && (
            <div style={{
              marginTop: '0.75rem',
              fontSize: '0.78rem',
              color: meta.color,
              fontWeight: 600,
            }}>
              {meta.label}
            </div>
          )}
        </div>
      </button>
    </div>
  )
}

// ─── Grid Layout ───────────────────────────────────────────────────

export function ConnectionGridLayout({ connections, onViewEntry, entryLookup, userId }: ConnectionGridLayoutProps) {
  const [typeFilter, setTypeFilter] = useState<ConnectionType | 'all'>('all')
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [orderedConnections, setOrderedConnections] = useState<Entry[]>(connections)

  const handleImageError = (id: string) => {
    setImageErrors(prev => new Set(prev).add(id))
  }

  // Restore order from localStorage on mount or when connections change
  useEffect(() => {
    if (userId) {
      const storedOrder = readStoredOrder(userId)
      setOrderedConnections(applyStoredOrder(connections, storedOrder))
    } else {
      setOrderedConnections(connections)
    }
  }, [connections, userId])

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  })
  const sensors = useSensors(pointerSensor, touchSensor)

  const filtered = typeFilter === 'all'
    ? orderedConnections
    : orderedConnections.filter(c => c.connection_type === typeFilter)

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = filtered.findIndex(c => c.id === active.id)
    const newIndex = filtered.findIndex(c => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reorderedFiltered = arrayMove(filtered, oldIndex, newIndex)

    if (typeFilter === 'all') {
      setOrderedConnections(reorderedFiltered)
      if (userId) writeStoredOrder(userId, reorderedFiltered.map(c => c.id))
    } else {
      // Reorder within filtered subset, preserving positions of other items
      const filteredIds = new Set(filtered.map(c => c.id))
      const result: Entry[] = []
      let filteredIdx = 0

      for (const conn of orderedConnections) {
        if (filteredIds.has(conn.id)) {
          result.push(reorderedFiltered[filteredIdx++])
        } else {
          result.push(conn)
        }
      }

      setOrderedConnections(result)
      if (userId) writeStoredOrder(userId, result.map(c => c.id))
    }
  }, [filtered, orderedConnections, typeFilter, userId])

  return (
    <div style={{ background: '#FFFFFF', padding: '2.5rem 0' }}>
      <div className="px-4 md:px-6 mx-auto">
        <div style={{
          borderTop: '1px solid #e5e7eb',
          borderBottom: '1px solid #e5e7eb',
          padding: '0.75rem 0',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <h2
            style={{
              fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#1a1a1a',
              margin: 0,
            }}
          >
            All Connections
          </h2>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {filterTypes.map(type => {
              const isActive = typeFilter === type
              const label = type === 'all' ? 'All' : CONNECTION_TYPE_META[type].label
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  style={{
                    padding: '0.3rem 0.7rem',
                    borderRadius: '16px',
                    border: isActive ? '1px solid #DC143C' : '1px solid #d1d5db',
                    background: isActive ? '#DC143C' : 'transparent',
                    color: isActive ? '#fff' : '#4B5563',
                    fontSize: '0.72rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: '#9CA3AF',
          }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>
              No connections of this type yet
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filtered.map(c => c.id)}
              strategy={rectSortingStrategy}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem',
              }}>
                {filtered.map(conn => (
                  <SortableConnectionCard
                    key={conn.id}
                    conn={conn}
                    onViewEntry={onViewEntry}
                    entryLookup={entryLookup}
                    imageErrors={imageErrors}
                    onImageError={handleImageError}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}
