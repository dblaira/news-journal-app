'use client'

import { Entry } from '@/types'
import { formatEntryDateShort, truncateHtml } from '@/lib/utils'
import { getEntryPosterWithFocalPoint } from '@/lib/utils/entry-images'
import { useState, useEffect } from 'react'

interface VanityFairLayoutProps {
  categoryEntries: Entry[]
  latestEntries: Entry[]
  pinnedStories: Entry[]
  pinnedNotes: Entry[]
  pinnedActions: Entry[]
  onViewEntry: (id: string) => void
  onNavigateToSection?: (entryType: 'story' | 'note' | 'action') => void
}

const PINNED_DISPLAY_LIMIT = 3

const categories: Entry['category'][] = ['Business', 'Finance', 'Health', 'Spiritual', 'Fun', 'Social', 'Romance']

export function VanityFairLayout({
  categoryEntries,
  latestEntries,
  pinnedStories,
  pinnedNotes,
  pinnedActions,
  onViewEntry,
  onNavigateToSection,
}: VanityFairLayoutProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleImageError = (entryId: string) => {
    if (isMounted) {
      setImageErrors((prev) => new Set(prev).add(entryId))
    }
  }

  // Create a map of category to entry for easy lookup
  const categoryMap = new Map<Entry['category'], Entry>()
  categoryEntries.forEach((entry) => {
    categoryMap.set(entry.category, entry)
  })

  // Check if there are any pinned items
  const hasPinnedItems = pinnedStories.length > 0 || pinnedNotes.length > 0 || pinnedActions.length > 0

  return (
    <div className="vanity-fair-layout bg-white text-neutral-900 py-10">
      {/* Section Titles - All Stories and Pinned */}
      <div className="px-4 md:px-6 mb-8 mx-auto">
        <div className="border-t border-b border-neutral-200 py-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-9">
              <h2 className="text-sm font-bold tracking-widest text-neutral-900 uppercase" style={{ fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" }}>
                All Stories
              </h2>
            </div>
            <div className="md:col-span-3">
              <h2 className="text-sm font-bold tracking-widest text-neutral-900 uppercase" style={{ fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" }}>
                Pinned
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE ONLY: Pinned Items at Top */}
      {hasPinnedItems && (
        <div className="md:hidden px-4 mb-8 mx-auto">
          {/* Pinned Stories - Mobile */}
          {pinnedStories.length > 0 && (
            <div className="mb-6">
              <h3 className="uppercase text-xs text-neutral-500 font-semibold tracking-wider mb-3 pb-2 border-b border-neutral-200" style={{ fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" }}>
                Pinned Stories
              </h3>
              <div className="space-y-3">
                {pinnedStories.slice(0, PINNED_DISPLAY_LIMIT).map((entry) => {
                  const { url: imageUrl, objectPosition } = getEntryPosterWithFocalPoint(entry)
                  const hasRealImage = !!imageUrl && !imageErrors.has(entry.id)

                  return (
                    <div
                      key={entry.id}
                      className="cursor-pointer group flex gap-3"
                      onClick={() => onViewEntry(entry.id)}
                    >
                      {hasRealImage && (
                        <div className="w-20 h-20 flex-shrink-0 overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={entry.headline}
                            className="w-full h-full object-cover"
                            style={{ objectPosition }}
                            onError={() => handleImageError(entry.id)}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="uppercase text-xs text-red-600 tracking-wider font-bold">
                          {entry.category}
                        </span>
                        <h4 className="text-base font-semibold leading-tight text-neutral-900 mt-1" style={{ fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" }}>
                          {entry.headline}
                        </h4>
                        <p className="text-xs text-neutral-400 mt-1 uppercase">
                          {formatEntryDateShort(entry.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {pinnedStories.length > PINNED_DISPLAY_LIMIT && (
                  <button
                    onClick={() => onNavigateToSection?.('story')}
                    className="text-xs text-red-600 font-semibold uppercase tracking-wider hover:underline mt-2"
                  >
                    See all {pinnedStories.length} pinned stories &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Pinned Notes - Mobile */}
          {pinnedNotes.length > 0 && (
            <div className="mb-6">
              <h3 className="uppercase text-xs text-neutral-500 font-semibold tracking-wider mb-3 pb-2 border-b border-neutral-200" style={{ fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" }}>
                Pinned Notes
              </h3>
              <div className="space-y-3">
                {pinnedNotes.slice(0, PINNED_DISPLAY_LIMIT).map((entry) => {
                  const { url: noteImageUrl, objectPosition: noteObjPos } = getEntryPosterWithFocalPoint(entry)
                  const hasNoteImage = !!noteImageUrl && !imageErrors.has(entry.id)

                  return (
                    <div
                      key={entry.id}
                      className="cursor-pointer group flex gap-3"
                      onClick={() => onViewEntry(entry.id)}
                    >
                      {hasNoteImage && (
                        <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-sm">
                          <img
                            src={noteImageUrl}
                            alt={entry.headline}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: noteObjPos }}
                            onError={() => handleImageError(entry.id)}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="uppercase text-xs text-blue-600 tracking-wider font-bold">
                          Note
                        </span>
                        <h4 className="text-base font-semibold leading-tight text-neutral-900 mt-1" style={{ fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" }}>
                          {entry.headline}
                        </h4>
                        <p className="text-xs text-neutral-400 mt-1 uppercase">
                          {formatEntryDateShort(entry.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {pinnedNotes.length > PINNED_DISPLAY_LIMIT && (
                  <button
                    onClick={() => onNavigateToSection?.('note')}
                    className="text-xs text-blue-600 font-semibold uppercase tracking-wider hover:underline mt-2"
                  >
                    See all {pinnedNotes.length} pinned notes &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Pinned Actions - Mobile */}
          {pinnedActions.length > 0 && (
            <div className="mb-6">
              <h3 className="uppercase text-xs text-neutral-500 font-semibold tracking-wider mb-3 pb-2 border-b border-neutral-200" style={{ fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" }}>
                Pinned Actions
              </h3>
              <div className="space-y-3">
                {pinnedActions.slice(0, PINNED_DISPLAY_LIMIT).map((entry) => {
                  const { url: actionImageUrl, objectPosition: actionObjPos } = getEntryPosterWithFocalPoint(entry)
                  const hasActionImage = !!actionImageUrl && !imageErrors.has(entry.id)

                  return (
                    <div
                      key={entry.id}
                      className="cursor-pointer group flex gap-3"
                      onClick={() => onViewEntry(entry.id)}
                    >
                      {hasActionImage && (
                        <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-sm">
                          <img
                            src={actionImageUrl}
                            alt={entry.headline}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: actionObjPos }}
                            onError={() => handleImageError(entry.id)}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="uppercase text-xs text-amber-600 tracking-wider font-bold">
                          Action
                        </span>
                        <h4 className="text-base font-semibold leading-tight text-neutral-900 mt-1" style={{ fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" }}>
                          {entry.headline}
                        </h4>
                        {entry.due_date && (
                          <p className="text-xs text-amber-600 mt-1 font-medium">
                            Due: {formatEntryDateShort(entry.due_date)}
                          </p>
                        )}
                        <p className="text-xs text-neutral-400 mt-1 uppercase">
                          {formatEntryDateShort(entry.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {pinnedActions.length > PINNED_DISPLAY_LIMIT && (
                  <button
                    onClick={() => onNavigateToSection?.('action')}
                    className="text-xs text-amber-600 font-semibold uppercase tracking-wider hover:underline mt-2"
                  >
                    See all {pinnedActions.length} pinned actions &rarr;
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 px-4 md:px-6 mx-auto">
        
        {/* LEFT COLUMN — Category Stories (3 columns) */}
        <aside className="md:col-span-3 space-y-8">
          {categories.map((category) => {
            const entry = categoryMap.get(category)
            if (!entry) {
              return (
                <div key={category} className="opacity-50">
                  <h2 className="uppercase text-xs text-neutral-500 mb-2">{category}</h2>
                  <p className="text-sm text-neutral-400">No entries yet</p>
                </div>
              )
            }

            const { url: imageUrl, objectPosition } = getEntryPosterWithFocalPoint(entry)
            const hasRealImage = !!imageUrl && !imageErrors.has(entry.id)

            return (
              <div key={entry.id} className="cursor-pointer group" onClick={() => onViewEntry(entry.id)}>
                {hasRealImage && (
                  <div className="mb-3 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={entry.headline}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      style={{ objectPosition }}
                      onError={() => handleImageError(entry.id)}
                    />
                  </div>
                )}
                <h2 className="uppercase text-xs text-red-600 tracking-wider mb-1 font-bold">
                  {entry.category}
                </h2>
                <h3 className="text-xl font-semibold mt-1 hover:underline leading-tight text-neutral-900 group-hover:text-neutral-600 transition-colors" style={{ fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" }}>
                  {entry.headline}
                </h3>
                {entry.subheading && (
                  <p className="text-sm text-neutral-500 mt-2 italic">
                    {entry.subheading}
                  </p>
                )}
                <p className="text-xs text-neutral-400 mt-2 uppercase tracking-wide">
                  {formatEntryDateShort(entry.created_at)}
                </p>
              </div>
            )
          })}
        </aside>

        {/* CENTER COLUMN — Latest Stories (6 columns, larger) */}
        <section className="md:col-span-6 space-y-8 md:px-4">
          {latestEntries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500">No entries yet. Create your first entry to get started.</p>
            </div>
          ) : (
            latestEntries.map((entry) => {
              const { url: imageUrl, objectPosition } = getEntryPosterWithFocalPoint(entry)
              const hasRealImage = !!imageUrl && !imageErrors.has(entry.id)

              return (
                <article
                  key={entry.id}
                  className="cursor-pointer group"
                  onClick={() => onViewEntry(entry.id)}
                >
                  {hasRealImage && (
                    <div className="mb-4 overflow-hidden rounded-lg">
                      <img
                        src={imageUrl}
                        alt={entry.headline}
                        className="w-full h-64 md:h-80 object-cover transition-transform duration-300 group-hover:scale-105"
                        style={{ objectPosition }}
                        onError={() => handleImageError(entry.id)}
                      />
                    </div>
                  )}
                  <div className="mb-2">
                    <span className="uppercase text-xs tracking-wider text-red-600 font-bold">
                      {entry.category}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-2 hover:underline text-neutral-900 group-hover:text-neutral-600 transition-colors" style={{ fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" }}>
                    {entry.headline}
                  </h2>
                  {entry.subheading && (
                    <p className="text-lg text-neutral-600 italic mb-3">
                      {entry.subheading}
                    </p>
                  )}
                  <p className="text-neutral-600 leading-relaxed mb-3">
                    {truncateHtml(entry.content, 200)}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-neutral-500">
                    <span>{formatEntryDateShort(entry.created_at)}</span>
                    {entry.view_count && entry.view_count > 0 && (
                      <span className="flex items-center gap-1">
                        <span>👁</span>
                        <span>{entry.view_count}</span>
                      </span>
                    )}
                  </div>
                </article>
              )
            })
          )}
        </section>

        {/* RIGHT COLUMN — Pinned Items (3 columns) - Hidden on mobile, shown at top instead */}
        <aside className="hidden md:block md:col-span-3 space-y-6">
          {/* Pinned Stories */}
          {pinnedStories.length > 0 && (
            <div>
              <h3 className="uppercase text-xs text-neutral-500 font-semibold tracking-wider mb-4 pb-2 border-b border-neutral-200" style={{ fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" }}>
                Stories
              </h3>
              <div className="space-y-4">
                {pinnedStories.slice(0, PINNED_DISPLAY_LIMIT).map((entry) => {
                  const { url: imageUrl, objectPosition } = getEntryPosterWithFocalPoint(entry)
                  const hasRealImage = !!imageUrl && !imageErrors.has(entry.id)

                  return (
                    <div
                      key={entry.id}
                      className="cursor-pointer group"
                      onClick={() => onViewEntry(entry.id)}
                    >
                      {hasRealImage && (
                        <div className="mb-2 overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={entry.headline}
                            className="w-full h-28 object-cover transition-transform duration-300 group-hover:scale-105"
                            style={{ objectPosition }}
                            onError={() => handleImageError(entry.id)}
                          />
                        </div>
                      )}
                      <div className="mb-1">
                        <span className="uppercase text-xs text-red-600 tracking-wider font-bold">
                          {entry.category}
                        </span>
                      </div>
                      <h4 className="text-base font-semibold hover:underline leading-tight text-neutral-900 group-hover:text-neutral-600 transition-colors" style={{ fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" }}>
                        {entry.headline}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wide">
                        {formatEntryDateShort(entry.created_at)}
                      </p>
                    </div>
                  )
                })}
                {pinnedStories.length > PINNED_DISPLAY_LIMIT && (
                  <button
                    onClick={() => onNavigateToSection?.('story')}
                    className="text-xs text-red-600 font-semibold uppercase tracking-wider hover:underline"
                  >
                    See all {pinnedStories.length} pinned &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Pinned Notes — with thumbnail images */}
          {pinnedNotes.length > 0 && (
            <div>
              <h3 className="uppercase text-xs text-neutral-500 font-semibold tracking-wider mb-4 pb-2 border-b border-neutral-200" style={{ fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" }}>
                Notes
              </h3>
              <div className="space-y-4">
                {pinnedNotes.slice(0, PINNED_DISPLAY_LIMIT).map((entry) => {
                  const { url: noteImageUrl, objectPosition: noteObjPos } = getEntryPosterWithFocalPoint(entry)
                  const hasNoteImage = !!noteImageUrl && !imageErrors.has(entry.id)

                  return (
                    <div
                      key={entry.id}
                      className="cursor-pointer group hover:bg-neutral-100 transition-colors"
                      onClick={() => onViewEntry(entry.id)}
                    >
                      {hasNoteImage && (
                        <div className="mb-2 overflow-hidden">
                          <img
                            src={noteImageUrl}
                            alt={entry.headline}
                            className="w-full h-24 object-cover transition-transform duration-300 group-hover:scale-105"
                            style={{ objectPosition: noteObjPos }}
                            onError={() => handleImageError(entry.id)}
                          />
                        </div>
                      )}
                      <div className="mb-1">
                        <span className="uppercase text-xs text-blue-600 tracking-wider font-bold">
                          Note
                        </span>
                      </div>
                      <h4 className="text-base font-semibold leading-tight text-neutral-900 group-hover:text-neutral-600 transition-colors" style={{ fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" }}>
                        {entry.headline}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                        {truncateHtml(entry.content, 80)}
                      </p>
                      <p className="text-xs text-neutral-400 mt-2 uppercase tracking-wide">
                        {formatEntryDateShort(entry.created_at)}
                      </p>
                    </div>
                  )
                })}
                {pinnedNotes.length > PINNED_DISPLAY_LIMIT && (
                  <button
                    onClick={() => onNavigateToSection?.('note')}
                    className="text-xs text-blue-600 font-semibold uppercase tracking-wider hover:underline"
                  >
                    See all {pinnedNotes.length} pinned &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Pinned Actions — with thumbnail images */}
          {pinnedActions.length > 0 && (
            <div>
              <h3 className="uppercase text-xs text-neutral-500 font-semibold tracking-wider mb-4 pb-2 border-b border-neutral-200" style={{ fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" }}>
                Actions
              </h3>
              <div className="space-y-4">
                {pinnedActions.slice(0, PINNED_DISPLAY_LIMIT).map((entry) => {
                  const { url: actionImageUrl, objectPosition: actionObjPos } = getEntryPosterWithFocalPoint(entry)
                  const hasActionImage = !!actionImageUrl && !imageErrors.has(entry.id)

                  return (
                    <div
                      key={entry.id}
                      className="cursor-pointer group hover:bg-amber-100/50 transition-colors"
                      onClick={() => onViewEntry(entry.id)}
                    >
                      {hasActionImage && (
                        <div className="mb-2 overflow-hidden">
                          <img
                            src={actionImageUrl}
                            alt={entry.headline}
                            className="w-full h-24 object-cover transition-transform duration-300 group-hover:scale-105"
                            style={{ objectPosition: actionObjPos }}
                            onError={() => handleImageError(entry.id)}
                          />
                        </div>
                      )}
                      <div className="mb-1 flex items-center gap-2">
                        <span className="uppercase text-xs text-amber-600 tracking-wider font-bold">
                          Action
                        </span>
                        {entry.due_date && (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            Due {formatEntryDateShort(entry.due_date)}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-semibold leading-tight text-neutral-900 group-hover:text-neutral-600 transition-colors" style={{ fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif" }}>
                        {entry.headline}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wide">
                        {formatEntryDateShort(entry.created_at)}
                      </p>
                    </div>
                  )
                })}
                {pinnedActions.length > PINNED_DISPLAY_LIMIT && (
                  <button
                    onClick={() => onNavigateToSection?.('action')}
                    className="text-xs text-amber-600 font-semibold uppercase tracking-wider hover:underline"
                  >
                    See all {pinnedActions.length} pinned &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Empty state when no pinned items */}
          {!hasPinnedItems && (
            <p className="text-sm text-neutral-400 italic">
              No pinned items yet. Pin entries to keep them visible here.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
