'use client'

import { useState } from 'react'

// ── Font definitions ─────────────────────────────────────────────────

interface FontCandidate {
  name: string
  cssVar: string
  fallback: string
  description: string
  personality: string
  tag: string
  weights: number[]
}

const FONTS: FontCandidate[] = [
  {
    name: 'Inter (current)',
    cssVar: 'var(--font-inter)',
    fallback: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    description: 'Current body font. Sans-serif designed for screens.',
    personality: 'Neutral, clean — but thin strokes bloom on dark backgrounds.',
    tag: 'sans-serif baseline',
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: 'Bodoni Moda',
    cssVar: 'var(--font-bodoni-moda)',
    fallback: "Georgia, 'Times New Roman', serif",
    description: 'The closest free match to Vanity Fair\'s VF Didot. High-contrast modern serif with extreme thick-thin variation. The same DNA as the font you admired.',
    personality: 'Sharp, glamorous, editorial authority. Born for dark backgrounds.',
    tag: 'closest to vanity fair',
    weights: [400, 500, 600, 700, 800, 900],
  },
  {
    name: 'Crimson Pro',
    cssVar: 'var(--font-crimson-pro)',
    fallback: "Georgia, 'Times New Roman', serif",
    description: 'Elegant serif inspired by old-style typefaces. Designed specifically for long-form reading.',
    personality: 'Refined, literary. A strong body text serif that pairs well with high-contrast headlines.',
    tag: 'serif candidate',
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: 'Source Serif 4',
    cssVar: 'var(--font-source-serif)',
    fallback: "Georgia, serif",
    description: 'Adobe\'s open-source editorial serif. Designed as the serif companion to Source Sans.',
    personality: 'The working journalist\'s serif. Clean, authoritative, never distracting.',
    tag: 'serif candidate',
    weights: [300, 400, 500, 600, 700],
  },
  {
    name: 'Libre Baskerville',
    cssVar: 'var(--font-libre-baskerville)',
    fallback: "Georgia, 'Times New Roman', serif",
    description: 'Classic editorial serif based on Baskerville. Optimized for body text on screen.',
    personality: 'Traditional newspaper DNA. Thick-thin contrast reads beautifully at any size.',
    tag: 'serif candidate',
    weights: [400, 700],
  },
  {
    name: 'Lora',
    cssVar: 'var(--font-lora)',
    fallback: "Georgia, serif",
    description: 'Contemporary serif with calligraphic roots. Well-balanced for body text and UI.',
    personality: 'Warm, modern editorial. Bridges the gap between classic serif and screen readability.',
    tag: 'serif candidate',
    weights: [400, 500, 600, 700],
  },
  {
    name: 'Playfair Display (current headlines)',
    cssVar: 'var(--font-playfair)',
    fallback: "'Times New Roman', serif",
    description: 'Currently used for all headlines. Didot-inspired display serif. Shown here to compare against Bodoni Moda for the headline role.',
    personality: 'Elegant, high-contrast. Already in the app — but is Bodoni Moda sharper?',
    tag: 'current headline font',
    weights: [600, 700, 800],
  },
]

// ── Sample content ───────────────────────────────────────────────────

const SAMPLE_HEADLINE = 'The Delegation Problem Isn\'t About Trust'
const SAMPLE_SUBHEAD = 'It\'s about articulation. I can\'t delegate what I can\'t describe.'
const SAMPLE_BODY = 'The real bottleneck is that I haven\'t thought through the process clearly enough to hand it off. Writing the delegation brief IS the thinking. Three weeks of data confirms this pattern. The sequence matters more than the duration — cold plunge before journal, not after. The clarity from cold exposure makes the writing sharper.'
const SAMPLE_META_LABEL = 'BUSINESS'
const SAMPLE_META_DATE = 'Feb 9'
const SAMPLE_META_MOOD = 'focused'
const SAMPLE_SMALL = 'Linked entry · Delegation Framework Using C.L.E.A.R.'
const SAMPLE_LARGE_HEADLINE = 'Notes'
const SAMPLE_TAGLINE = 'From story to story'

