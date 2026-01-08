'use client'

import { useEffect, useState } from 'react'

interface CategoryNavProps {
  currentFilter: string
  onFilterChange: (category: string) => void
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

export function CategoryNav({ currentFilter, onFilterChange }: CategoryNavProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) return
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.category-dropdown')) {
        setIsDropdownOpen(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isDropdownOpen])

  const displayCategory = currentFilter === 'all' ? 'All' : currentFilter

  return (
    <>
      {/* Mobile: Dropdown selector - hidden on desktop via CSS */}
      <div 
        className="category-dropdown category-nav-mobile"
        style={{
          padding: '0.75rem 1rem',
          background: 'var(--bg-hero)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0.75rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            color: 'var(--text-hero)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              color: 'var(--text-hero-muted)', 
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05rem',
            }}>
              Category:
            </span>
            <span style={{ color: currentFilter === 'all' ? 'var(--text-hero)' : 'var(--color-red)' }}>
              {displayCategory}
            </span>
          </span>
          <span style={{ 
            transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            fontSize: '0.8rem',
          }}>
            ▼
          </span>
        </button>

        {isDropdownOpen && (
          <div style={{
            position: 'absolute',
            left: '1rem',
            right: '1rem',
            marginTop: '0.5rem',
            background: 'var(--bg-card)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            overflow: 'hidden',
            zIndex: 100,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  onFilterChange(category)
                  setIsDropdownOpen(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: currentFilter === category ? 'rgba(220, 20, 60, 0.1)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  color: currentFilter === category ? 'var(--color-red)' : 'var(--text-hero)',
                  fontSize: '0.9rem',
                  fontWeight: currentFilter === category ? 600 : 400,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {category === 'all' ? 'All Categories' : category}
                {currentFilter === category && (
                  <span style={{ float: 'right', color: 'var(--color-red)' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Horizontal tabs - hidden on mobile via CSS */}
      <nav className="section-nav category-nav-desktop">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${currentFilter === category ? 'active' : ''}`}
            data-category={category}
            onClick={() => onFilterChange(category)}
          >
            {category === 'all' ? 'All' : category}
          </button>
        ))}
      </nav>
    </>
  )
}
