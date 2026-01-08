'use client'

import { useEffect } from 'react'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  currentFilter: string
  onFilterChange: (category: string) => void
  currentEntryType: string | null
  onEntryTypeChange: (type: string | null) => void
}

const categories = [
  'all',
  'Business',
  'Finance',
  'Health',
  'Spiritual',
  'Fun',
  'Social',
  'Romance',
]

const entryTypes = [
  { value: 'action', label: 'Actions' },
  { value: 'note', label: 'Notes' },
  { value: 'story', label: 'Story' },
]

export function MobileMenu({
  isOpen,
  onClose,
  currentFilter,
  onFilterChange,
  currentEntryType,
  onEntryTypeChange,
}: MobileMenuProps) {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleCategoryClick = (category: string) => {
    onFilterChange(category)
    onClose()
  }

  const handleEntryTypeClick = (type: string | null) => {
    onEntryTypeChange(type === currentEntryType ? null : type)
    onClose()
  }

  return (
    <div 
      className="mobile-menu-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000000',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close menu"
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'transparent',
          border: 'none',
          color: '#FFFFFF',
          fontSize: '1rem',
          fontWeight: 600,
          letterSpacing: '0.1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem',
        }}
      >
        CLOSE
        <span style={{ fontSize: '1.25rem' }}>✕</span>
      </button>

      {/* Menu content */}
      <nav
        style={{
          padding: '4rem 1.5rem 2rem',
          height: '100%',
          overflowY: 'auto',
        }}
      >
        {/* Categories section */}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {categories.map((category) => (
            <li key={category}>
              <button
                onClick={() => handleCategoryClick(category)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '1rem 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  color: currentFilter === category ? '#DC143C' : '#FFFFFF',
                  fontSize: '1rem',
                  fontWeight: 600,
                  letterSpacing: '0.15rem',
                  textTransform: 'uppercase',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                }}
              >
                {category === 'all' ? 'All' : category}
                {currentFilter === category && (
                  <span style={{ float: 'right', color: '#DC143C' }}>●</span>
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            background: 'rgba(255, 255, 255, 0.2)',
            margin: '1.5rem 0',
          }}
        />

        {/* Entry Types section */}
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.15rem',
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
          }}
        >
          Entries
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {entryTypes.map((type) => (
            <li key={type.value}>
              <button
                onClick={() => handleEntryTypeClick(type.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.875rem 0 0.875rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  color: currentEntryType === type.value ? '#DC143C' : 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  letterSpacing: '0.1rem',
                  textTransform: 'uppercase',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                }}
              >
                {type.label}
                {currentEntryType === type.value && (
                  <span style={{ float: 'right', color: '#DC143C' }}>●</span>
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Bottom section */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.1rem',
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>🔍</span>
            Search
          </button>
        </div>
      </nav>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
