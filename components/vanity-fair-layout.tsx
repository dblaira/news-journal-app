'use client'

import { Entry } from '@/types'
import { formatEntryDateShort, truncate } from '@/lib/utils'
import { getCategoryImage } from '@/lib/mindset'
import { useState, useEffect } from 'react'

interface VanityFairLayoutProps {
  categoryEntries: Entry[]
  latestEntries: Entry[]
  pinnedStories: Entry[]
  pinnedNotes: Entry[]
  pinnedActions: Entry[]
  onViewEntry: (id: string) => void
}

const categories: Entry['category'][] = ['Business', 'Finance', 'Health', 'Spiritual', 'Fun', 'Social', 'Romance']

export function VanityFairLayout({
  categoryEntries,
  latestEntries,
  pinnedStories,
  pinnedNotes,
  pinnedActions,
  onViewEntry,
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
      <div className="px-4 md:px-6 mb-8 max-w-7xl mx-auto">
        <div className="border-t border-b border-neutral-200 py-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-9">
              <h2 className="text-sm font-bold tracking-widest text-neutral-900 uppercase">
                All Stories
              </h2>
            </div>
            <div className="md:col-span-3">
              <h2 className="text-sm font-bold tracking-widest text-neutral-900 uppercase">
                Pinned
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 px-4 md:px-6 max-w-7xl mx-auto">
        
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

            const imageUrl = entry.photo_url || getCategoryImage(entry.category)
            const hasImageError = imageErrors.has(entry.id)

            return (
              <div key={entry.id} className="cursor-pointer group" onClick={() => onViewEntry(entry.id)}>
                {!hasImageError && (
                  <div className="mb-3 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={entry.headline}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={() => handleImageError(entry.id)}
                    />
                  </div>
                )}
                <h2 className="uppercase text-xs text-red-600 tracking-wider mb-1 font-bold">
                  {entry.category}
                </h2>
                <h3 className="text-lg font-semibold mt-1 hover:underline leading-tight text-neutral-900 group-hover:text-neutral-600 transition-colors">
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
              const imageUrl = entry.photo_url || getCategoryImage(entry.category)
              const hasImageError = imageErrors.has(entry.id)

              return (
                <article
                  key={entry.id}
                  className="cursor-pointer group"
                  onClick={() => onViewEntry(entry.id)}
                >
                  {!hasImageError && (
                    <div className="mb-4 overflow-hidden rounded-lg">
                      <img
                        src={imageUrl}
                        alt={entry.headline}
                        className="w-full h-64 md:h-80 object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={() => handleImageError(entry.id)}
                      />
                    </div>
                  )}
                  <div className="mb-2">
                    <span className="uppercase text-xs tracking-wider text-red-600 font-bold">
                      {entry.category}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-2 hover:underline text-neutral-900 group-hover:text-neutral-600 transition-colors">
                    {entry.headline}
                  </h2>
                  {entry.subheading && (
                    <p className="text-lg text-neutral-600 italic mb-3">
                      {entry.subheading}
                    </p>
                  )}
                  <p className="text-neutral-600 leading-relaxed mb-3">
                    {truncate(entry.content, 200)}
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

        {/* RIGHT COLUMN — Pinned Items (3 columns) */}
        <aside className="md:col-span-3 space-y-6">
          {/* Pinned Stories */}
          {pinnedStories.length > 0 && (
            <div>
              <h3 className="uppercase text-xs text-neutral-500 font-semibold tracking-wider mb-4 pb-2 border-b border-neutral-200">
                Stories
              </h3>
              <div className="space-y-4">
                {pinnedStories.map((entry) => {
                  const imageUrl = entry.photo_url || getCategoryImage(entry.category)
                  const hasImageError = imageErrors.has(entry.id)

                  return (
                    <div
                      key={entry.id}
                      className="cursor-pointer group"
                      onClick={() => onViewEntry(entry.id)}
                    >
                      {!hasImageError && (
                        <div className="mb-2 overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={entry.headline}
                            className="w-full h-28 object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={() => handleImageError(entry.id)}
                          />
                        </div>
                      )}
                      <div className="mb-1">
                        <span className="uppercase text-xs text-red-600 tracking-wider font-bold">
                          {entry.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold hover:underline leading-tight text-neutral-900 group-hover:text-neutral-600 transition-colors">
                        {entry.headline}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wide">
                        {formatEntryDateShort(entry.created_at)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Pinned Notes */}
          {pinnedNotes.length > 0 && (
            <div>
              <h3 className="uppercase text-xs text-neutral-500 font-semibold tracking-wider mb-4 pb-2 border-b border-neutral-200">
                Notes
              </h3>
              <div className="space-y-4">
                {pinnedNotes.map((entry) => (
                  <div
                    key={entry.id}
                    className="cursor-pointer group p-3 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                    onClick={() => onViewEntry(entry.id)}
                  >
                    <div className="mb-1">
                      <span className="uppercase text-xs text-blue-600 tracking-wider font-bold">
                        Note
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold leading-tight text-neutral-900 group-hover:text-neutral-600 transition-colors">
                      {entry.headline}
                    </h4>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                      {truncate(entry.content, 80)}
                    </p>
                    <p className="text-xs text-neutral-400 mt-2 uppercase tracking-wide">
                      {formatEntryDateShort(entry.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pinned Actions */}
          {pinnedActions.length > 0 && (
            <div>
              <h3 className="uppercase text-xs text-neutral-500 font-semibold tracking-wider mb-4 pb-2 border-b border-neutral-200">
                Actions
              </h3>
              <div className="space-y-4">
                {pinnedActions.map((entry) => (
                  <div
                    key={entry.id}
                    className="cursor-pointer group p-3 bg-amber-50 hover:bg-amber-100 transition-colors border-l-2 border-amber-400"
                    onClick={() => onViewEntry(entry.id)}
                  >
                    <div className="mb-1">
                      <span className="uppercase text-xs text-amber-600 tracking-wider font-bold">
                        Action
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold leading-tight text-neutral-900 group-hover:text-neutral-600 transition-colors">
                      {entry.headline}
                    </h4>
                    {entry.due_date && (
                      <p className="text-xs text-amber-600 mt-1 font-medium">
                        Due: {formatEntryDateShort(entry.due_date)}
                      </p>
                    )}
                    <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wide">
                      {formatEntryDateShort(entry.created_at)}
                    </p>
                  </div>
                ))}
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
