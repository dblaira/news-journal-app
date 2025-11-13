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

export function getCategoryImage(category: string): string {
  const categoryImages: Record<string, string> = {
    Business:
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
    Finance:
      'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?auto=format&fit=crop&w=1200&q=80',
    Health:
      'https://images.unsplash.com/photo-1484980972926-edee96e0960d?auto=format&fit=crop&w=1200&q=80',
    Spiritual:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    Fun: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    Social:
      'https://images.unsplash.com/photo-1529158062015-cad636e69505?auto=format&fit=crop&w=1200&q=80',
    Romance:
      'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?auto=format&fit=crop&w=1200&q=80',
  }

  return (
    categoryImages[category] ||
    'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80'
  )
}

