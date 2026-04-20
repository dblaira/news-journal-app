'use client'

import { useState, useCallback } from 'react'
import { ConnectionType, Entry } from '@/types'
import { createEntry } from '@/app/actions/entries'

interface ConnectionExtractModalProps {
  selectedText: string
  sourceEntryId: string
  sourceCategory: Entry['category']
  onClose: () => void
  onSaved: (entry: Entry) => void
}

const CONNECTION_TYPES: { value: ConnectionType; label: string; icon: string }[] = [
  { value: 'identity_anchor', label: 'Identity Anchor', icon: '🪞' },
  { value: 'pattern_interrupt', label: 'Pattern Interrupt', icon: '⚡' },
  { value: 'validated_principle', label: 'Validated Principle', icon: '🔑' },
  { value: 'process_anchor', label: 'Process Anchor', icon: '🔄' },
]

function inferConnectionType(text: string): ConnectionType {
  const lower = text.toLowerCase()
  if (lower.includes('?') || lower.startsWith('am i') || lower.startsWith('is this')) return 'pattern_interrupt'
  if (lower.startsWith('i am') || lower.startsWith('i\'m') || lower.includes('my identity') || lower.includes('who i am')) return 'identity_anchor'
  if (lower.includes(':') || lower.includes('step') || lower.includes('then') || lower.includes('first')) return 'process_anchor'
  return 'validated_principle'
}

export function ConnectionExtractModal({
  selectedText,
  sourceEntryId,
  sourceCategory,
  onClose,
  onSaved,
}: ConnectionExtractModalProps) {
  const [text, setText] = useState(selectedText)
  const [connectionType, setConnectionType] = useState<ConnectionType>(inferConnectionType(selectedText))
  const [isSaving, setIsSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const handleSave = useCallback(async () => {
    if (!text.trim()) return
    setIsSaving(true)
    try {
      const result = await createEntry({
        headline: text.trim().length > 60 ? text.trim().slice(0, 57) + '...' : text.trim(),
        content: text.trim(),
        category: sourceCategory,
        entry_type: 'connection',
        connection_type: connectionType,
        source_entry_id: sourceEntryId,
        mood: 'reflective',
      })
      if (result.error) {
        console.error('Failed to save connection:', result.error)
        alert('Failed to save connection: ' + result.error)
        return
      }
      setShowToast(true)
      setTimeout(() => {
        onSaved(result.data as Entry)
        onClose()
      }, 1200)
    } catch (err) {
      console.error('Failed to save connection:', err)
    } finally {
      setIsSaving(false)
    }
  }, [text, connectionType, sourceEntryId, sourceCategory, onClose, onSaved])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
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
        maxWidth: '480px',
        width: '100%',
        padding: '1.5rem',
        position: 'relative',
        animation: 'toolbar-pop-in 150ms ease-out',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: '#1a1a1a',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}>
            <span style={{ color: '#a78bfa' }}>⚡</span> Save Connection
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              color: '#9CA3AF',
              padding: '0.25rem',
            }}
          >
            &times;
          </button>
        </div>

        {/* Editable text */}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '0.75rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '1rem',
            fontFamily: "'Georgia', serif",
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            marginBottom: '1rem',
            color: '#1a1a1a',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#a78bfa' }}
          onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb' }}
          autoFocus
        />

        {/* Connection type chips */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '0.4rem' }}>
            Type
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {CONNECTION_TYPES.map(type => {
              const isActive = connectionType === type.value
              return (
                <button
                  key={type.value}
                  onClick={() => setConnectionType(type.value)}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '14px',
                    border: isActive ? '1px solid #7c3aed' : '1px solid #e5e7eb',
                    background: isActive ? '#7c3aed' : '#fff',
                    color: isActive ? '#fff' : '#6B7280',
                    fontSize: '0.72rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isSaving || !text.trim()}
          style={{
            width: '100%',
            padding: '0.65rem',
            borderRadius: '8px',
            border: 'none',
            background: isSaving ? '#d1d5db' : '#1a1a1a',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: isSaving || !text.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {isSaving ? 'Saving...' : 'Save Connection'}
        </button>

        {/* Toast */}
        {showToast && (
          <div style={{
            position: 'absolute',
            bottom: '-3rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1a1a1a',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'toolbar-pop-in 150ms ease-out',
          }}>
            🔗 Connection saved to your belief library
          </div>
        )}
      </div>
    </div>
  )
}
