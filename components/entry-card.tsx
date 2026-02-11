'use client'

import { useState, useEffect } from 'react'
import { Entry, EntryImage } from '@/types'
import { formatEntryDateLong, formatEntryDateShort } from '@/lib/utils'
import { ContextSummaryDisplay } from './context'

// Helper to get poster image URL and focal point from entry (handles both new images array and legacy fields)
// Returns the poster image URL (empty string if no real image) and CSS object-position value
function getEntryPosterWithFocalPoint(entry: Entry): { url: string; objectPosition: string } {
  // Check new images array first
  if (entry.images && entry.images.length > 0) {
    const poster = entry.images.find(img => img.is_poster) || entry.images[0]
    if (poster?.url) {
      const x = poster.focal_x ?? 50
      const y = poster.focal_y ?? 50
      return {
        url: poster.url,
        objectPosition: `${x}% ${y}%`,
      }
    }
  }
  // Fallback to legacy single image fields (no focal point) — no category placeholder
  return {
    url: entry.image_url || entry.photo_url || '',
    objectPosition: '50% 50%',
  }
}

// Helper to get total image count
function getImageCount(entry: Entry): number {
  if (entry.images && entry.images.length > 0) {
    return entry.images.length
  }
  // Legacy: count single image if present
  return (entry.image_url || entry.photo_url) ? 1 : 0
}

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
  
  // Get poster image URL and focal point (handles both new multi-image and legacy single image)
  const { url: imageUrl, objectPosition } = getEntryPosterWithFocalPoint(entry)
  const imageCount = getImageCount(entry)
  const hasMultipleImages = imageCount > 1

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

  const hasRealImage = !!imageUrl && !imageError

  return (
    <article className="entry-card">
      {hasRealImage && (
        <div className="entry-card__media" style={{ position: 'relative' }}>
          <img 
            src={imageUrl} 
            alt={entry.headline}
            loading="lazy"
            crossOrigin="anonymous"
            style={{ objectPosition }}
            onError={() => {
              if (isMounted) setImageError(true)
            }}
          />
          {hasMultipleImages && (
            <div
              style={{
                position: 'absolute',
                bottom: '0.5rem',
                right: '0.5rem',
                background: 'rgba(0, 0, 0, 0.7)',
                color: '#fff',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span>📷</span>
              <span>{imageCount}</span>
            </div>
          )}
        </div>
      )}
      <div className="entry-card__body">
        <div className="entry-card__meta">
          <span className="category-label">{entry.category}</span>
          <span>{shortDate}</span>
        </div>
        
        {/* Context summary - compact inline display */}
        {entry.metadata && (
          <ContextSummaryDisplay 
            metadata={entry.metadata} 
            variant="inline" 
            showLocation={false}
            maxItems={3}
          />
        )}
        
        <h3 className="entry-headline">{entry.headline}</h3>
        {entry.subheading && (
          <p className="entry-subheading">{entry.subheading}</p>
        )}
        <div 
          className="rendered-content card-preview entry-content"
          dangerouslySetInnerHTML={{ __html: entry.content }}
        />
        
        {/* Show extracted purchase/receipt data if available */}
        {entry.image_extracted_data?.purchase?.detected && entry.image_extracted_data.purchase.productName && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem 0.75rem',
              background: 'var(--bg-panel-alt)',
              borderRadius: '6px',
              fontSize: '0.8rem',
              borderLeft: '3px solid var(--accent-crimson)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              💰 {entry.image_extracted_data.purchase.productName}
            </div>
            {(entry.image_extracted_data.purchase.price || entry.image_extracted_data.purchase.seller) && (
              <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                {entry.image_extracted_data.purchase.price && `$${entry.image_extracted_data.purchase.price}`}
                {entry.image_extracted_data.purchase.price && entry.image_extracted_data.purchase.seller && ' • '}
                {entry.image_extracted_data.purchase.seller}
              </div>
            )}
          </div>
        )}
        
        {entry.image_extracted_data?.receipt && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem 0.75rem',
              background: 'var(--bg-panel-alt)',
              borderRadius: '6px',
              fontSize: '0.8rem',
              borderLeft: '3px solid var(--accent-gold)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              🧾 {entry.image_extracted_data.receipt.merchant}
            </div>
            <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
              ${entry.image_extracted_data.receipt.total} • {entry.image_extracted_data.receipt.date}
            </div>
          </div>
        )}
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

