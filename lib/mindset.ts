export function deriveMindsetPreset(mood: string, category: string) {
  const presets = [
    {
      match: ['excited', 'energized', 'motivated', 'hype'],
      headline: 'Calling all Big Wave Riders',
      subtitle: 'Momentum is here. Capture it before it fades.',
    },
    {
      match: ['calm', 'steady', 'reflective', 'grateful'],
      headline: 'Steady Hands on the Helm',
      subtitle: 'Honor the quiet details that make today matter.',
    },
    {
      match: ['overwhelmed', 'tired', 'stretched'],
      headline: 'Slow Motion, Sharp Focus',
      subtitle: 'Narrow the lens and let one meaningful story lead.',
    },
    {
      match: ['curious', 'learning', 'exploring'],
      headline: 'Curiosity on the Front Page',
      subtitle: 'Follow the thread that keeps pulling you forward.',
    },
  ]

  const matched = presets.find((preset) =>
    preset.match.some((keyword) => mood.includes(keyword))
  )
  if (matched) return matched

  if (category.includes('finance') || category.includes('business')) {
    return {
      headline: 'Market Moving Meaning',
      subtitle: 'You are the bellwether. Set the tone for this issue.',
    }
  }

  if (category.includes('health') || category.includes('spiritual')) {
    return {
      headline: 'Tune Inward, Broadcast Out',
      subtitle: "Let grounded energy steer today's headline.",
    }
  }

  return {
    headline: 'Calling all Big Wave Riders',
    subtitle: 'Step into the day like it is a headline worth remembering.',
  }
}

// Use placeholder images via placeholder.com instead of Unsplash to avoid 404s
export function getCategoryImage(category: string): string {
  const categoryColors: Record<string, string> = {
    Business: '4A90E2',
    Finance: '50C878',
    Health: 'FF6B6B',
    Spiritual: '9B59B6',
    Fun: 'FFA500',
    Social: 'FF69B4',
    Romance: 'FF1493',
  }

  const color = categoryColors[category] || '6C7A89'
  // Use placeholder.com which is more reliable than Unsplash
  return `https://via.placeholder.com/1200x600/${color}/FFFFFF?text=${encodeURIComponent(category)}`
}

