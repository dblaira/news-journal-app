// components/ui/ChipSelector.tsx

'use client'

import { useState } from 'react'

interface ChipSelectorProps {
  options: string[]
  selected: string[]
  onSelect: (values: string[]) => void
  allowCustom?: boolean
  onAddCustom?: (value: string) => void
  singleSelect?: boolean
}

export default function ChipSelector({
  options,
  selected,
  onSelect,
  allowCustom = false,
  onAddCustom,
  singleSelect = false,
}: ChipSelectorProps) {
  const [customInput, setCustomInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  
  const toggleOption = (option: string) => {
    if (singleSelect) {
      onSelect(selected.includes(option) ? [] : [option])
    } else {
      if (selected.includes(option)) {
        onSelect(selected.filter(s => s !== option))
      } else {
        onSelect([...selected, option])
      }
    }
  }
  
  const addCustom = () => {
    if (customInput.trim()) {
      onAddCustom?.(customInput.trim())
      if (singleSelect) {
        onSelect([customInput.trim()])
      } else {
        onSelect([...selected, customInput.trim()])
      }
      setCustomInput('')
      setShowCustomInput(false)
    }
  }
  
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => toggleOption(option)}
          style={{
            padding: '6px 12px',
            borderRadius: '16px',
            border: selected.includes(option) ? 'none' : '1px solid #9CA3AF',
            background: selected.includes(option) ? '#DC143C' : '#E5E7EB',
            color: selected.includes(option) ? '#FFFFFF' : '#374151',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {option}
        </button>
      ))}
      
      {allowCustom && !showCustomInput && (
        <button
          type="button"
          onClick={() => setShowCustomInput(true)}
          style={{
            padding: '6px 12px',
            borderRadius: '16px',
            border: '1px dashed var(--text-muted, #6B7280)',
            background: 'transparent',
            color: 'var(--text-secondary, #9CA3AF)',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          + Custom
        </button>
      )}
      
      {showCustomInput && (
        <div style={{ display: 'flex', gap: '4px' }}>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            placeholder="Add custom..."
            autoFocus
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              border: '1px solid #6B7280',
              background: '#374151',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              width: '120px',
            }}
          />
          <button
            type="button"
            onClick={addCustom}
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              border: 'none',
              background: '#22C55E',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => setShowCustomInput(false)}
            style={{
              padding: '6px 10px',
              borderRadius: '16px',
              border: 'none',
              background: 'var(--text-muted, #6B7280)',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

