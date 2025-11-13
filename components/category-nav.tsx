'use client'

interface CategoryNavProps {
  currentFilter: string
  onFilterChange: (category: string) => void
}

const categories = [
  'all',
  'Business',
  'Finance',
  'Health',
  'Spiritual',
  'Fun',
  'Social',
  'Romance',
]

export function CategoryNav({ currentFilter, onFilterChange }: CategoryNavProps) {
  return (
    <nav className="section-nav">
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

