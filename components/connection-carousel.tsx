'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Entry, ConnectionType } from '@/types'
import { stripHtml } from '@/lib/utils'
import { getEntryPosterWithFocalPoint } from '@/lib/utils/entry-images'

interface ConnectionCarouselProps {
  connections: Entry[]
  onViewEntry?: (id: string) => void
  entryLookup: Map<string, Entry>
}

const CONNECTION_TYPE_META: Record<ConnectionType, { icon: string; label: string }> = {
  identity_anchor: { icon: '\u{1FA9E}', label: 'Identity Anchor' },
  pattern_interrupt: { icon: '\u26A1', label: 'Pattern Interrupt' },
  validated_principle: { icon: '\u{1F511}', label: 'Validated Principle' },
  process_anchor: { icon: '\u{1F504}', label: 'Process Anchor' },
}

function formatSurfacedAgo(lastSurfacedAt: string | null | undefined): string {
  if (!lastSurfacedAt) return 'Never surfaced'
  const diff = Date.now() - new Date(lastSurfacedAt).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Surfaced today'
  if (days === 1) return 'Surfaced yesterday'
  return `Surfaced ${days}d ago`
}

export function ConnectionCarousel({ connections, onViewEntry, entryLookup }: ConnectionCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleImageError = (id: string) => {
    setImageErrors(prev => new Set(prev).add(id))
  }

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const cards = container.querySelectorAll('[data-carousel-card]')
    if (cards.length === 0) return

    const containerRect = container.getBoundingClientRect()
    const containerCenter = containerRect.left + containerRect.width / 2

    let closestIndex = 0
    let closestDistance = Infinity

    cards.forEach((card, index) => {
      const cardRect = card.getBoundingClientRect()
      const cardCenter = cardRect.left + cardRect.width / 2
      const distance = Math.abs(containerCenter - cardCenter)

      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })

    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex)
    }
  }, [activeIndex])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current) return

    const cards = scrollContainerRef.current.querySelectorAll('[data-carousel-card]')
    const targetCard = cards[index] as HTMLElement

    if (targetCard) {
      targetCard.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }

  if (connections.length === 0) return null

  return (
    <div className="py-8" style={{ background: '#E8E2D8', borderBottom: '2px solid #DC143C' }}>
      <div className="px-4 md:px-6 mb-6 mx-auto">
        <div className="border-t border-b border-neutral-200 py-3">
          <h2
            className="font-bold text-neutral-900 uppercase"
            style={{
              fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
              fontSize: '1.5rem',
              letterSpacing: '0.06em',
            }}
          >
            Latest Connections
          </h2>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 md:px-6"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {connections.map((conn) => {
          const plainContent = stripHtml(conn.content).trim()
          const displayText = plainContent.length > 120 ? plainContent.slice(0, 120) + '...' : plainContent
          const meta = conn.connection_type ? CONNECTION_TYPE_META[conn.connection_type] : null

          const sourceEntry = conn.source_entry_id ? entryLookup.get(conn.source_entry_id) : undefined
          const { url: imgUrl, objectPosition } = sourceEntry ? getEntryPosterWithFocalPoint(sourceEntry) : { url: undefined, objectPosition: '50% 50%' }
          const hasImage = !!imgUrl && !imageErrors.has(conn.id)

          return (
            <div
              key={conn.id}
              data-carousel-card
              className="flex-shrink-0 snap-center cursor-pointer group"
              style={{ width: '420px' }}
              onClick={() => onViewEntry?.(conn.id)}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  height: '180px',
                  display: 'flex',
                  flexDirection: 'row',
                  transition: 'box-shadow 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                {/* Thumbnail from source entry */}
                {hasImage && (
                  <div style={{ flexShrink: 0, width: '140px', height: '180px', overflow: 'hidden' }}>
                    <img
                      src={imgUrl}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition,
                        display: 'block',
                      }}
                      onError={() => handleImageError(conn.id)}
                    />
                  </div>
                )}

                {/* Text content */}
                <div style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  flex: 1,
                  minWidth: 0,
                }}>
                  <p style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: '#1a1a1a',
                    lineHeight: 1.5,
                    margin: 0,
                    flexGrow: 1,
                    overflow: 'hidden',
                  }}>
                    &ldquo;{displayText}&rdquo;
                  </p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.5rem',
                    fontSize: '0.68rem',
                    color: '#9CA3AF',
                  }}>
                    {meta && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        color: '#6B7280',
                        fontWeight: 500,
                      }}>
                        {meta.icon} {meta.label}
                      </span>
                    )}
                    <span>{formatSurfacedAgo(conn.last_surfaced_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {connections.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {connections.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === activeIndex
                  ? 'bg-neutral-900'
                  : 'bg-neutral-300 hover:bg-neutral-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
