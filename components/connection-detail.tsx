'use client'

import { useState, useCallback } from 'react'
import { Entry, ConnectionType, SurfaceConditions } from '@/types'
import { stripHtml, formatEntryDateLong } from '@/lib/utils'
import { updateEntryDetails } from '@/app/actions/entries'

interface ConnectionDetailProps {
  entry: Entry
  onClose: () => void
  onDeleteEntry: (id: string) => void
  onEntryUpdated?: (entryId: string, updates: Partial<Entry>) => void
  onViewEntry?: (entryId: string) => void
  sourceEntry?: Entry | null
}

const CONNECTION_TYPES: { value: ConnectionType; label: string; icon: string }[] = [
  { value: 'identity_anchor', label: 'Identity Anchor', icon: '🪞' },
  { value: 'pattern_interrupt', label: 'Pattern Interrupt', icon: '⚡' },
  { value: 'validated_principle', label: 'Validated Principle', icon: '🔑' },
  { value: 'process_anchor', label: 'Process Anchor', icon: '🔄' },
]

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TIMES_OF_DAY: ('morning' | 'afternoon' | 'evening')[] = ['morning', 'afternoon', 'evening']
const ENERGY_LEVELS: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high']

export function ConnectionDetail({
  entry,
  onClose,
  onDeleteEntry,
  onEntryUpdated,
  onViewEntry,
  sourceEntry,
}: ConnectionDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(stripHtml(entry.content))
  const [connectionType, setConnectionType] = useState<ConnectionType | null>(entry.connection_type ?? null)
  const [conditions, setConditions] = useState<SurfaceConditions>(entry.surface_conditions ?? {})
  const [isSaving, setIsSaving] = useState(false)
  const [showConditions, setShowConditions] = useState(false)

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const updates: Partial<Entry> = {
        content: editedContent,
        connection_type: connectionType,
        surface_conditions: Object.keys(conditions).length > 0 ? conditions : null,
      }
      await updateEntryDetails(entry.id, updates)
      onEntryUpdated?.(entry.id, updates)
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to save connection:', err)
    } finally {
      setIsSaving(false)
    }
  }, [editedContent, connectionType, conditions, entry.id, onEntryUpdated])

  const handleDelete = () => {
    if (confirm('Delete this connection?')) {
      onDeleteEntry(entry.id)
      onClose()
    }
  }

  const toggleDay = (day: number) => {
    const current = conditions.days_of_week ?? []
    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day]
    setConditions({ ...conditions, days_of_week: updated.length > 0 ? updated : undefined })
  }

  const plainContent = stripHtml(entry.content)
  const typeMeta = connectionType ? CONNECTION_TYPES.find(t => t.value === connectionType) : null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
      padding: '1rem',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '85vh',
        overflowY: 'auto',
        padding: '2rem',
        position: 'relative',
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
            color: '#9CA3AF',
            padding: '0.25rem',
          }}
        >
          &times;
        </button>

        {/* Connection text */}
        <div style={{ marginBottom: '1.5rem' }}>
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={e => setEditedContent(e.target.value)}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontFamily: "'Georgia', serif",
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
              }}
              autoFocus
            />
          ) : (
            <blockquote
              onClick={() => setIsEditing(true)}
              style={{
                fontSize: '1.2rem',
                fontFamily: "'Georgia', serif",
                lineHeight: 1.7,
                color: '#1a1a1a',
                cursor: 'pointer',
                margin: 0,
                padding: '0.5rem 0',
                borderLeft: '3px solid #DC143C',
                paddingLeft: '1rem',
              }}
              title="Click to edit"
            >
              {plainContent}
            </blockquote>
          )}
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '1rem 0' }} />

        {/* Connection type selector */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '0.5rem' }}>
            Type
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {CONNECTION_TYPES.map(type => {
              const isActive = connectionType === type.value
              return (
                <button
                  key={type.value}
                  onClick={() => {
                    setConnectionType(isActive ? null : type.value)
                  }}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '16px',
                    border: isActive ? '1px solid #1a1a1a' : '1px solid #e5e7eb',
                    background: isActive ? '#1a1a1a' : '#fff',
                    color: isActive ? '#fff' : '#4B5563',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#6B7280', marginBottom: '1rem' }}>
          <div>Created: {formatEntryDateLong(entry.created_at)}</div>
          {sourceEntry && (
            <div>
              Source:{' '}
              <button
                onClick={() => onViewEntry?.(sourceEntry.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#DC143C',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                {sourceEntry.headline}
              </button>
            </div>
          )}
          {(entry.surface_count ?? 0) > 0 && (
            <div>
              Surfaced {entry.surface_count} time{entry.surface_count !== 1 ? 's' : ''}
              {entry.last_surfaced_at && ` · Last: ${formatEntryDateLong(entry.last_surfaced_at)}`}
            </div>
          )}
        </div>

        {/* Surface conditions (collapsible) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => setShowConditions(!showConditions)}
            style={{
              background: 'none',
              border: 'none',
              color: '#6B7280',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0.25rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span style={{ transform: showConditions ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', display: 'inline-block' }}>
              ▸
            </span>
            Surface Conditions
          </button>

          {showConditions && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Time of day */}
              <div>
                <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '0.35rem' }}>Time of Day</div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {TIMES_OF_DAY.map(time => {
                    const isActive = conditions.time_of_day === time
                    return (
                      <button
                        key={time}
                        onClick={() => setConditions({ ...conditions, time_of_day: isActive ? undefined : time })}
                        style={{
                          padding: '0.3rem 0.6rem',
                          borderRadius: '14px',
                          border: isActive ? '1px solid #1a1a1a' : '1px solid #e5e7eb',
                          background: isActive ? '#1a1a1a' : '#fff',
                          color: isActive ? '#fff' : '#6B7280',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        {time}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Days of week */}
              <div>
                <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '0.35rem' }}>Days</div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {DAYS_OF_WEEK.map((day, i) => {
                    const isActive = (conditions.days_of_week ?? []).includes(i)
                    return (
                      <button
                        key={i}
                        onClick={() => toggleDay(i)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: isActive ? '1px solid #1a1a1a' : '1px solid #e5e7eb',
                          background: isActive ? '#1a1a1a' : '#fff',
                          color: isActive ? '#fff' : '#6B7280',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Energy level */}
              <div>
                <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '0.35rem' }}>Energy Level</div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {ENERGY_LEVELS.map(level => {
                    const isActive = conditions.when_energy === level
                    return (
                      <button
                        key={level}
                        onClick={() => setConditions({ ...conditions, when_energy: isActive ? undefined : level })}
                        style={{
                          padding: '0.3rem 0.6rem',
                          borderRadius: '14px',
                          border: isActive ? '1px solid #1a1a1a' : '1px solid #e5e7eb',
                          background: isActive ? '#1a1a1a' : '#fff',
                          color: isActive ? '#fff' : '#6B7280',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        {level}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={handleDelete}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #fecaca',
              background: '#fff',
              color: '#DC2626',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
          {isEditing && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: '#1a1a1a',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.6 : 1,
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
          {!isEditing && (connectionType !== entry.connection_type || JSON.stringify(conditions) !== JSON.stringify(entry.surface_conditions ?? {})) && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: '#1a1a1a',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.6 : 1,
              }}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
