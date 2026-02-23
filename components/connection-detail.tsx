'use client'

import { useState, useCallback, useEffect } from 'react'
import { Entry, ConnectionType, SurfaceConditions } from '@/types'
import { stripHtml, formatEntryDateLong } from '@/lib/utils'
import { updateEntryDetails, togglePin } from '@/app/actions/entries'

interface ConnectionDetailProps {
  entry: Entry
  onClose: () => void
  onDeleteEntry: (id: string) => void
  onEntryUpdated?: (entryId: string, updates: Partial<Entry>) => void
  onPinToggled?: (entryId: string, isPinned: boolean) => void
  onViewEntry?: (entryId: string) => void
  sourceEntry?: Entry | null
  fromNotification?: boolean
}

const CONNECTION_TYPES: { value: ConnectionType; label: string; icon: string }[] = [
  { value: 'identity_anchor', label: 'Identity Anchor', icon: '\u{1FA9E}' },
  { value: 'pattern_interrupt', label: 'Pattern Interrupt', icon: '\u26A1' },
  { value: 'validated_principle', label: 'Validated Principle', icon: '\u{1F511}' },
  { value: 'process_anchor', label: 'Process Anchor', icon: '\u{1F504}' },
]

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TIME_WINDOWS: { value: 'morning' | 'midday' | 'evening'; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'midday', label: 'Midday' },
  { value: 'evening', label: 'Evening' },
]
const ENERGY_LEVELS: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high']
const PRIORITIES: { value: 'high' | 'normal' | 'low'; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
]
const INTERVAL_OPTIONS = [
  { hours: 24, label: 'Every day' },
  { hours: 48, label: 'Every 2 days' },
  { hours: 72, label: 'Every 3 days' },
  { hours: 168, label: 'Every week' },
  { hours: 336, label: 'Every 2 weeks' },
]
const SNOOZE_OPTIONS = [
  { hours: 24, label: '1 day' },
  { hours: 72, label: '3 days' },
  { hours: 168, label: '1 week' },
  { hours: 720, label: '1 month' },
]

