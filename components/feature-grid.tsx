'use client'

import { Entry } from '@/types'
import { formatEntryDateShort, truncate } from '@/lib/utils'
import { getCategoryImage } from '@/lib/mindset'

interface FeatureGridProps {
  entries: Entry[]
  onViewEntry: (id: string) => void
}

export function FeatureGrid({ entries, onViewEntry }: FeatureGridProps) {
  const featured = entries.slice(0, 3)

  if (!featured.length) {
    return (
      <div className="feature-column">
        <div className="feature-grid">
          <div className="feature-placeholder">
            Add more entries to populate your featured stories.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="feature-column">
      <div className="feature-grid">
        {featured.map((entry) => (
          <article key={entry.id} className="feature-card">
            <div className="feature-card__image">
              <img
                src={getCategoryImage(entry.category)}
                alt={`${entry.category} feature image`}
              />
            </div>
            <div className="story-meta">
              <span>{entry.category}</span>
              <span>{formatEntryDateShort(entry.created_at)}</span>
            </div>
            <h3>{entry.headline}</h3>
            <p>{truncate(entry.content, 140)}</p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onViewEntry(entry.id)}
            >
              Open Story
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}

