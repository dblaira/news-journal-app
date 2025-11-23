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
          <h3>Latest Stories</h3>
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
              Your latest stories will appear once you add entries.
            </li>
          ) : (
            trending.map((entry, index) => (
              <li key={entry.id} className="trending-item">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                  <span className="category-label" style={{ fontSize: '0.7rem', letterSpacing: '0.1rem', fontWeight: 700 }}>
                    {entry.category}
                  </span>
                  <button
                    type="button"
                    className="trending-headline"
                    onClick={() => onViewEntry(entry.id)}
                  >
                    {entry.headline}
                  </button>
                  <span className="trending-meta">
                    {formatEntryDateShort(entry.created_at)}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </aside>
  )
}

