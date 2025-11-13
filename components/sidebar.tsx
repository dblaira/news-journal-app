'use client'

import { Entry } from '@/types'
import { formatEntryDateShort, truncate } from '@/lib/utils'

interface SidebarProps {
  trendingEntries: Entry[]
  quickNotesEntries: Entry[]
  onViewEntry: (id: string) => void
}

export function Sidebar({ trendingEntries, quickNotesEntries, onViewEntry }: SidebarProps) {
  const trending = trendingEntries.slice(0, 6)
  const notes = quickNotesEntries.slice(0, 3)

  return (
    <aside className="sidebar">
      <div className="sidebar-block">
        <div className="sidebar-header">
          <h3>Trending Headlines</h3>
          <button
            className="sidebar-view-all"
            type="button"
            onClick={() => {
              document
                .querySelector('.latest-section')
                ?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            View all
          </button>
        </div>
        <ul className="trending-list">
          {trending.length === 0 ? (
            <li className="trending-empty">
              Your trending stories will appear once you add entries.
            </li>
          ) : (
            trending.map((entry, index) => (
              <li key={entry.id} className="trending-item">
                <span className="trending-rank">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <button
                    type="button"
                    className="trending-headline"
                    onClick={() => onViewEntry(entry.id)}
                  >
                    {entry.headline}
                  </button>
                  <span className="trending-meta">
                    {formatEntryDateShort(entry.created_at)} · {entry.category}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
      <div className="sidebar-block">
        <h3>Quick Notes</h3>
        <div className="quick-notes">
          {notes.length === 0 ? (
            <p className="empty-note">
              No notes yet. Create an entry to light up this space.
            </p>
          ) : (
            notes.map((entry) => (
              <article key={entry.id} className="quick-note">
                <strong>
                  {entry.category}
                  {entry.isSample ? ' · Preview' : ''}
                </strong>
                {entry.subheading && ` — ${entry.subheading}`}
                <br />
                {truncate(entry.content, 120)}
              </article>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}

