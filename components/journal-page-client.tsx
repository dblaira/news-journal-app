'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Entry, WeeklyTheme, EntryType } from '@/types'
import { Header } from './header'
import { DesktopSidebar } from './desktop-sidebar'
import { ContentHeader } from './content-header'
import { ActionsContent } from './actions-content'
import { NotesContent } from './notes-content'
import { StoryContent } from './story-content'
import { CategoryNav } from './category-nav'
import { HeroStory } from './hero-story'
import { VanityFairLayout } from './vanity-fair-layout'
import { ConnectionsContent } from './connections-content'
import { StoryCarousel } from './story-carousel'
import { TimelineView } from './timeline-view'
import { SearchChat } from './search-chat'
import { WorkoutProgram } from './workout-program'
import { EntryFormModal } from './entry-form-modal'
import { EntryModal } from './entry-modal'
import { CaptureFAB } from './capture-fab'
import { deleteEntry, updateEntryVersions, generateWeeklyTheme, toggleActionComplete, createLinkedEntry } from '@/app/actions/entries'
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
  const [currentFilter, setCurrentFilter] = useState('all') // Life area filter (persists across entry types)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [showForm, setShowForm] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [isGeneratingVersions, setIsGeneratingVersions] = useState<string | null>(null)
  const [weeklyTheme, setWeeklyTheme] = useState<WeeklyTheme | null>(initialWeeklyTheme || null)
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false)
  const [currentEntryType, setCurrentEntryType] = useState<EntryType | null>('story') // Default to story view
  const [sidebarExpanded, setSidebarExpanded] = useState(true) // Desktop sidebar expansion state
  const [showTimeline, setShowTimeline] = useState(false) // Timeline/archive view
  const [showChatSearch, setShowChatSearch] = useState(false) // AI chat search panel
  const [whatChangedPrompt, setWhatChangedPrompt] = useState<{ entryId: string; headline: string; category: Entry['category'] } | null>(null)

  // Calculate action count for sidebar badge
  const actionCount = entries.filter(e => 
    e.entry_type === 'action' && 
    !e.completed_at &&
    (currentFilter === 'all' || e.category.toLowerCase() === currentFilter.toLowerCase())
  ).length

  // Filter entries
  let filtered = [...entries]
  if (currentFilter !== 'all') {
    filtered = filtered.filter(
      (entry) => entry.category.toLowerCase() === currentFilter.toLowerCase()
    )
  }
  if (currentEntryType) {
    filtered = filtered.filter(
      (entry) => entry.entry_type === currentEntryType
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

  const handleContentUpdated = (entryId: string, content: string) => {
    // Update entry in local state
    const updatedEntries = entries.map((e) =>
      e.id === entryId ? { ...e, content } : e
    )
    setEntries(updatedEntries)

    // Update selected entry if it's the one being modified
    if (selectedEntry?.id === entryId) {
      setSelectedEntry({ ...selectedEntry, content })
    }
    // Note: Removed router.refresh() here as it was causing edit mode issues
    // The local state update is sufficient for the current view
  }

  const handleEntryUpdated = (entryId: string, updates: Partial<Entry>) => {
    // Update entry in local state
    const updatedEntries = entries.map((e) =>
      e.id === entryId ? { ...e, ...updates } : e
    )
    setEntries(updatedEntries)
    
    // Update selected entry if it's the one being modified
    if (selectedEntry?.id === entryId) {
      setSelectedEntry({ ...selectedEntry, ...updates })
    }
    
    // Refresh to update all views
    router.refresh()
  }

  const handleToggleComplete = async (entryId: string) => {
    // Optimistically update local state
    const entry = entries.find(e => e.id === entryId)
    if (!entry) return

    const newCompletedAt = entry.completed_at ? null : new Date().toISOString()
    
    // Update local state immediately for instant UI feedback
    const updatedEntries = entries.map((e) =>
      e.id === entryId ? { ...e, completed_at: newCompletedAt } : e
    )
    setEntries(updatedEntries)

    // Update selected entry if it's the one being toggled
    if (selectedEntry?.id === entryId) {
      setSelectedEntry({ ...selectedEntry, completed_at: newCompletedAt })
    }

    // Call server action
    const result = await toggleActionComplete(entryId)
    
    if (result.error) {
      // Revert on error
      setEntries(entries)
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(entry)
      }
      alert(`Failed to update: ${result.error}`)
      return
    }

    // "What changed?" prompt — only when completing (not un-completing)
    if (newCompletedAt && entry.entry_type === 'action') {
      setWhatChangedPrompt({
        entryId: entry.id,
        headline: entry.headline,
        category: entry.category,
      })
    }

    // Refresh to ensure server state is synced
    router.refresh()
  }

  const handleToggleTimeline = () => {
    setShowTimeline((prev) => !prev)
  }

  const handleOpenChat = () => {
    setShowChatSearch(true)
  }

  const handleCloseChat = () => {
    setShowChatSearch(false)
  }

  // Render desktop content based on entry type selection
  const renderDesktopContent = () => {
    // Fitness theme shows workout program
    if (currentFilter === 'Fitness') {
      return <WorkoutProgram />
    }
    // Timeline view takes priority when active
    if (showTimeline) {
      return (
        <TimelineView
          entries={entries}
          lifeArea={currentFilter}
          entryType={currentEntryType}
          searchQuery={searchQuery}
          onViewEntry={handleViewEntry}
        />
      )
    }

    switch (currentEntryType) {
      case 'action':
        return (
          <ActionsContent
            entries={entries}
            lifeArea={currentFilter}
            onViewEntry={handleViewEntry}
            onToggleComplete={handleToggleComplete}
          />
        )
      case 'note':
        return (
          <NotesContent
            entries={entries}
            lifeArea={currentFilter}
            onViewEntry={handleViewEntry}
          />
        )
      case 'connection':
        return (
          <ConnectionsContent
            entries={entries}
            lifeArea={currentFilter}
            onViewEntry={handleViewEntry}
          />
        )
      case 'story':
      default:
        return (
          <StoryContent
            entries={entries}
            lifeArea={currentFilter}
            onViewEntry={handleViewEntry}
            onCreateEntry={handleCreateEntry}
            onGenerateVersions={handleGenerateVersions}
            categoryEntries={categoryEntries}
            latestEntries={latestEntries}
            pinnedStories={pinnedStories}
            pinnedNotes={pinnedNotes}
            pinnedActions={pinnedActions}
            onNavigateToSection={(type) => setCurrentEntryType(type)}
          />
        )
    }
  }

  return (
    <div className="page-shell">
      {/* Desktop Sidebar - CSS hides on mobile */}
      <DesktopSidebar
        currentLifeArea={currentFilter}
        onLifeAreaChange={setCurrentFilter}
        currentEntryType={currentEntryType}
        onEntryTypeChange={setCurrentEntryType}
        onCompose={handleCreateEntry}
        onLogout={handleLogout}
        actionCount={actionCount}
        isExpanded={sidebarExpanded}
        onExpandedChange={setSidebarExpanded}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showTimeline={showTimeline}
        onToggleTimeline={handleToggleTimeline}
        onOpenChat={handleOpenChat}
        onGenerateWeeklyTheme={handleGenerateWeeklyTheme}
        isGeneratingTheme={isGeneratingTheme}
        hasWeeklyTheme={!!weeklyTheme}
      />

      {/* Header - hidden on lg+ (desktop uses sidebar) */}
      <div className="lg:hidden">
        <Header 
          issueTagline={issueTagline} 
          onNewEntry={handleCreateEntry}
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          currentEntryType={currentEntryType}
          onEntryTypeChange={(type) => setCurrentEntryType(type as EntryType | null)}
          onLogout={handleLogout}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenChat={handleOpenChat}
          showTimeline={showTimeline}
          onToggleTimeline={handleToggleTimeline}
        />
      </div>

      {/* Desktop Main Content Area - hidden on mobile, shown on lg+ */}
      <main className={`hidden lg:block min-h-screen transition-[margin] duration-300 ${
        sidebarExpanded ? 'lg:ml-[260px]' : 'lg:ml-[64px]'
      }`}>
        {/* Desktop Content Header with Breadcrumb (non-section views only) */}
        {currentEntryType !== 'story' && currentEntryType !== 'note' && currentEntryType !== 'connection' && currentEntryType !== 'action' && currentFilter !== 'Fitness' && (
          <ContentHeader
            entryType={currentEntryType}
            lifeArea={currentFilter}
            issueTagline={issueTagline}
          />
        )}

        {/* Desktop Content */}
        <div
          className={currentEntryType !== 'story' && currentEntryType !== 'note' && currentEntryType !== 'connection' && currentEntryType !== 'action' && currentFilter !== 'Fitness' && !showTimeline ? 'desktop-content-padded' : ''}
        >
          {renderDesktopContent()}
        </div>

        {/* Footer for desktop views not handled by section layouts (not Fitness) */}
        {currentEntryType !== 'story' && currentEntryType !== 'note' && currentEntryType !== 'connection' && currentEntryType !== 'action' && currentFilter !== 'Fitness' && (
          <footer className="desktop-footer">
            <p>&copy; 2025 Understood.</p>
          </footer>
        )}
      </main>

      {/* Mobile Main Content Area - shown on mobile, hidden on lg+ */}
      <main className="block lg:hidden">
        <CategoryNav
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
        />

        {currentFilter === 'Fitness' ? (
          <WorkoutProgram />
        ) : (
          <>
        <div className="hero-section-wrapper">
          <HeroStory
            entry={filtered[0] || null}
            onCreateEntry={handleCreateEntry}
            onViewEntry={handleViewEntry}
            onGenerateVersions={handleGenerateVersions}
          />
        </div>

        {/* Story Carousel - Latest Stories (directly after hero) */}
        <StoryCarousel
          entries={latestEntries}
          title="LATEST STORIES"
          onViewEntry={handleViewEntry}
        />

        {/* WHITE SECTION - Category Layout, Footer */}
        <div className="white-content-section" style={{ background: '#FFFFFF' }}>
          <VanityFairLayout
            categoryEntries={categoryEntries}
            latestEntries={latestEntries}
            pinnedStories={pinnedStories}
            pinnedNotes={pinnedNotes}
            pinnedActions={pinnedActions}
            onViewEntry={handleViewEntry}
            onNavigateToSection={(type) => setCurrentEntryType(type)}
          />

          <footer>
            <p>&copy; 2025 Understood.</p>
          </footer>
        </div>
          </>
        )}
      </main>

      {/* Floating Action Button for Quick Capture */}
      <CaptureFAB onEntryCreated={handleEntryCreated} userId={userId} />

      {/* Legacy form modal - kept as backup, triggered by header button */}
      {showForm && (
        <EntryFormModal onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
      )}

      {selectedEntry && (
        <EntryModal
          key={selectedEntry.id}
          entry={selectedEntry}
          onClose={handleCloseModal}
          onGenerateVersions={handleGenerateVersions}
          onDeleteEntry={handleDeleteEntry}
          onPhotoUpdated={handlePhotoUpdated}
          onPinToggled={handlePinToggled}
          onContentUpdated={handleContentUpdated}
          onEntryUpdated={handleEntryUpdated}
          onViewEntry={(entryId) => {
            const target = entries.find((e) => e.id === entryId)
            if (target) {
              setSelectedEntry(target)
            }
          }}
          onEntryCreated={(newEntry) => {
            setEntries((prev) => [newEntry, ...prev])
          }}
        />
      )}

      {/* "What changed?" prompt after completing an Action */}
      {whatChangedPrompt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setWhatChangedPrompt(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              animation: 'toolbar-pop-in 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🏔️</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111' }}>
                What Changed?
              </h3>
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: '0.5rem 0 1.25rem', lineHeight: 1.5 }}>
              You completed <strong>&ldquo;{whatChangedPrompt.headline}&rdquo;</strong>.
              <br />Write the new story — what&rsquo;s different now?
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const form = e.currentTarget
                const headline = (form.elements.namedItem('headline') as HTMLInputElement).value.trim()
                const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value.trim()
                if (!headline) return

                const result = await createLinkedEntry(whatChangedPrompt.entryId, {
                  headline,
                  content: content || `Completing "${whatChangedPrompt.headline}" changed things.\n\n`,
                  entry_type: 'story',
                  category: whatChangedPrompt.category,
                })

                if (result.data) {
                  setEntries((prev) => [result.data as Entry, ...prev])
                  setSelectedEntry(result.data as Entry)
                }
                setWhatChangedPrompt(null)
              }}
            >
              <input
                name="headline"
                type="text"
                placeholder="Headline for the new story..."
                defaultValue={`After: ${whatChangedPrompt.headline}`}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  outline: 'none',
                  marginBottom: '0.75rem',
                  boxSizing: 'border-box',
                }}
              />
              <textarea
                name="content"
                placeholder="What's different now? (optional — you can flesh it out later)"
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  fontSize: '0.85rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  outline: 'none',
                  resize: 'vertical',
                  marginBottom: '1rem',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setWhatChangedPrompt(null)}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background: 'transparent',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#6B7280',
                  }}
                >
                  Skip for Now
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: '#DC143C',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    letterSpacing: '0.03rem',
                  }}
                >
                  Write the Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Chat Search Panel */}
      {showChatSearch && (
        <SearchChat
          userId={userId}
          entries={entries}
          onClose={handleCloseChat}
          onViewEntry={(id: string) => {
            handleViewEntry(id)
            setShowChatSearch(false)
          }}
        />
      )}
    </div>
  )
}

