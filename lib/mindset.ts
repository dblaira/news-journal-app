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

// Use SVG data URIs for category images (no external dependencies)
export function getCategoryImage(category: string): string {
  const categoryColors: Record<string, { bg: string; text: string }> = {
    Business: { bg: '4A90E2', text: 'Business' },
    Finance: { bg: '50C878', text: 'Finance' },
    Health: { bg: 'FF6B6B', text: 'Health' },
    Spiritual: { bg: '9B59B6', text: 'Spiritual' },
    Fun: { bg: 'FFA500', text: 'Fun' },
    Social: { bg: 'FF69B4', text: 'Social' },
    Romance: { bg: 'FF1493', text: 'Romance' },
  }

  const { bg, text } = categoryColors[category] || { bg: '6C7A89', text: 'Journal' }
  
  // Generate SVG data URI - no external requests needed
  const svg = `
    <svg width="1200" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="600" fill="#${bg}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="72" font-weight="bold" 
            fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">${text}</text>
    </svg>
  `.trim().replace(/\s+/g, ' ')
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

