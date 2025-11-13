'use client'

import { Entry } from '@/types'
import { formatEntryDateLong, truncate } from '@/lib/utils'
import { getCategoryImage } from '@/lib/mindset'

interface HeroStoryProps {
  entry: Entry | null
  onCreateEntry: () => void
  onViewEntry: (id: string) => void
  onGenerateVersions: (id: string) => void
}

export function HeroStory({
  entry,
  onCreateEntry,
  onViewEntry,
  onGenerateVersions,
}: HeroStoryProps) {
  if (!entry) {
    return (
      <section className="hero-section">
        <div className="hero-card hero-card--placeholder">
          <div className="hero-card__content">
            <span className="badge">Start here</span>
            <h1>Write your first headline</h1>
            <p>Capture a moment from today and let your newsroom spring to life.</p>
            <div className="hero-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={onCreateEntry}
              >
                Create Entry
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const imageUrl = getCategoryImage(entry.category)
  const formattedDate = formatEntryDateLong(entry.created_at)

  return (
    <section className="hero-section">
      <div className="hero-card">
        <div className="hero-card__media">
          <img src={imageUrl} alt={`${entry.category} feature image`} />
        </div>
        <div className="hero-card__content">
          <div className="hero-card__meta">
            <span>{entry.category}</span>
            <span>{formattedDate}</span>
          </div>
          <span className="badge">Top Story</span>
          <h1>{entry.headline}</h1>
          {entry.subheading && <p>{entry.subheading}</p>}
          <p>{truncate(entry.content, 260)}</p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => onViewEntry(entry.id)}
            >
              Read Story
            </button>
            {!entry.versions && !entry.generating_versions && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onGenerateVersions(entry.id)}
              >
                ✨ Generate Versions
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

