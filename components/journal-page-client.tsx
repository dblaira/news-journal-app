'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Entry, WeeklyTheme } from '@/types'
import { Header } from './header'
import { MindsetBanner } from './mindset-banner'
import { WeeklyThemeBanner } from './weekly-theme-banner'
import { CategoryNav } from './category-nav'
import { HeroStory } from './hero-story'
import { VanityFairLayout } from './vanity-fair-layout'
import { StoryCarousel } from './story-carousel'
import { EntryFormModal } from './entry-form-modal'
import { EntryModal } from './entry-modal'
import { CaptureFAB } from './capture-fab'
import { deriveMindsetPreset } from '@/lib/mindset'
import { formatEntryDateLong } from '@/lib/utils'
import { deleteEntry, updateEntryVersions, generateWeeklyTheme } from '@/app/actions/entries'
import { supabase } from '@/lib/supabase/client'

interface JournalPageClientProps {
  initialEntries: Entry[]
  initialSearchQuery: string
  userId: string
  initialWeeklyTheme?: WeeklyTheme | null
  categoryEntries: Entry[]
  latestEntries: Entry[]
  pinnedStories: Entry[]
  pinnedNotes: Entry[]
  pinnedActions: Entry[]
}

export function JournalPageClient({
  initialEntries,
  initialSearchQuery,
  userId,
  initialWeeklyTheme,
  categoryEntries,
  latestEntries,
  pinnedStories,
  pinnedNotes,
  pinnedActions,
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
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    router.refresh()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEntryCreated = () => {
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
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) return

    const result = await deleteEntry(id)
    if (result.error) {
      alert(`Failed to delete entry: ${result.error}`)
      return
    }

    setEntries(entries.filter((e) => e.id !== id))
    if (selectedEntry?.id === id) {
      setSelectedEntry(null)
    }
    
    // Refresh the page to update the 3-column layout data
    router.refresh()
  }

  const handlePhotoUpdated = (entryId: string, photoUrl: string | null) => {
    // Update entry in local state
    const updatedEntries = entries.map((e) =>
      e.id === entryId ? { ...e, photo_url: photoUrl || undefined } : e
    )
    setEntries(updatedEntries)
    
    // Update selected entry if it's the one being modified
    if (selectedEntry?.id === entryId) {
      setSelectedEntry({ ...selectedEntry, photo_url: photoUrl || undefined })
    }
    
    // Refresh to update the 3-column layout
    router.refresh()
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

  const handlePinToggled = (entryId: string, isPinned: boolean) => {
    // Update local state to reflect pin change
    const updatedEntries = entries.map((e) =>
      e.id === entryId ? { ...e, pinned_at: isPinned ? new Date().toISOString() : null } : e
    )
    setEntries(updatedEntries)
    
    // Update selected entry if it's the one being pinned/unpinned
    if (selectedEntry?.id === entryId) {
      setSelectedEntry({ ...selectedEntry, pinned_at: isPinned ? new Date().toISOString() : null })
    }
    
    // Refresh to update the pinned sections in the layout
    router.refresh()
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

      <div className="hero-section-wrapper">
        <CategoryNav
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
        />

        <HeroStory
          entry={filtered[0] || null}
          onCreateEntry={handleCreateEntry}
          onViewEntry={handleViewEntry}
          onGenerateVersions={handleGenerateVersions}
        />
      </div>

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
          background: '#F5F0E8',
          borderRadius: '0',
          border: 'none',
          borderBottom: '2px solid var(--color-red)',
        }}>
          <p style={{ 
            marginBottom: '1rem', 
            color: '#666666',
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
          padding: '0.5rem 1.5rem', 
          fontSize: '0.75rem', 
          color: '#666666',
          background: '#F5F0E8',
          borderRadius: '0',
          borderBottom: '2px solid var(--color-red)',
        }}>
          Debug: {entries.length} entries, Weekly theme: {weeklyTheme ? 'exists' : 'none'}
        </div>
      )}

      {/* WHITE SECTION - Latest Stories, Category Layout, Footer */}
      <div className="white-content-section" style={{ background: '#FFFFFF' }}>
        {/* Story Carousel - Latest Stories */}
        <StoryCarousel
          entries={latestEntries}
          title="LATEST STORIES"
          onViewEntry={handleViewEntry}
        />

        {/* 3-Column Vanity Fair Layout */}
        <VanityFairLayout
          categoryEntries={categoryEntries}
          latestEntries={latestEntries}
          pinnedStories={pinnedStories}
          pinnedNotes={pinnedNotes}
          pinnedActions={pinnedActions}
          onViewEntry={handleViewEntry}
        />

        <footer>
          <p>&copy; 2025 Personal Press. Your story, your way.</p>
        </footer>
      </div>

      {/* Floating Action Button for Quick Capture */}
      <CaptureFAB onEntryCreated={handleEntryCreated} userId={userId} />

      {/* Legacy form modal - kept as backup, triggered by header button */}
      {showForm && (
        <EntryFormModal onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
      )}

      {selectedEntry && (
        <EntryModal
          entry={selectedEntry}
          onClose={handleCloseModal}
          onGenerateVersions={handleGenerateVersions}
          onDeleteEntry={handleDeleteEntry}
          onPhotoUpdated={handlePhotoUpdated}
          onPinToggled={handlePinToggled}
        />
      )}
    </div>
  )
}

