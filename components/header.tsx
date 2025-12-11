'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  issueTagline: string
  onNewEntry: () => void
}

export function Header({ issueTagline, onNewEntry }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search will be handled by parent component via URL params or state
    router.push(`/?search=${encodeURIComponent(searchQuery)}`)
  }

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

