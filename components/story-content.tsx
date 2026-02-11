'use client'

import { Entry } from '@/types'
import { HeroStory } from './hero-story'
import { StoryCarousel } from './story-carousel'
import { VanityFairLayout } from './vanity-fair-layout'

interface StoryContentProps {
  entries: Entry[]
  lifeArea: string
  onViewEntry: (id: string) => void
  onCreateEntry: () => void
  onGenerateVersions: (id: string) => void
  categoryEntries: Entry[]
  latestEntries: Entry[]
  pinnedStories: Entry[]
  pinnedNotes: Entry[]
  pinnedActions: Entry[]
  onNavigateToSection?: (entryType: 'story' | 'note' | 'action') => void
}

export function StoryContent({
  entries,
  lifeArea,
  onViewEntry,
  onCreateEntry,
  onGenerateVersions,
  categoryEntries,
  latestEntries,
  pinnedStories,
  pinnedNotes,
  pinnedActions,
  onNavigateToSection,
}: StoryContentProps) {
  // Filter stories by life area
  let filtered = entries.filter(e => (e.entry_type || 'story') === 'story')
  if (lifeArea !== 'all') {
    filtered = filtered.filter(e => e.category.toLowerCase() === lifeArea.toLowerCase())
  }

  // Also filter categoryEntries and latestEntries by life area
  let filteredCategoryEntries = categoryEntries
  let filteredLatestEntries = latestEntries
  if (lifeArea !== 'all') {
    filteredCategoryEntries = categoryEntries.filter(e => e.category.toLowerCase() === lifeArea.toLowerCase())
    filteredLatestEntries = latestEntries.filter(e => e.category.toLowerCase() === lifeArea.toLowerCase())
  }

  const hasStories = filtered.length > 0

  if (!hasStories) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>📰</div>
        <h3 style={{ margin: '0 0 0.5rem', color: '#1F2937', fontSize: '1.1rem', fontWeight: 600 }}>
          No stories yet
        </h3>
        <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>
          Create your first story to start building your personal press.
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: '#000000' }}>
      {/* Hero Section */}
      <div className="hero-section-wrapper">
        <HeroStory
          entry={filtered[0] || null}
          onCreateEntry={onCreateEntry}
          onViewEntry={onViewEntry}
          onGenerateVersions={onGenerateVersions}
        />
      </div>

      {/* Story Carousel - Latest Stories (directly after hero) */}
      <StoryCarousel
        entries={filteredLatestEntries.filter(e => (e.entry_type || 'story') === 'story')}
        title="LATEST STORIES"
        onViewEntry={onViewEntry}
      />

      {/* WHITE SECTION - Category Layout */}
      <div className="white-content-section" style={{ background: '#FFFFFF' }}>
        {/* 3-Column Vanity Fair Layout */}
        <VanityFairLayout
          categoryEntries={filteredCategoryEntries}
          latestEntries={filteredLatestEntries}
          pinnedStories={lifeArea === 'all' ? pinnedStories : pinnedStories.filter(e => e.category.toLowerCase() === lifeArea.toLowerCase())}
          pinnedNotes={lifeArea === 'all' ? pinnedNotes : pinnedNotes.filter(e => e.category.toLowerCase() === lifeArea.toLowerCase())}
          pinnedActions={lifeArea === 'all' ? pinnedActions : pinnedActions.filter(e => e.category.toLowerCase() === lifeArea.toLowerCase())}
          onViewEntry={onViewEntry}
          onNavigateToSection={onNavigateToSection}
        />
      </div>
    </div>
  )
}
