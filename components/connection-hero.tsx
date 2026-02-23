'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Entry } from '@/types'
import { stripHtml } from '@/lib/utils'
import { getEntryPosterWithFocalPoint } from '@/lib/utils/entry-images'

interface ConnectionHeroProps {
  pinnedConnections: Entry[]
  fallbackConnection: Entry | null
  totalCount: number
  lifeArea: string
  entryLookup: Map<string, Entry>
}

function getTodayFormatted(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

const AUTO_ADVANCE_MS = 3500
const SWIPE_THRESHOLD = 40

export function ConnectionHero({ pinnedConnections, fallbackConnection, totalCount, lifeArea, entryLookup }: ConnectionHeroProps) {
  const hasPinned = pinnedConnections.length > 0
  const displayConnections = hasPinned ? pinnedConnections : (fallbackConnection ? [fallbackConnection] : [])
  const showNavigation = displayConnections.length > 1

  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  useEffect(() => {
    setActiveIndex(0)
  }, [pinnedConnections.length])

  useEffect(() => {
    if (!showNavigation || isPaused) return

    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % displayConnections.length)
    }, AUTO_ADVANCE_MS)

    return () => clearInterval(timer)
  }, [showNavigation, isPaused, displayConnections.length])

  const advance = useCallback((direction: 1 | -1) => {
    setActiveIndex(prev => {
      const next = prev + direction
      if (next < 0) return displayConnections.length - 1
      if (next >= displayConnections.length) return 0
      return next
    })
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), AUTO_ADVANCE_MS * 2)
  }, [displayConnections.length])

  const goTo = useCallback((index: number) => {
    setActiveIndex(index)
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), AUTO_ADVANCE_MS * 2)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current

    // Only trigger if horizontal swipe is dominant
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
      advance(dx < 0 ? 1 : -1)
    }
    touchStartX.current = null
    touchStartY.current = null
  }, [advance])

  const activeConnection = displayConnections[activeIndex] || null
  const plainContent = activeConnection ? stripHtml(activeConnection.content).trim() : ''

  const sourceEntry = activeConnection?.source_entry_id ? entryLookup.get(activeConnection.source_entry_id) : undefined
  const { url: imageUrl, objectPosition } = sourceEntry ? getEntryPosterWithFocalPoint(sourceEntry) : { url: undefined, objectPosition: '50% 50%' }
  const hasImage = !!imageUrl && !imageErrors.has(activeConnection?.id || '')

  return (
    <section style={{ width: '100%' }}>
      {/* Top -- Beige branding area */}
      <div className="px-4 md:px-6" style={{
        background: '#E8E2D8',
        width: '100%',
        paddingTop: '2rem',
        paddingBottom: '2rem',
      }}>
        <h1 style={{
          fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
          fontSize: 'clamp(3.5rem, 8vw, 5.5rem)',
          fontWeight: 400,
          color: '#DC143C',
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          margin: 0,
          marginBottom: '0.1rem',
        }}>
          Connections
        </h1>

        <span style={{
          fontSize: '0.75rem',
          letterSpacing: '0.1rem',
          textTransform: 'uppercase',
          fontWeight: 600,
          color: '#8B8178',
          display: 'block',
          marginLeft: 'clamp(2.5rem, 5.71vw, 3.93rem)',
        }}>
          {getTodayFormatted()}
        </span>
      </div>

      {/* Featured quote area */}
      <div
        style={{
          background: '#FFFFFF',
          width: '100%',
          borderTop: '3px solid #DC143C',
          display: 'grid',
          gridTemplateColumns: hasImage ? '1fr 1fr' : '1fr',
          minHeight: hasImage ? '360px' : '200px',
          position: 'relative',
          touchAction: showNavigation ? 'pan-y' : 'auto',
          userSelect: 'none',
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={showNavigation ? handleTouchStart : undefined}
        onTouchEnd={showNavigation ? handleTouchEnd : undefined}
      >
        {/* Quote side */}
        <div className="px-4 md:px-6" style={{
          paddingTop: '2.5rem',
          paddingBottom: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          {activeConnection ? (
            <div style={{ transition: 'opacity 0.3s ease', opacity: 1 }}>
              <blockquote style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: plainContent.length < 80 ? 'clamp(1.8rem, 3.5vw, 2.4rem)' : 'clamp(1.4rem, 2.5vw, 1.8rem)',
                fontWeight: 400,
                fontStyle: 'italic',
                color: '#1A1A1A',
                lineHeight: 1.6,
                margin: 0,
                padding: 0,
                borderLeft: '3px solid #DC143C',
                paddingLeft: '1.5rem',
                maxWidth: '640px',
              }}>
                &ldquo;{plainContent.length > 200 ? plainContent.slice(0, 200) + '...' : plainContent}&rdquo;
              </blockquote>

              {/* Dot navigation with page counter */}
              {showNavigation && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '1.5rem',
                  paddingLeft: '1.5rem',
                }}>
                  {displayConnections.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goTo(index)}
                      style={{
                        width: index === activeIndex ? '28px' : '10px',
                        height: '10px',
                        borderRadius: '5px',
                        border: 'none',
                        background: index === activeIndex ? '#DC143C' : 'rgba(0, 0, 0, 0.15)',
                        cursor: 'pointer',
                        padding: '8px 0',
                        boxSizing: 'content-box',
                        backgroundClip: 'content-box',
                        transition: 'all 0.2s ease',
                      }}
                      aria-label={`Go to pinned connection ${index + 1}`}
                    />
                  ))}
                  {pinnedConnections.length > 1 && (
                    <span style={{
                      fontSize: '0.7rem',
                      color: 'rgba(0, 0, 0, 0.3)',
                      fontWeight: 500,
                      marginLeft: '0.25rem',
                    }}>
                      {activeIndex + 1} / {pinnedConnections.length}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: '1.2rem',
              color: 'rgba(0, 0, 0, 0.4)',
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
              onError={() => {
                if (activeConnection) {
                  setImageErrors(prev => new Set(prev).add(activeConnection.id))
                }
              }}
            />
          </div>
        )}
      </div>
    </section>
  )
}
