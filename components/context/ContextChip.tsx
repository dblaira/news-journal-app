'use client'

import { CSSProperties } from 'react'

interface ContextChipProps {
  label: string
  emoji?: string
  selected?: boolean
  onClick?: () => void
  onRemove?: () => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  variant?: 'default' | 'summary' | 'custom'
  size?: 'sm' | 'md'
  disabled?: boolean
}

export default function ContextChip({
  label,
  emoji,
  selected = false,
  onClick,
  onRemove,
  draggable = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  variant = 'default',
  size = 'md',
  disabled = false,
}: ContextChipProps) {
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: size === 'sm' ? '0.3rem' : '0.4rem',
    padding: size === 'sm' ? '0.3rem 0.6rem' : '0.4rem 0.8rem',
    borderRadius: '20px',
    fontSize: size === 'sm' ? '0.75rem' : '0.85rem',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : onClick ? 'pointer' : draggable ? 'grab' : 'default',
    transition: 'all 0.15s ease',
    userSelect: 'none',
    opacity: disabled ? 0.5 : 1,
  }

  const getVariantStyle = (): CSSProperties => {
    if (variant === 'summary') {
      return {
        ...baseStyle,
        background: 'rgba(220, 20, 60, 0.1)',
        border: '1px solid rgba(220, 20, 60, 0.3)',
        color: '#DC143C',
      }
    }

    if (variant === 'custom') {
      return {
        ...baseStyle,
        background: 'transparent',
        border: '1px dashed #9CA3AF',
        color: '#6B7280',
      }
    }

    // Default variant
    if (selected) {
      return {
        ...baseStyle,
        background: '#DC143C',
        border: '2px solid #DC143C',
        color: '#FFFFFF',
      }
    }

    return {
      ...baseStyle,
      background: '#FFFFFF',
      border: '1px solid #D1D5DB',
      color: '#4B5563',
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled && onClick) {
      onClick()
    }
  }

  return (
    <span
      style={getVariantStyle()}
      onClick={handleClick}
      draggable={draggable && !disabled}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseEnter={(e) => {
        if (!disabled && (onClick || variant === 'default')) {
          e.currentTarget.style.borderColor = '#DC143C'
          if (!selected && variant === 'default') {
            e.currentTarget.style.color = '#DC143C'
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          if (selected) {
            e.currentTarget.style.borderColor = '#DC143C'
          } else if (variant === 'custom') {
            e.currentTarget.style.borderColor = '#9CA3AF'
            e.currentTarget.style.color = '#6B7280'
          } else if (variant === 'summary') {
            e.currentTarget.style.borderColor = 'rgba(220, 20, 60, 0.3)'
          } else {
            e.currentTarget.style.borderColor = '#D1D5DB'
            e.currentTarget.style.color = '#4B5563'
          }
        }
      }}
    >
      {emoji && <span>{emoji}</span>}
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: 0,
            marginLeft: '0.2rem',
            fontSize: '1rem',
            lineHeight: 1,
            opacity: 0.7,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.7'
          }}
        >
          ×
        </button>
      )}
    </span>
  )
}
