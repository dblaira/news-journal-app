'use client'

import { useState } from 'react'
import { Entry, ConnectionType } from '@/types'
import { stripHtml } from '@/lib/utils'
import { getEntryPosterWithFocalPoint } from '@/lib/utils/entry-images'

interface ConnectionHeroProps {
  connection: Entry | null
  totalCount: number
  lifeArea: string
  entryLookup: Map<string, Entry>
}

const CONNECTION_TYPE_META: Record<ConnectionType, { icon: string; label: string }> = {
  identity_anchor: { icon: '\u{1FA9E}', label: 'Identity Anchor' },
  pattern_interrupt: { icon: '\u26A1', label: 'Pattern Interrupt' },
  validated_principle: { icon: '\u{1F511}', label: 'Validated Principle' },
  process_anchor: { icon: '\u{1F504}', label: 'Process Anchor' },
}

function getTodayFormatted(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function ConnectionHero({ connection, totalCount, lifeArea, entryLookup }: ConnectionHeroProps) {
  const [imageError, setImageError] = useState(false)
  const plainContent = connection ? stripHtml(connection.content).trim() : ''
  const meta = connection?.connection_type ? CONNECTION_TYPE_META[connection.connection_type] : null

  const sourceEntry = connection?.source_entry_id ? entryLookup.get(connection.source_entry_id) : undefined
  const { url: imageUrl, objectPosition } = sourceEntry ? getEntryPosterWithFocalPoint(sourceEntry) : { url: undefined, objectPosition: '50% 50%' }
  const hasImage = !!imageUrl && !imageError

  return (
    <section style={{ width: '100%' }}>
      {/* Top -- Beige branding area */}
      <div style={{
        background: '#E8E2D8',
        width: '100%',
        padding: '3rem 3rem 2.5rem',
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          fontSize: '0.75rem',
          letterSpacing: '0.1rem',
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: '1.5rem',
        }}>
          <span style={{ color: '#DC143C' }}>
            {lifeArea === 'all' ? 'All Areas' : lifeArea}
          </span>
          <span style={{ color: '#8B8178' }}>
            {getTodayFormatted()}
          </span>
        </div>

        <h1 style={{
          fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
          fontSize: 'clamp(3rem, 6vw, 5rem)',
          fontWeight: 400,
          color: '#DC143C',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          margin: 0,
        }}>
          Connections
        </h1>
      </div>

      {/* Bottom -- Black featured quote area (split layout when image available) */}
      <div style={{
        background: '#000000',
        width: '100%',
        borderTop: '3px solid #DC143C',
        display: 'grid',
        gridTemplateColumns: hasImage ? '1fr 1fr' : '1fr',
        minHeight: hasImage ? '360px' : '200px',
      }}>
        {/* Quote side */}
        <div style={{
          padding: '2.5rem 3rem',
          display: 'flex',
          alignItems: 'center',
        }}>
          {connection ? (
            <div>
              <blockquote style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: plainContent.length < 80 ? 'clamp(1.4rem, 2.5vw, 1.8rem)' : 'clamp(1.1rem, 2vw, 1.4rem)',
                fontWeight: 400,
                fontStyle: 'italic',
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 1.6,
                margin: 0,
                padding: 0,
                borderLeft: '3px solid #DC143C',
                paddingLeft: '1.5rem',
                maxWidth: '640px',
              }}>
                &ldquo;{plainContent.length > 200 ? plainContent.slice(0, 200) + '...' : plainContent}&rdquo;
              </blockquote>

              {meta && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '1rem',
                  paddingLeft: '1.5rem',
                  fontSize: '0.8rem',
                  color: 'rgba(255, 255, 255, 0.45)',
                  fontWeight: 500,
                }}>
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </div>
              )}
            </div>
          ) : (
            <p style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: '1.2rem',
              color: 'rgba(255, 255, 255, 0.4)',
              fontStyle: 'italic',
              lineHeight: 1.6,
            }}>
              Select text in any entry and tap Connect to start building your belief library.
            </p>
          )}
        </div>

        {/* Image side */}
        {hasImage && (
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            minHeight: '360px',
          }}>
            <img
              src={imageUrl}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition,
                display: 'block',
                filter: 'saturate(1.1)',
              }}
              onError={() => setImageError(true)}
            />
          </div>
        )}
      </div>
    </section>
  )
}
