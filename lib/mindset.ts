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

// Typography-based category placeholder images
// Each category has a unique typographic treatment

function generateBusinessSVG(): string {
  // "The Architect" - Heavy, geometric, authoritative
  // Arial Black, uppercase, tight letter-spacing
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#F5F5F5"/>
      <text x="200" y="210" 
            font-family="Arial Black, Impact, sans-serif" 
            font-size="52" 
            font-weight="900"
            letter-spacing="-3"
            fill="#1A1A1A" 
            text-anchor="middle" 
            dominant-baseline="middle">BUSINESS</text>
    </svg>
  `.trim().replace(/\s+/g, ' ')
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function generateFinanceSVG(): string {
  // "The Ledger" - Precise, digital, calculated
  // Monospace, lowercase, with ledger underline
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#F5F5F5"/>
      <text x="200" y="200" 
            font-family="Courier New, Courier, monospace" 
            font-size="42"
            fill="#2D3436" 
            text-anchor="middle" 
            dominant-baseline="middle">finance.</text>
      <line x1="100" y1="235" x2="300" y2="235" stroke="#2D3436" stroke-width="1"/>
    </svg>
  `.trim().replace(/\s+/g, ' ')
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function generateHealthSVG(): string {
  // "The Breath" - Organic, clean, balanced
  // Light weight, dramatically wide letter-spacing
  const letters = 'HEALTH'.split('')
  const letterElements = letters.map((letter, i) => 
    `<tspan x="${80 + i * 45}" y="210">${letter}</tspan>`
  ).join('')
  
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#F5F5F5"/>
      <text font-family="Arial, Helvetica, sans-serif" 
            font-size="36"
            font-weight="200"
            fill="#4A4A4A" 
            text-anchor="middle" 
            dominant-baseline="middle">${letterElements}</text>
    </svg>
  `.trim().replace(/\s+/g, ' ')
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function generateSpiritualSVG(): string {
  // "The Horizon" - Ethereal, expansive, deep
  // Georgia italic with vertical gradient fade
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="spiritualGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#2C3E50;stop-opacity:1"/>
          <stop offset="100%" style="stop-color:#2C3E50;stop-opacity:0.2"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="#F5F5F5"/>
      <text x="200" y="210" 
            font-family="Georgia, Times New Roman, serif" 
            font-size="44"
            font-style="italic"
            fill="url(#spiritualGradient)" 
            text-anchor="middle" 
            dominant-baseline="middle">Spiritual</text>
    </svg>
  `.trim().replace(/\s+/g, ' ')
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function generateFunSVG(): string {
  // "The Oddball" - Playful, unpredictable, energetic
  // Varied sizes, rotations, and baselines
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#F5F5F5"/>
      <text x="115" y="195" font-family="Comic Sans MS, cursive" font-size="58" fill="#E67E22" transform="rotate(-8 115 195)">F</text>
      <text x="155" y="225" font-family="Comic Sans MS, cursive" font-size="38" fill="#9B59B6" transform="rotate(5 155 225)">u</text>
      <text x="190" y="190" font-family="Comic Sans MS, cursive" font-size="52" fill="#27AE60" transform="rotate(-3 190 190)">N</text>
      <text x="245" y="215" font-family="Comic Sans MS, cursive" font-size="32" fill="#E74C3C" transform="rotate(12 245 215)">!</text>
    </svg>
  `.trim().replace(/\s+/g, ' ')
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function generateSocialSVG(): string {
  // "The Connection" - Warm, conversational, overlapping
  // Lowercase, letters literally touch each other
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#F5F5F5"/>
      <text x="200" y="210" 
            font-family="Georgia, serif" 
            font-size="48"
            letter-spacing="-6"
            fill="#34495E" 
            text-anchor="middle" 
            dominant-baseline="middle">social</text>
    </svg>
  `.trim().replace(/\s+/g, ' ')
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function generateRomanceSVG(): string {
  // "The Poetry" - Soft, intimate, classic
  // Georgia italic with tilde ornaments
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#F5F5F5"/>
      <text x="200" y="210" 
            font-family="Georgia, Garamond, serif" 
            font-size="40"
            font-style="italic"
            font-weight="300"
            fill="#8E44AD" 
            text-anchor="middle" 
            dominant-baseline="middle">~ Romance ~</text>
    </svg>
  `.trim().replace(/\s+/g, ' ')
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function generateDefaultSVG(text: string): string {
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#F5F5F5"/>
      <text x="200" y="210" 
            font-family="Georgia, serif" 
            font-size="42"
            fill="#6C7A89" 
            text-anchor="middle" 
            dominant-baseline="middle">${text}</text>
    </svg>
  `.trim().replace(/\s+/g, ' ')
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function getCategoryImage(category: string): string {
  switch (category) {
    case 'Business':
      return generateBusinessSVG()
    case 'Finance':
      return generateFinanceSVG()
    case 'Health':
      return generateHealthSVG()
    case 'Spiritual':
      return generateSpiritualSVG()
    case 'Fun':
      return generateFunSVG()
    case 'Social':
      return generateSocialSVG()
    case 'Romance':
      return generateRomanceSVG()
    default:
      return generateDefaultSVG(category || 'Journal')
  }
}

