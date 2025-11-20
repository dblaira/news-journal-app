'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Entry, WeeklyTheme } from '@/types'
import { Header } from './header'
import { MindsetBanner } from './mindset-banner'
import { WeeklyThemeBanner } from './weekly-theme-banner'
import { CategoryNav } from './category-nav'
import { HeroStory } from './hero-story'
import { FeatureGrid } from './feature-grid'
import { Sidebar } from './sidebar'
import { ConnectionGrid } from './connection-grid'
import { EntriesFeed } from './entries-feed'
import { EntryForm } from './entry-form'
import { EntryModal } from './entry-modal'
import { deriveMindsetPreset } from '@/lib/mindset'
import { formatEntryDateLong } from '@/lib/utils'
import { deleteEntry, updateEntryVersions, generateWeeklyTheme } from '@/app/actions/entries'
import { supabase } from '@/lib/supabase/client'

interface JournalPageClientProps {
  initialEntries: Entry[]
  initialSearchQuery: string
  userId: string
  initialWeeklyTheme?: WeeklyTheme | null
}

export function JournalPageClient({
  initialEntries,
  initialSearchQuery,
  userId,
  initialWeeklyTheme,
}: JournalPageClientProps) {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [currentFilter, setCurrentFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [showForm, setShowForm] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [isGeneratingVersions, setIsGeneratingVersions] = useState<string | null>(null)
  const [weeklyTheme, setWeeklyTheme] = useState<WeeklyTheme | null>(initialWeeklyTheme || null)
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false)

  // Filter entries
  let filtered = [...entries]
  if (currentFilter !== 'all') {
    filtered = filtered.filter(
      (entry) => entry.category.toLowerCase() === currentFilter.toLowerCase()
    )
  }
  if (searchQuery) {
    filtered = filtered.filter((entry) => {
      const haystack = [
        entry.headline,
        entry.subheading,
        entry.content,
        entry.mood,
        entry.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(searchQuery)
    })
  }

  // Calculate mindset
  const primaryEntry = entries[0]
  const mindset = primaryEntry
    ? deriveMindsetPreset(
        (primaryEntry.mood || '').toLowerCase(),
        (primaryEntry.category || '').toLowerCase()
      )
    : {
        headline: 'Calling all Big Wave Riders',
        subtitle: 'Step into the day like it is a headline worth remembering.',
      }

  // Calculate issue tagline
  const editionNumber = Math.max(entries.length, 1).toString().padStart(2, '0')
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const issueTagline = `Edition ${editionNumber} · ${today}`

  const handleCreateEntry = () => {
    console.log('handleCreateEntry called, setting showForm to true')
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    router.refresh()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFormCancel = () => {
    setShowForm(false)
  }

  const handleViewEntry = (id: string) => {
    const entry = entries.find((e) => e.id === id)
    if (entry) {
      setSelectedEntry(entry)
    }
  }

  const handleCloseModal = () => {
    setSelectedEntry(null)
  }

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return

    const result = await deleteEntry(id)
    if (result.error) {
      alert(`Failed to delete entry: ${result.error}`)
      return
    }

    setEntries(entries.filter((e) => e.id !== id))
    if (selectedEntry?.id === id) {
      setSelectedEntry(null)
    }
  }

  const handleGenerateVersions = async (id: string) => {
    const entry = entries.find((e) => e.id === id)
    if (!entry) return

    setIsGeneratingVersions(id)
    setEntries(
      entries.map((e) =>
        e.id === id ? { ...e, generating_versions: true } : e
      )
    )

    try {
      await updateEntryVersions(id, [], true)

      const response = await fetch('/api/generate-versions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entry }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `API request failed: ${response.status}`)
      }

      const data = await response.json()
      await updateEntryVersions(id, data.versions, false)

      const updatedEntries = entries.map((e) =>
        e.id === id
          ? { ...e, versions: data.versions, generating_versions: false }
          : e
      )
      setEntries(updatedEntries)

      setIsGeneratingVersions(null)
      const updatedEntry = updatedEntries.find((e) => e.id === id)
      if (updatedEntry) {
        setSelectedEntry(updatedEntry)
      }
    } catch (error: any) {
      console.error('Error generating versions:', error)
      await updateEntryVersions(id, [], false)
      setEntries(
        entries.map((e) =>
          e.id === id ? { ...e, generating_versions: false } : e
        )
      )
      setIsGeneratingVersions(null)
      alert(`Failed to generate versions: ${error.message || 'Please try again.'}`)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleGenerateWeeklyTheme = async () => {
    if (entries.length < 7) {
      alert('You need at least 7 entries to generate a weekly theme')
      return
    }

    setIsGeneratingTheme(true)
    try {
      const recentEntries = entries.slice(0, 7)
      const entryIds = recentEntries.map((e) => e.id)
      
      const result = await generateWeeklyTheme(entryIds)
      if (result.error) {
        alert(`Failed to generate weekly theme: ${result.error}`)
        return
      }

      if (result.data) {
        setWeeklyTheme(result.data)
        router.refresh()
      }
    } catch (error: any) {
      console.error('Error generating weekly theme:', error)
      alert(`Failed to generate weekly theme: ${error.message || 'Please try again.'}`)
    } finally {
      setIsGeneratingTheme(false)
    }
  }

  const handleViewTheme = (theme: WeeklyTheme) => {
    // For now, show theme content in an alert. Could be enhanced with a modal
    alert(`${theme.headline}\n\n${theme.subtitle}\n\n${theme.theme_content}`)
  }

  return (
    <div className="page-shell">
      <Header issueTagline={issueTagline} onNewEntry={handleCreateEntry} />
      <button
        onClick={handleLogout}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '10px 20px',
          background: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 600,
          zIndex: 1000,
        }}
      >
        Logout
      </button>

      {weeklyTheme ? (
        <WeeklyThemeBanner
          theme={weeklyTheme}
          onViewTheme={handleViewTheme}
        />
      ) : (
        <MindsetBanner
          headline={mindset.headline}
          subtitle={mindset.subtitle}
        />
      )}

      {entries.length >= 7 && !weeklyTheme && (
        <div style={{ 
          padding: '1.5rem 2rem', 
          textAlign: 'center',
          background: 'var(--bg-panel)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          marginBottom: '2rem'
        }}>
          <p style={{ 
            marginBottom: '1rem', 
            color: 'var(--text-secondary)',
            fontSize: '0.95rem'
          }}>
            You have {entries.length} entries. Generate your weekly theme!
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={handleGenerateWeeklyTheme}
            disabled={isGeneratingTheme}
            style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}
          >
            {isGeneratingTheme ? 'Generating...' : '✨ Generate Weekly Theme'}
          </button>
        </div>
      )}
      
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          padding: '0.5rem', 
          fontSize: '0.75rem', 
          color: 'var(--text-muted)',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          Debug: {entries.length} entries, Weekly theme: {weeklyTheme ? 'exists' : 'none'}
        </div>
      )}

      <CategoryNav
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
      />

      <main className="page-content">
        <HeroStory
          entry={filtered[0] || null}
          onCreateEntry={handleCreateEntry}
          onViewEntry={handleViewEntry}
          onGenerateVersions={handleGenerateVersions}
        />

        <section className="front-grid">
          <FeatureGrid
            entries={filtered.slice(1)}
            onViewEntry={handleViewEntry}
          />
          <Sidebar
            trendingEntries={filtered}
            quickNotesEntries={filtered}
            onViewEntry={handleViewEntry}
          />
        </section>

        <section className="connection-station">
          <div className="section-header">
            <h2>Connection Station</h2>
            <p className="section-lede">
              Moments stitched from across your categories.
            </p>
          </div>
          <ConnectionGrid entries={entries} onViewEntry={handleViewEntry} />
        </section>

        <section className="latest-section">
          <div className="section-header">
            <h2>Latest Dispatches</h2>
            <p className="section-lede">Everyday moments, headline worthy.</p>
          </div>
          <EntriesFeed
            entries={filtered}
            onViewEntry={handleViewEntry}
            onGenerateVersions={handleGenerateVersions}
            onDeleteEntry={handleDeleteEntry}
          />
        </section>

        {showForm && (
          <EntryForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
        )}
      </main>

      <footer>
        <p>&copy; 2025 Adam Daily. Your story, your way.</p>
      </footer>

      {selectedEntry && (
        <EntryModal
          entry={selectedEntry}
          onClose={handleCloseModal}
          onGenerateVersions={handleGenerateVersions}
        />
      )}
    </div>
  )
}

