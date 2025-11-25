'use client'

import { Entry } from '@/types'
import { formatEntryDateShort, truncate } from '@/lib/utils'
import { getCategoryImage } from '@/lib/mindset'
import { useState, useEffect } from 'react'

interface VanityFairLayoutProps {
  categoryEntries: Entry[]
  latestEntries: Entry[]
  trendingEntries: Entry[]
  onViewEntry: (id: string) => void
}

const categories: Entry['category'][] = ['Business', 'Finance', 'Health', 'Spiritual', 'Fun', 'Social', 'Romance']

export function VanityFairLayout({
  categoryEntries,
  latestEntries,
  trendingEntries,
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

  return (
    <div className="vanity-fair-layout bg-black text-white py-10">
      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 px-6 max-w-7xl mx-auto">
        
        {/* LEFT COLUMN — Category Stories (3 columns) */}
        <aside className="md:col-span-3 space-y-8">
          {categories.map((category) => {
            const entry = categoryMap.get(category)
            if (!entry) {
              return (
                <div key={category} className="opacity-50">
                  <h2 className="uppercase text-xs text-neutral-400 mb-2">{category}</h2>
                  <p className="text-sm text-neutral-500">No entries yet</p>
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
                <h2 className="uppercase text-xs text-neutral-400 tracking-wider mb-1">
                  {entry.category}
                </h2>
                <h3 className="text-lg font-semibold mt-1 hover:underline leading-tight group-hover:text-neutral-300 transition-colors">
                  {entry.headline}
                </h3>
                {entry.subheading && (
                  <p className="text-sm text-neutral-400 mt-2 italic">
                    {entry.subheading}
                  </p>
                )}
                <p className="text-xs text-neutral-500 mt-2">
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
              <p className="text-neutral-400">No entries yet. Create your first entry to get started.</p>
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
                    <span className="uppercase text-xs tracking-wider text-neutral-400">
                      {entry.category}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-2 hover:underline group-hover:text-neutral-300 transition-colors">
                    {entry.headline}
                  </h2>
                  {entry.subheading && (
                    <p className="text-lg text-neutral-300 italic mb-3">
                      {entry.subheading}
                    </p>
                  )}
                  <p className="text-neutral-300 leading-relaxed mb-3">
                    {truncate(entry.content, 200)}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-neutral-400">
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

        {/* RIGHT COLUMN — Trending Stories (3 columns) */}
        <aside className="md:col-span-3 space-y-6">
          <div>
            <h2 className="uppercase text-xs text-orange-400 font-semibold tracking-wider mb-4">
              Trending Stories
            </h2>
            {trendingEntries.length === 0 ? (
              <p className="text-sm text-neutral-500">No trending stories yet</p>
            ) : (
              <div className="space-y-6">
                {trendingEntries.map((entry) => {
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
                            className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={() => handleImageError(entry.id)}
                          />
                        </div>
                      )}
                      <div className="mb-1">
                        <span className="uppercase text-xs text-neutral-400 tracking-wider">
                          {entry.category}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold hover:underline leading-tight group-hover:text-neutral-300 transition-colors mb-1">
                        {entry.headline}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span>{formatEntryDateShort(entry.created_at)}</span>
                        {entry.view_count && entry.view_count > 0 && (
                          <span className="flex items-center gap-1">
                            <span>👁</span>
                            <span>{entry.view_count}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