const RED = '#DC143C'

// ── Preview panel ────────────────────────────────────────────────────

function FontPanel({ font, mode }: { font: FontCandidate; mode: 'light' | 'dark' }) {
  const isLight = mode === 'light'
  const bg = isLight ? '#FFFFFF' : '#111111'
  const textPrimary = isLight ? '#1A1A1A' : '#FFFFFF'
  const textSecondary = isLight ? '#5A5650' : 'rgba(255,255,255,0.65)'
  const textMuted = isLight ? '#9A9590' : 'rgba(255,255,255,0.4)'
  const borderColor = isLight ? '#E5E2DD' : 'rgba(255,255,255,0.08)'
  const label = isLight ? 'Trending' : 'Headline'

  const fontFamily = `${font.cssVar}, ${font.fallback}`

  return (
    <div style={{
      background: bg,
      padding: '1.5rem',
      flex: 1,
      minWidth: '280px',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    } as React.CSSProperties}>

      {/* Large header test — THE critical white-on-black test */}
      {!isLight && (
        <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: `1px solid ${borderColor}` }}>
          <div style={{
            fontFamily,
            fontSize: '2.4rem',
            fontWeight: font.weights.includes(400) ? 400 : font.weights[0],
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: '0.3rem',
          }}>
            {SAMPLE_LARGE_HEADLINE}
          </div>
          <div style={{
            fontFamily,
            fontSize: '1rem',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.75)',
            letterSpacing: '-0.01em',
            fontStyle: 'italic',
          }}>
            {SAMPLE_TAGLINE}
          </div>
        </div>
      )}

      {/* Light panel header — smaller version */}
      {isLight && (
        <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `1px solid ${borderColor}` }}>
          <div style={{
            fontFamily,
            fontSize: '1.4rem',
            fontWeight: font.weights.includes(400) ? 400 : font.weights[0],
            color: textPrimary,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}>
            {SAMPLE_LARGE_HEADLINE}
          </div>
          <div style={{
            fontFamily,
            fontSize: '0.8rem',
            fontWeight: 400,
            color: textSecondary,
            fontStyle: 'italic',
          }}>
            {SAMPLE_TAGLINE}
          </div>
        </div>
      )}

      {/* Column label */}
      <div style={{
        fontSize: '0.55rem',
        fontWeight: 700,
        color: RED,
        textTransform: 'uppercase',
        letterSpacing: '0.1rem',
        marginBottom: '0.75rem',
        paddingBottom: '0.4rem',
        borderBottom: `1px solid ${borderColor}`,
        fontFamily,
      }}>
        {label}
      </div>

      {/* Headline */}
      <div style={{
        fontFamily,
        fontSize: '1.1rem',
        fontWeight: font.weights.includes(600) ? 600 : font.weights[Math.min(1, font.weights.length - 1)],
        color: textPrimary,
        lineHeight: 1.3,
        marginBottom: '0.4rem',
        letterSpacing: '-0.01em',
      }}>
        {SAMPLE_HEADLINE}
      </div>

      {/* Subhead */}
      <div style={{
        fontFamily,
        fontSize: '0.85rem',
        fontWeight: font.weights.includes(500) ? 500 : 400,
        color: textSecondary,
        lineHeight: 1.4,
        marginBottom: '0.5rem',
        fontStyle: 'italic',
      }}>
        {SAMPLE_SUBHEAD}
      </div>

      {/* Body — the readability test */}
      <div style={{
        fontFamily,
        fontSize: '0.8rem',
        fontWeight: 400,
        color: textSecondary,
        lineHeight: 1.7,
        marginBottom: '0.6rem',
      }}>
        {SAMPLE_BODY}
      </div>

      {/* Meta row */}
      <div style={{
        fontFamily,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.4rem',
      }}>
        <span style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          color: RED,
          textTransform: 'uppercase',
          letterSpacing: '0.04rem',
        }}>
          {SAMPLE_META_LABEL}
        </span>
        <span style={{ fontSize: '0.6rem', color: textMuted }}>{SAMPLE_META_DATE}</span>
        <span style={{ fontSize: '0.6rem', color: textMuted }}>&middot; {SAMPLE_META_MOOD}</span>
      </div>

      {/* Smallest text */}
      <div style={{
        fontFamily,
        fontSize: '0.55rem',
        color: textMuted,
        borderTop: `1px solid ${borderColor}`,
        paddingTop: '0.35rem',
      }}>
        &#8593; <span style={{ color: isLight ? RED : '#E8857A', fontWeight: 500 }}>{SAMPLE_SMALL}</span>
      </div>

      {/* Weight comparison */}
      <div style={{
        marginTop: '1rem',
        paddingTop: '0.75rem',
        borderTop: `1px solid ${borderColor}`,
      }}>
        <div style={{ fontSize: '0.5rem', color: textMuted, marginBottom: '0.4rem', fontFamily }}>
          WEIGHT COMPARISON
        </div>
        {font.weights.map(weight => (
          <div key={weight} style={{
            fontFamily,
            fontSize: '0.75rem',
            fontWeight: weight,
            color: textPrimary,
            lineHeight: 1.8,
          }}>
            {weight} — The quick brown fox jumps over the lazy dog
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Font section ─────────────────────────────────────────────────────

function FontSection({ font, index }: { font: FontCandidate; index: number }) {
  const isHighlighted = font.tag === 'closest to vanity fair'

  return (
    <section style={{
      marginBottom: '2.5rem',
      border: isHighlighted ? `2px solid ${RED}` : '1px solid #E5E2DD',
    }}>
      {/* Font header */}
      <div style={{
        padding: '1rem 1.5rem',
        background: isHighlighted ? '#FFF5F5' : '#F9F8F6',
        borderBottom: isHighlighted ? `2px solid ${RED}` : '1px solid #E5E2DD',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <span style={{
            fontSize: '0.6rem',
            fontWeight: 700,
            color: RED,
            fontFamily: 'monospace',
          }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <h2 style={{
            margin: 0,
            fontSize: '1.3rem',
            fontWeight: 600,
            color: '#111',
            fontFamily: `${font.cssVar}, ${font.fallback}`,
          }}>
            {font.name}
          </h2>
          <span style={{
            fontSize: '0.6rem',
            fontWeight: 600,
            color: isHighlighted ? RED : '#9A9590',
            textTransform: 'uppercase',
            letterSpacing: '0.05rem',
          }}>
            {font.tag}
          </span>
        </div>
        <p style={{
          margin: '0.25rem 0 0',
          fontSize: '0.8rem',
          color: '#6B6560',
          lineHeight: 1.5,
        }}>
          {font.description}
          <br />
          <span style={{ fontStyle: 'italic', color: '#9A9590' }}>{font.personality}</span>
        </p>
      </div>

      {/* Light + Dark panels side by side */}
      <div style={{ display: 'flex' }}>
        <FontPanel font={font} mode="light" />
        <FontPanel font={font} mode="dark" />
      </div>
    </section>
  )
}

// ── Compare mode ─────────────────────────────────────────────────────

function CompareView({ fontA, fontB }: { fontA: FontCandidate; fontB: FontCandidate }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      {[fontA, fontB].map((font) => (
        <div key={font.name}>
          <h3 style={{
            margin: '0 0 0.75rem',
            fontSize: '1rem',
            fontWeight: 600,
            color: '#111',
            fontFamily: `${font.cssVar}, ${font.fallback}`,
          }}>
            {font.name}
          </h3>
          <div style={{ border: '1px solid #E5E2DD' }}>
            <FontPanel font={font} mode="light" />
            <FontPanel font={font} mode="dark" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────

export default function FontPreviewPage() {
  const [mode, setMode] = useState<'all' | 'compare'>('all')
  const [compareA, setCompareA] = useState(1) // default Bodoni Moda
  const [compareB, setCompareB] = useState(6) // default Playfair Display

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      padding: '2rem',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    } as React.CSSProperties}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Page header */}
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
            fontSize: '2.8rem',
            fontWeight: 400,
            color: '#111',
            margin: '0 0 0.5rem',
            letterSpacing: '-0.02em',
          }}>
            Serif Font Comparison
          </h1>
          <p style={{
            fontSize: '0.9rem',
            color: '#6B6560',
            margin: '0 0 0.5rem',
            lineHeight: 1.6,
          }}>
            Vanity Fair uses <strong>VF Didot</strong> (custom, commercial). The closest free match is{' '}
            <strong>Bodoni Moda</strong> — same Didot/Bodoni family, extreme thick-thin contrast, sharp
            hairlines. It&apos;s highlighted in red below.
          </p>
          <p style={{
            fontSize: '0.85rem',
            color: '#9A9590',
            margin: '0 0 1.5rem',
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}>
            Every font now renders the &ldquo;Notes / From story to story&rdquo; header in its own face,
            so you can directly compare how each handles large white text on black. Bodoni Moda and Playfair
            Display are both shown — is one sharper than the other for headlines?
          </p>

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              onClick={() => setMode('all')}
              style={{
                padding: '0.4rem 1rem',
                fontSize: '0.75rem',
                fontWeight: mode === 'all' ? 700 : 400,
                background: mode === 'all' ? '#111' : '#F3F2F0',
                color: mode === 'all' ? '#fff' : '#6B6560',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              All Fonts
            </button>
            <button
              onClick={() => setMode('compare')}
              style={{
                padding: '0.4rem 1rem',
                fontSize: '0.75rem',
                fontWeight: mode === 'compare' ? 700 : 400,
                background: mode === 'compare' ? '#111' : '#F3F2F0',
                color: mode === 'compare' ? '#fff' : '#6B6560',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Compare 2
            </button>
          </div>

          {/* Compare selectors */}
          {mode === 'compare' && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <select
                value={compareA}
                onChange={(e) => setCompareA(Number(e.target.value))}
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8rem',
                  border: '1px solid #D1CCC4',
                  background: '#fff',
                }}
              >
                {FONTS.map((f, i) => (
                  <option key={f.name} value={i}>{f.name}</option>
                ))}
              </select>
              <span style={{ fontSize: '0.8rem', color: '#9A9590' }}>vs</span>
              <select
                value={compareB}
                onChange={(e) => setCompareB(Number(e.target.value))}
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8rem',
                  border: '1px solid #D1CCC4',
                  background: '#fff',
                }}
              >
                {FONTS.map((f, i) => (
                  <option key={f.name} value={i}>{f.name}</option>
                ))}
              </select>
            </div>
          )}
        </header>

        {/* Content */}
        {mode === 'all' ? (
          FONTS.map((font, i) => (
            <FontSection key={font.name} font={font} index={i} />
          ))
        ) : (
          <CompareView fontA={FONTS[compareA]} fontB={FONTS[compareB]} />
        )}

        {/* Footer note */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#F9F8F6',
          border: '1px solid #E5E2DD',
          fontSize: '0.75rem',
          color: '#9A9590',
          lineHeight: 1.6,
        }}>
          <strong style={{ color: '#6B6560' }}>Strategy options:</strong>{' '}
          (A) <strong>Bodoni Moda for headlines + a body serif</strong> (Crimson Pro or Source Serif) for reading text.{' '}
          (B) <strong>Bodoni Moda everywhere</strong> — headlines and body (bold move, very editorial).{' '}
          (C) <strong>Keep Playfair for headlines</strong> + add a body serif for reading surfaces only.{' '}
          The &ldquo;Compare 2&rdquo; mode lets you put Bodoni Moda vs Playfair head to head.
        </div>
      </div>
    </div>
  )
}
