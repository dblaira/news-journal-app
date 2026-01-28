// components/context/constants.ts

// Category configurations with emoji prefixes
export const CONTEXT_CATEGORIES = {
  location: {
    emoji: '📍',
    label: 'Location',
    type: 'auto', // Auto-captured
  },
  environment: {
    emoji: '🏠',
    label: 'Environment',
    type: 'select',
    presets: ['home', 'work', 'gym', 'café', 'outdoors', 'transit'],
  },
  activity: {
    emoji: '💪',
    label: 'Activity',
    type: 'select',
    presets: [
      'morning routine',
      'after workout',
      'during commute',
      'before bed',
      'at work',
      'lunch break',
      'weekend',
    ],
  },
  energy: {
    emoji: '⚡',
    label: 'Energy',
    type: 'select',
    presets: ['low', 'medium', 'high'],
  },
  mood: {
    emoji: '🧘',
    label: 'Mood',
    type: 'multi-select',
    presets: [
      'reflective',
      'determined',
      'focused',
      'anxious',
      'calm',
      'energized',
      'playful',
      'stressed',
      'grateful',
      'creative',
    ],
  },
  trigger: {
    emoji: '💡',
    label: 'Trigger',
    type: 'text',
    placeholder: 'What prompted this?',
  },
} as const

export type ContextCategoryKey = keyof typeof CONTEXT_CATEGORIES

// Helper to get emoji for a category
export function getCategoryEmoji(category: ContextCategoryKey): string {
  return CONTEXT_CATEGORIES[category]?.emoji || '📌'
}

// Helper to format context item for display
export function formatContextItem(
  category: ContextCategoryKey,
  value: string | string[]
): string {
  const emoji = getCategoryEmoji(category)
  if (Array.isArray(value)) {
    return `${emoji} ${value.join(', ')}`
  }
  return `${emoji} ${value}`
}

// Default category order for display
export const DEFAULT_CATEGORY_ORDER: ContextCategoryKey[] = [
  'environment',
  'activity',
  'energy',
  'mood',
]
