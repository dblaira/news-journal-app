'use client'

import { Entry } from '@/types'
import { formatEntryDateShort, truncateHtml } from '@/lib/utils'
import { getEntryPosterWithFocalPoint } from '@/lib/utils/entry-images'

interface FeatureGridProps {
  entries: Entry[]
  onViewEntry: (id: string) => void
}

export function FeatureGrid({ entries, onViewEntry }: FeatureGridProps) {
  const featured = entries.slice(0, 3)

  if (!featured.length) {
    return null
  }

  return (
    <div className="feature-column">
      <div className="feature-grid">
        {featured.map((entry) => {
          const { url: imageUrl, objectPosition } = getEntryPosterWithFocalPoint(entry)
          const hasRealImage = !!imageUrl

          return (
            <article key={entry.id} className="feature-card">
              {hasRealImage && (
                <div className="feature-card__image">
                  <img
                    src={imageUrl}
                    alt={entry.headline}
                    style={{ objectFit: 'cover', objectPosition }}
                  />
                </div>
              )}
              <div className="story-meta">
                <span className="category-label">{entry.category}</span>
                <span>{formatEntryDateShort(entry.created_at)}</span>
              </div>
              <h3>{entry.headline}</h3>
              <p>{truncateHtml(entry.content, 140)}</p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onViewEntry(entry.id)}
              >
                Open Story
              </button>
            </article>
          )
        })}
      </div>
    </div>
  )
}

