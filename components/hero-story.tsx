'use client'

import { useState, useEffect } from 'react'
import { Entry } from '@/types'
import { formatEntryDateLong } from '@/lib/utils'
import { getEntryPosterWithFocalPoint } from '@/lib/utils/entry-images'

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
  const [imageError, setImageError] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])
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
          <div className="hero-card__media" style={{ background: '#111' }}></div>
        </div>
      </section>
    )
  }

  // Get poster image with focal point support — no category placeholder
  const { url: posterUrl, objectPosition } = getEntryPosterWithFocalPoint(entry)
  const imageUrl = posterUrl || ''
  const hasRealImage = !!imageUrl && !imageError
  const formattedDate = formatEntryDateLong(entry.created_at)

  return (
    <section className="hero-section">
      <div className="hero-card">
        <div className="hero-card__content">
          <div className="hero-card__meta">
            <span className="category-label">{entry.category}</span>
            <span>{formattedDate}</span>
          </div>
          <h1>{entry.headline}</h1>
          {entry.subheading && <p style={{ fontSize: '1.2rem', fontStyle: 'italic', marginTop: '0.5rem' }}>{entry.subheading}</p>}
          <div 
            className="rendered-content hero-preview"
            style={{ marginTop: '1rem' }}
            dangerouslySetInnerHTML={{ __html: entry.content }}
          />
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
                style={{ color: 'var(--text-hero)', borderColor: 'rgba(255,255,255,0.3)' }}
              >
                ✨ Generate Versions
              </button>
            )}
          </div>
        </div>
        {hasRealImage ? (
          <div className="hero-card__media">
            <img 
              src={imageUrl} 
              alt={entry.headline}
              loading="lazy"
              style={{ objectPosition }}
              onError={() => {
                if (isMounted) setImageError(true)
              }}
            />
          </div>
        ) : (
          <div className="hero-card__media" style={{ background: '#111' }}></div>
        )}
      </div>
    </section>
  )
}

