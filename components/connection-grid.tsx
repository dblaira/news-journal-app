'use client'

import { Entry } from '@/types'
import { truncateHtml } from '@/lib/utils'

interface ConnectionGridProps {
  entries: Entry[]
  onViewEntry: (id: string) => void
}

export function ConnectionGrid({ entries, onViewEntry }: ConnectionGridProps) {
  const categoriesInOrder = [
    'Business',
    'Finance',
    'Health',
    'Spiritual',
    'Fun',
    'Social',
    'Romance',
  ]

  const featured = categoriesInOrder
    .map((category) =>
      entries.find(
        (entry) => entry.category.toLowerCase() === category.toLowerCase()
      )
    )
    .filter((entry): entry is Entry => Boolean(entry))
    .slice(0, 4)

  if (!featured.length) {
    return (
      <div className="connection-grid">
        <div className="connection-placeholder">
          <p>
            Entries from different categories will gather here to reveal the
            bigger picture.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="connection-grid">
      {featured.map((entry) => (
        <article key={entry.id} className="connection-card">
          <span className="badge">{entry.category}</span>
          <h3>{entry.headline}</h3>
          <p>{truncateHtml(entry.content, 160)}</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onViewEntry(entry.id)}
          >
            Open Dispatch
          </button>
        </article>
      ))}
    </div>
  )
}

