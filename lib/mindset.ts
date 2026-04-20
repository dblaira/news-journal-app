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

  const c = category.toLowerCase()
  if (c.includes('purchase') || c.includes('work') || c.includes('ambition')) {
    return {
      headline: 'Market Moving Meaning',
      subtitle: 'You are the bellwether. Set the tone for this issue.',
    }
  }

  if (
    c.includes('health') ||
    c.includes('sleep') ||
    c.includes('exercise') ||
    c.includes('nutrition') ||
    c.includes('belief')
  ) {
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

function generateDefaultSVG(text: string): string {
  const safe = (text || 'Entry').replace(/[<>&]/g, '')
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#FFFFFF"/>
      <text x="200" y="210" 
            font-family="Georgia, serif" 
            font-size="42"
            fill="#6C7A89" 
            text-anchor="middle" 
            dominant-baseline="middle">${safe}</text>
    </svg>
  `
    .trim()
    .replace(/\s+/g, ' ')
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function getCategoryImage(category: string): string {
  return generateDefaultSVG(category || 'Entry')
}
