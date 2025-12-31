'use client'

import { useState, useEffect } from 'react'
import { Entry } from '@/types'
import { formatEntryDateLong, formatEntryDateShort, truncateHtml } from '@/lib/utils'
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
  const [imageError, setImageError] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const imageUrl = entry.photo_url || getCategoryImage(entry.category)

  useEffect(() => {
    setIsMounted(true)
  }, [])
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
        {imageError ? (
          <div style={{
            width: '100%',
            height: '200px',
            background: 'var(--bg-panel-alt)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            borderRadius: 'var(--radius-sm)',
          }}>
            Image unavailable
          </div>
        ) : (
          <img 
            src={imageUrl} 
            alt={entry.photo_url ? entry.headline : `${entry.category} illustration`}
            loading="lazy"
            crossOrigin="anonymous"
            onError={(e) => {
              // Only handle errors after component is mounted to avoid hydration issues
              if (isMounted) {
                console.error('Image failed to load:', imageUrl, 'Entry:', entry.headline)
                setImageError(true)
              }
            }}
            onLoad={() => {
              if (entry.photo_url) {
                console.log('Photo loaded successfully:', imageUrl)
              }
            }}
          />
        )}
      </div>
      <div className="entry-card__body">
        <div className="entry-card__meta">
          <span className="category-label">{entry.category}</span>
          <span>{shortDate}</span>
        </div>
        <h3 className="entry-headline">{entry.headline}</h3>
        {entry.subheading && (
          <p className="entry-subheading">{entry.subheading}</p>
        )}
        <p className="entry-content">{truncateHtml(entry.content, 200)}</p>
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

