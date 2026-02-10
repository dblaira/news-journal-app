'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Entry } from '@/types'
import { formatEntryDateShort } from '@/lib/utils'
import { getCategoryImage } from '@/lib/mindset'
import { getEntryPosterWithFocalPoint } from '@/lib/utils/entry-images'

interface StoryCarouselProps {
  entries: Entry[]
  title?: string
  onViewEntry?: (id: string) => void
}

export function StoryCarousel({ entries, title, onViewEntry }: StoryCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleImageError = (entryId: string) => {
    setImageErrors((prev) => new Set(prev).add(entryId))
  }

  // Calculate which card is most visible by finding the card closest to viewport center
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

  // Scroll to specific card when dot is clicked
  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current) return
    
    const cards = scrollContainerRef.current.querySelectorAll('[data-carousel-card]')
    const targetCard = cards[index] as HTMLElement
    
    if (targetCard) {
      // Use scrollIntoView for reliable cross-browser behavior
      targetCard.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      })
    }
  }

  if (entries.length === 0) return null

  return (
    <div className="story-carousel bg-white py-8">
      {/* Section Title */}
      {title && (
        <div className="px-4 md:px-6 mb-6 mx-auto">
          <div className="border-t border-b border-neutral-200 py-3">
            <h2 className="text-sm font-bold tracking-widest text-neutral-900 uppercase" style={{ fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" }}>
              {title}
            </h2>
          </div>
        </div>
      )}

      {/* Horizontal Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 md:px-6"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {entries.map((entry) => {
          const { url: imageUrl, objectPosition } = getEntryPosterWithFocalPoint(entry)
          const fallbackUrl = imageUrl || getCategoryImage(entry.category)
          const hasImageError = imageErrors.has(entry.id)

          return (
            <div
              key={entry.id}
              data-carousel-card
              className="flex-shrink-0 snap-center cursor-pointer group"
              style={{ width: '300px' }}
              onClick={() => onViewEntry?.(entry.id)}
            >
              {/* Card with image on left, text on right */}
              <div className="flex gap-4 items-start">
                {/* Thumbnail */}
                {!hasImageError && (
                  <div className="w-24 h-24 flex-shrink-0 overflow-hidden bg-neutral-100">
                    <img
                      src={fallbackUrl}
                      alt={entry.headline}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      style={{ objectPosition }}
                      onError={() => handleImageError(entry.id)}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Category */}
                  <span className="text-xs font-bold tracking-wider text-red-600 uppercase">
                    {entry.category}
                  </span>

                  {/* Headline */}
                  <h3 className="text-neutral-900 text-sm font-semibold leading-tight mt-1 line-clamp-3 group-hover:text-neutral-600 transition-colors" style={{ fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" }}>
                    {entry.headline}
                  </h3>

                  {/* Date */}
                  <p className="text-xs text-neutral-500 mt-2 uppercase tracking-wide">
                    {formatEntryDateShort(entry.created_at)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination Dots */}
      {entries.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {entries.map((_, index) => (
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

      {/* Hide scrollbar CSS */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
