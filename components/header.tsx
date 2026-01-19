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
  onLogout?: () => void
}

export function Header({ 
  issueTagline, 
  onNewEntry,
  currentFilter = 'all',
  onFilterChange,
  currentEntryType = null,
  onEntryTypeChange,
  onLogout,
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
        {/* Extend black background to status bar */}
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 'env(safe-area-inset-top, 0px)',
            background: '#000000',
            zIndex: 100,
          }}
        />
        <header 
          className="site-header mobile-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))',
            background: '#000000',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Logo */}
          <div className="brand-block" style={{ flex: 'none' }}>
            <span 
              className="brand-title" 
              style={{ 
                fontSize: '1.15rem',
                fontWeight: 400,
                fontFamily: "'Playfair Display', 'Times New Roman', serif",
                letterSpacing: '0.02rem',
              }}
            >
              Understood.
            </span>
          </div>

          {/* Menu button only */}
          <button
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
            style={{
              display: 'flex',
              alignItems: 'baseline',
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
            <span style={{ position: 'relative', top: '0.05rem' }}>Menu</span>
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>☰</span>
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        <MobileMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          currentFilter={currentFilter}
          onFilterChange={handleFilterChange}
          currentEntryType={currentEntryType}
          onEntryTypeChange={handleEntryTypeChange}
          onLogout={onLogout}
          onCompose={onNewEntry}
        />
      </>
    )
  }

  // Desktop header (unchanged)
  return (
    <header className="site-header">
      <div className="brand-block">
        <span className="brand-title">Understood.</span>
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
