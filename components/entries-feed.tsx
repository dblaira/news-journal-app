'use client'

import { Entry } from '@/types'
import { EntryCard } from './entry-card'

interface EntriesFeedProps {
  entries: Entry[]
  onViewEntry: (id: string) => void
  onGenerateVersions: (id: string) => void
  onDeleteEntry: (id: string) => void
}

export function EntriesFeed({
  entries,
  onViewEntry,
  onGenerateVersions,
  onDeleteEntry,
}: EntriesFeedProps) {
  // Skip first 4 entries (they're shown in hero/features)
  const remainder = entries.slice(4)

  if (remainder.length === 0) {
    return (
      <div className="entries-feed">
        <div className="empty-state">
          <h2>Front page is set</h2>
          <p>Add more entries to expand your latest dispatches.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="entries-feed">
      {remainder.map((entry) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          onView={onViewEntry}
          onGenerateVersions={onGenerateVersions}
          onDelete={onDeleteEntry}
        />
      ))}
    </div>
  )
}

