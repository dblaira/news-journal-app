'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileMenu } from './mobile-menu'

interface HeaderProps {
  issueTagline: string
  onNewEntry: () => void
  currentFilter?: string
  onFilterChange?: (category: string) => void
  currentEntryType?: string | null
  onEntryTypeChange?: (type: string | null) => void
}

export function Header({ 
  issueTagline, 
  onNewEntry,
  currentFilter = 'all',
  onFilterChange,
  currentEntryType = null,
  onEntryTypeChange,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/?search=${encodeURIComponent(searchQuery)}`)
  }

  const handleFilterChange = (category: string) => {
    onFilterChange?.(category)
  }

  const handleEntryTypeChange = (type: string | null) => {
    onEntryTypeChange?.(type)
  }

  // Mobile header
  if (isMobile) {
    return (
      <>
        <header 
          className="site-header mobile-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            background: 'var(--bg-hero)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Logo */}
          <div className="brand-block" style={{ flex: 'none' }}>
            <span 
              className="brand-title" 
              style={{ 
                fontSize: '1.1rem',
                fontWeight: 700,
                letterSpacing: '0.05rem',
              }}
            >
              Personal Press
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* New Entry button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                onNewEntry()
              }}
              type="button"
              style={{
                background: 'var(--color-red)',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.5rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              + New
            </button>

            {/* Menu button */}
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-hero)',
                padding: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.05rem',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Menu
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>☰</span>
            </button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        <MobileMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          currentFilter={currentFilter}
          onFilterChange={handleFilterChange}
          currentEntryType={currentEntryType}
          onEntryTypeChange={handleEntryTypeChange}
        />
      </>
    )
  }

  // Desktop header (unchanged)
  return (
    <header className="site-header">
      <div className="brand-block">
        <span className="brand-title">Personal Press</span>
        <span className="brand-edition" id="issueTagline">
          {issueTagline}
        </span>
      </div>
      <div className="header-controls">
        <form id="searchForm" className="search-bar" onSubmit={handleSearch}>
          <input
            id="searchInput"
            type="search"
            placeholder="Search your headlines…"
            aria-label="Search your headlines"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" aria-label="Submit search">
            <span>Search</span>
          </button>
        </form>
        <button 
          id="newEntryBtn" 
          className="btn-primary" 
          onClick={(e) => {
            e.preventDefault()
            onNewEntry()
          }}
          type="button"
        >
          + New Entry
        </button>
      </div>
    </header>
  )
}