export function ConnectionDetail({
  entry,
  onClose,
  onDeleteEntry,
  onEntryUpdated,
  onPinToggled,
  onViewEntry,
  sourceEntry,
  fromNotification = false,
}: ConnectionDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(stripHtml(entry.content))
  const [connectionType, setConnectionType] = useState<ConnectionType | null>(entry.connection_type ?? null)
  const [conditions, setConditions] = useState<SurfaceConditions>(entry.surface_conditions ?? {})
  const [isSaving, setIsSaving] = useState(false)
  const [showConditions, setShowConditions] = useState(false)
  const [isPinned, setIsPinned] = useState(!!entry.pinned_at)
  const [isPinning, setIsPinning] = useState(false)
  const [sendingNow, setSendingNow] = useState(false)
  const [sendNowStatus, setSendNowStatus] = useState<string | null>(null)
  const [respondingAction, setRespondingAction] = useState<string | null>(null)
  const [responseRecorded, setResponseRecorded] = useState(false)
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false)

  useEffect(() => {
    if (!conditions.time_windows && conditions.time_of_day) {
      const migrated: ('morning' | 'midday' | 'evening')[] =
        conditions.time_of_day === 'afternoon' ? ['midday'] : [conditions.time_of_day as 'morning' | 'evening']
      setConditions(prev => ({ ...prev, time_windows: migrated }))
    }
  }, [])

  const handleTogglePin = useCallback(async () => {
    const previousState = isPinned
    setIsPinned(!isPinned)
    setIsPinning(true)
    try {
      const result = await togglePin(entry.id)
      console.log('[PIN] togglePin result:', JSON.stringify(result), 'for entry:', entry.id)
      if (result.error) {
        console.error('[PIN] togglePin error:', result.error)
        setIsPinned(previousState)
      } else {
        console.log('[PIN] calling onPinToggled, pinned:', result.pinned)
        onPinToggled?.(entry.id, result.pinned ?? !previousState)
      }
    } catch (err) {
      console.error('[PIN] togglePin threw:', err)
      setIsPinned(previousState)
    } finally {
      setIsPinning(false)
    }
  }, [isPinned, entry.id, onPinToggled])

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

  const toggleTimeWindow = (window: 'morning' | 'midday' | 'evening') => {
    const current = conditions.time_windows ?? []
    const updated = current.includes(window) ? current.filter(w => w !== window) : [...current, window]
    setConditions({ ...conditions, time_windows: updated.length > 0 ? updated : undefined })
  }

  const handleSendNow = async () => {
    setSendingNow(true)
    setSendNowStatus(null)
    try {
      const res = await fetch('/api/push/send-connection', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: entry.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setSendNowStatus(`Sent to ${data.sent} device${data.sent !== 1 ? 's' : ''}`)
      } else {
        setSendNowStatus(data.error || 'Failed to send')
      }
    } catch {
      setSendNowStatus('Network error')
    }
    setSendingNow(false)
  }

  const handleResponse = async (action: string, snoozeDurationHours?: number) => {
    setRespondingAction(action)
    try {
      await fetch('/api/notifications/response', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: entry.id,
          action,
          snoozeDurationHours,
        }),
      })
      setResponseRecorded(true)
      setShowSnoozeOptions(false)
    } catch {
      // silently fail
    }
    setRespondingAction(null)
  }

  const hasChanges = connectionType !== entry.connection_type ||
    JSON.stringify(conditions) !== JSON.stringify(entry.surface_conditions ?? {})

  const plainContent = stripHtml(entry.content)
  const typeMeta = connectionType ? CONNECTION_TYPES.find(t => t.value === connectionType) : null

  const surfaceCount = entry.surface_count || 0
  const landedCount = entry.landed_count || 0
  const snoozeCount = entry.snooze_count || 0

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
        {/* Top-right actions */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}>
          <button
            onClick={handleTogglePin}
            disabled={isPinning}
            title={isPinned ? 'Unpin from hero' : 'Pin to hero'}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: isPinning ? 'not-allowed' : 'pointer',
              padding: '0.25rem 0.4rem',
              borderRadius: '6px',
              opacity: isPinning ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 64 64"
              fill="none"
              style={{ transform: 'rotate(30deg)', transition: 'all 0.2s ease' }}
            >
              {/* Needle (silver, behind everything) */}
              <line
                x1="32"
                y1="44"
                x2="32"
                y2="62"
                stroke="#A0A0A0"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="32" cy="62" r="1.5" fill="#808080" />
              {/* Collar / flared base */}
              <path
                d="M22 40 C22 36, 42 36, 42 40 L40 44 C40 46, 24 46, 24 44 Z"
                fill={isPinned ? '#B01030' : '#808080'}
                style={{ transition: 'fill 0.2s ease' }}
              />
              {/* Body / cylinder */}
              <rect
                x="27"
                y="18"
                width="10"
                height="20"
                rx="2"
                fill={isPinned ? '#DC143C' : '#9CA3AF'}
                style={{ transition: 'fill 0.2s ease' }}
              />
              {/* Head / flat top */}
              <ellipse
                cx="32"
                cy="16"
                rx="14"
                ry="6"
                fill={isPinned ? '#DC143C' : '#9CA3AF'}
                style={{ transition: 'fill 0.2s ease' }}
              />
              {/* Highlight on head */}
              <ellipse
                cx="29"
                cy="14"
                rx="6"
                ry="2.5"
                fill={isPinned ? '#E8384A' : '#B0B0B0'}
                style={{ transition: 'fill 0.2s ease' }}
              />
            </svg>
          </button>
          <button
            onClick={onClose}
            style={{
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
        </div>

        {/* Notification response buttons */}
        {fromNotification && !responseRecorded && (
          <div style={{ marginBottom: '1.5rem' }}>
            {!showSnoozeOptions ? (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => handleResponse('landed')}
                  disabled={respondingAction !== null}
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#1a6b3c',
                    color: '#fff',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: respondingAction ? 'wait' : 'pointer',
                    opacity: respondingAction === 'landed' ? 0.6 : 1,
                  }}
                >
                  {respondingAction === 'landed' ? 'Recording...' : 'This Landed'}
                </button>
                <button
                  onClick={() => setShowSnoozeOptions(true)}
                  disabled={respondingAction !== null}
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    color: '#6B7280',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: respondingAction ? 'wait' : 'pointer',
                  }}
                >
                  Snooze
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Snooze for...
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {SNOOZE_OPTIONS.map(opt => (
                    <button
                      key={opt.hours}
                      onClick={() => handleResponse('snooze', opt.hours)}
                      disabled={respondingAction !== null}
                      style={{
                        padding: '0.5rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        background: '#fff',
                        color: '#374151',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        cursor: respondingAction ? 'wait' : 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowSnoozeOptions(false)}
                    style={{
                      padding: '0.5rem 0.85rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: '#9CA3AF',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {responseRecorded && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '0.75rem 1rem',
            background: '#f0fdf4',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#166534',
            fontWeight: 500,
          }}>
            Response recorded. Thank you.
          </div>
        )}

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
                  onClick={() => setConnectionType(isActive ? null : type.value)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '16px',
                    border: isActive ? '1px solid #1a1a1a' : '1px solid #e5e7eb',
                    background: isActive ? '#1a1a1a' : '#fff',
                    color: isActive ? '#fff' : '#4B5563',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
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

        {/* Metadata + Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#6B7280', marginBottom: '1rem' }}>
          <div>Created: {formatEntryDateLong(entry.created_at)}</div>
          {sourceEntry && (
            <div>
              Source:{' '}
              <button
                onClick={() => onViewEntry?.(sourceEntry.id)}
                style={{ background: 'none', border: 'none', color: '#DC143C', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', padding: 0 }}
              >
                {sourceEntry.headline}
              </button>
            </div>
          )}
          {surfaceCount > 0 && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span>Surfaced {surfaceCount}x</span>
              {landedCount > 0 && <span>Landed {landedCount}x</span>}
              {snoozeCount > 0 && <span>Snoozed {snoozeCount}x</span>}
              {entry.last_surfaced_at && <span>Last: {formatEntryDateLong(entry.last_surfaced_at)}</span>}
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
              &#x25B8;
            </span>
            Surface Conditions
          </button>

          {showConditions && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Time windows (multi-select) */}
              <div>
                <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '0.35rem' }}>Time Windows</div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {TIME_WINDOWS.map(tw => {
                    const isActive = (conditions.time_windows ?? []).includes(tw.value)
                    return (
                      <button
                        key={tw.value}
                        onClick={() => toggleTimeWindow(tw.value)}
                        style={{
                          padding: '0.3rem 0.6rem',
                          borderRadius: '14px',
                          border: isActive ? '1px solid #1a1a1a' : '1px solid #e5e7eb',
                          background: isActive ? '#1a1a1a' : '#fff',
                          color: isActive ? '#fff' : '#6B7280',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                        }}
                      >
                        {tw.label}
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

              {/* Frequency */}
              <div>
                <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '0.35rem' }}>Frequency</div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {INTERVAL_OPTIONS.map(opt => {
                    const isActive = (conditions.min_interval_hours || 48) === opt.hours
                    return (
                      <button
                        key={opt.hours}
                        onClick={() => setConditions({ ...conditions, min_interval_hours: opt.hours })}
                        style={{
                          padding: '0.3rem 0.6rem',
                          borderRadius: '14px',
                          border: isActive ? '1px solid #1a1a1a' : '1px solid #e5e7eb',
                          background: isActive ? '#1a1a1a' : '#fff',
                          color: isActive ? '#fff' : '#6B7280',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Priority */}
              <div>
                <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '0.35rem' }}>Priority</div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {PRIORITIES.map(p => {
                    const isActive = (conditions.priority || 'normal') === p.value
                    return (
                      <button
                        key={p.value}
                        onClick={() => setConditions({ ...conditions, priority: p.value })}
                        style={{
                          padding: '0.3rem 0.6rem',
                          borderRadius: '14px',
                          border: isActive ? '1px solid #1a1a1a' : '1px solid #e5e7eb',
                          background: isActive ? '#1a1a1a' : '#fff',
                          color: isActive ? '#fff' : '#6B7280',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                        }}
                      >
                        {p.label}
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

        {/* Send Now + Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleSendNow}
              disabled={sendingNow}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                background: '#fff',
                color: '#374151',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: sendingNow ? 'wait' : 'pointer',
                opacity: sendingNow ? 0.6 : 1,
              }}
            >
              {sendingNow ? 'Sending...' : 'Send Now'}
            </button>
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
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(isEditing || hasChanges) && (
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
          </div>
        </div>

        {sendNowStatus && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6B7280' }}>
            {sendNowStatus}
          </div>
        )}
      </div>
    </div>
  )
}
