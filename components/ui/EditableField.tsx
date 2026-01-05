// components/ui/EditableField.tsx

'use client'

import { useState } from 'react'

interface EditableFieldProps {
  value: string
  onSave: (value: string) => void
  placeholder?: string
  style?: React.CSSProperties
}

export default function EditableField({
  value,
  onSave,
  placeholder,
  style,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  
  const handleSave = () => {
    if (editValue.trim() && editValue !== value) {
      onSave(editValue.trim())
    }
    setIsEditing(false)
  }
  
  if (isEditing) {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') setIsEditing(false)
          }}
          autoFocus
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: '6px 10px',
            background: 'var(--bg-panel, #1F2937)',
            border: '1px solid var(--text-muted, #6B7280)',
            borderRadius: '4px',
            color: '#FFFFFF',
            fontSize: '0.9rem',
            ...style,
          }}
        />
        <button
          type="button"
          onClick={handleSave}
          style={{
            padding: '6px 10px',
            background: '#22C55E',
            border: 'none',
            borderRadius: '4px',
            color: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          ✓
        </button>
      </div>
    )
  }
  
  return (
    <div
      onClick={() => {
        setEditValue(value)
        setIsEditing(true)
      }}
      style={{
        padding: '6px 10px',
        background: 'var(--bg-panel, #1F2937)',
        borderRadius: '4px',
        color: '#FFFFFF',
        fontSize: '0.9rem',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...style,
      }}
    >
      <span>{value || placeholder}</span>
      <span style={{ color: 'var(--text-muted, #6B7280)', fontSize: '0.75rem' }}>✎</span>
    </div>
  )
}

