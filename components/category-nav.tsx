'use client'

import { LIFE_DOMAINS } from '@/types/ontology'

interface CategoryNavProps {
  currentFilter: string
  onFilterChange: (category: string) => void
}

const categories = ['all', ...LIFE_DOMAINS]

export function CategoryNav({ currentFilter, onFilterChange }: CategoryNavProps) {
  // Only render on desktop - mobile uses hamburger menu
  return (
    <nav className="section-nav desktop-only-nav">
      {categories.map((category) => (
        <button
          key={category}
          className={`category-btn ${currentFilter === category ? 'active' : ''}`}
          data-category={category}
          onClick={() => onFilterChange(category)}
        >
          {category === 'all' ? 'All' : category}
        </button>
      ))}
    </nav>
  )
}
