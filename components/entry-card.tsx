'use client'

import { Entry } from '@/types'
import { formatEntryDateLong, formatEntryDateShort, truncate } from '@/lib/utils'
import { getCategoryImage } from '@/lib/mindset'

interface EntryCardProps {
  entry: Entry
  onView: (id: string) => void
  onGenerateVersions: (id: string) => void
  onDelete: (id: string) => void
}

export function EntryCard({
  entry,
  onView,
  onGenerateVersions,
  onDelete,
}: EntryCardProps) {
  // Debug: Log photo URL if it exists
  if (entry.photo_url) {
    console.log('Entry photo URL:', entry.photo_url, 'for entry:', entry.headline)
  }
  
  const imageUrl = entry.photo_url || getCategoryImage(entry.category)
  const formattedDate = formatEntryDateLong(entry.created_at)
  const shortDate = formatEntryDateShort(entry.created_at)
  const versionBadge =
    entry.generating_versions ? (
      <span className="entry-mood">Generating…</span>
    ) : entry.versions ? (
      <span className="entry-mood">Enhanced</span>
    ) : null

  return (
    <article className="entry-card">
      <div className="entry-card__media">
        <img 
          src={imageUrl} 
          alt={entry.photo_url ? entry.headline : `${entry.category} illustration`}
          onError={(e) => {
            console.error('Image failed to load:', imageUrl)
            // Fallback to category image if photo fails to load
            if (entry.photo_url) {
              e.currentTarget.src = getCategoryImage(entry.category)
            }
          }}
        />
      </div>
      <div className="entry-card__body">
        <div className="entry-card__meta">
          <span>{entry.category}</span>
          <span>{shortDate}</span>
        </div>
        <h3 className="entry-headline">{entry.headline}</h3>
        {entry.subheading && (
          <p className="entry-subheading">{entry.subheading}</p>
        )}
        <p className="entry-content">{truncate(entry.content, 200)}</p>
      </div>
      <div className="entry-footer">
        <div>
          <span className="entry-date">{formattedDate}</span>
          {entry.mood && <span className="entry-mood">{entry.mood}</span>}
          {versionBadge}
        </div>
        <div className="entry-actions">
          {!entry.versions && !entry.generating_versions && (
            <button
              type="button"
              onClick={() => onGenerateVersions(entry.id)}
            >
              ✨ Versions
            </button>
          )}
          <button type="button" onClick={() => onView(entry.id)}>
            Read
          </button>
          <button type="button" onClick={() => onDelete(entry.id)}>
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}

