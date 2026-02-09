'use client'

import { Entry, WeeklyTheme } from '@/types'
import { HeroStory } from './hero-story'
import { WeeklyThemeBanner } from './weekly-theme-banner'
import { MindsetBanner } from './mindset-banner'
import { StoryCarousel } from './story-carousel'
import { VanityFairLayout } from './vanity-fair-layout'
import { deriveMindsetPreset } from '@/lib/mindset'

interface StoryContentProps {
  entries: Entry[]
  lifeArea: string
  onViewEntry: (id: string) => void
  onCreateEntry: () => void
  onGenerateVersions: (id: string) => void
  weeklyTheme: WeeklyTheme | null
  onViewTheme: (theme: WeeklyTheme) => void
  onGenerateWeeklyTheme: () => void
  isGeneratingTheme: boolean
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
  weeklyTheme,
  onViewTheme,
  onGenerateWeeklyTheme,
  isGeneratingTheme,
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

  // Calculate mindset
  const primaryEntry = filtered[0]
  const mindset = primaryEntry
    ? deriveMindsetPreset(
        (primaryEntry.mood || '').toLowerCase(),
        (primaryEntry.category || '').toLowerCase()
      )
    : {
        headline: 'Calling all Big Wave Riders',
        subtitle: 'Step into the day like it is a headline worth remembering.',
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

      {/* Theme/Mindset Banner */}
      {weeklyTheme ? (
        <WeeklyThemeBanner
          theme={weeklyTheme}
          onViewTheme={onViewTheme}
        />
      ) : (
        <MindsetBanner
          headline={mindset.headline}
          subtitle={mindset.subtitle}
        />
      )}

      {/* Generate Weekly Theme prompt */}
      {entries.length >= 7 && !weeklyTheme && (
        <div style={{ 
          padding: '1.5rem 2rem', 
          textAlign: 'center',
          background: '#F5F0E8',
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
            onClick={onGenerateWeeklyTheme}
            disabled={isGeneratingTheme}
            style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}
          >
            {isGeneratingTheme ? 'Generating...' : '✨ Generate Weekly Theme'}
          </button>
        </div>
      )}

      {/* WHITE SECTION - Latest Stories, Category Layout */}
      <div className="white-content-section" style={{ background: '#FFFFFF' }}>
        {/* Story Carousel - Latest Stories */}
        <StoryCarousel
          entries={filteredLatestEntries.filter(e => (e.entry_type || 'story') === 'story')}
          title="LATEST STORIES"
          onViewEntry={onViewEntry}
        />

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
