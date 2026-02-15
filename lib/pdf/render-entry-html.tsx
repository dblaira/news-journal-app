/**
 * Server-side HTML renderer for PDF generation.
 *
 * Produces self-contained HTML documents that can be passed to
 * Puppeteer's page.setContent(). All styles are inlined — no
 * external CSS files or network requests needed.
 *
 * NOTE: This file uses react-dom/server via dynamic import to avoid
 * Next.js SWC build errors. It must only be called from API routes
 * (server-side), never from client components.
 */
import { createElement } from 'react'
import { Entry, Version, WeeklyTheme } from '@/types'
import { LiteraryVersion, NewsVersion, PoeticVersion, FallbackVersion } from '@/components/version-renderers'

// Dynamic import of renderToString to bypass Next.js SWC restriction
async function renderToString(element: React.ReactElement): Promise<string> {
  const { renderToString: rts } = await import('react-dom/server')
  return rts(element)
}

// ─── Google Fonts link for Bodoni Moda (loaded in <head>) ──────────────
const GOOGLE_FONTS_LINK =
  'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap'

// ─── Print & base styles inlined in the document ───────────────────────
const BASE_STYLES = `
  /* Reset */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @page {
    size: letter;
    margin: 0.75in;
  }

  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 16px;
    line-height: 1.6;
    color: #1a1a1a;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Bodoni Moda CSS variable — mirrors what Next.js sets */
  :root {
    --font-bodoni-moda: 'Bodoni Moda', Georgia, 'Times New Roman', serif;
  }

  /* Orphan / widow control */
  p, li, blockquote {
    orphans: 3;
    widows: 3;
  }

  h1, h2, h3, h4 {
    break-after: avoid;
  }

  /* Version sections: try to keep together, but allow break if needed */
  .version-section {
    break-inside: avoid;
  }

  /* Force page break between entries in multi-export */
  .entry-boundary {
    break-before: page;
  }

  /* Entry header should stay with content */
  .entry-header {
    break-after: avoid;
    margin-bottom: 1.5rem;
  }

  /* Crimson divider */
  .divider {
    border: none;
    border-top: 2px solid #DC143C;
    margin: 1.5rem 0;
  }

  /* Category label */
  .category-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #DC143C;
    margin-bottom: 0.5rem;
  }

  /* Entry headline */
  .entry-headline {
    font-family: var(--font-bodoni-moda);
    font-size: 2.4rem;
    font-weight: 400;
    line-height: 1.15;
    letter-spacing: -0.01em;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }

  /* Subheading */
  .entry-subheading {
    font-size: 1.1rem;
    font-style: italic;
    color: #555;
    margin-bottom: 0.25rem;
  }

  /* Metadata line */
  .entry-meta {
    font-size: 0.8rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
  }

  /* Entry content (original journal text) */
  .entry-content {
    font-size: 1rem;
    line-height: 1.8;
    margin-bottom: 2rem;
  }
  .entry-content p { margin-bottom: 0.8rem; }
  .entry-content strong, .entry-content b { font-weight: 700; }
  .entry-content em, .entry-content i { font-style: italic; }
  .entry-content ul, .entry-content ol { margin-left: 1.5rem; margin-bottom: 0.8rem; }
  .entry-content li { margin-bottom: 0.3rem; }
  .entry-content blockquote {
    border-left: 3px solid #DC143C;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #555;
    font-style: italic;
  }
  .entry-content h1, .entry-content h2, .entry-content h3 {
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
  }

  /* Versions header */
  .versions-header {
    font-family: var(--font-bodoni-moda);
    font-size: 1.4rem;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #1a1a1a;
    text-align: center;
    margin: 2rem 0 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #ddd;
  }

  /* Weekly theme styles */
  .weekly-theme-headline {
    font-family: var(--font-bodoni-moda);
    font-size: 2.8rem;
    font-weight: 400;
    line-height: 1.15;
    text-align: center;
    margin-bottom: 1rem;
  }

  .weekly-theme-content {
    font-size: 1rem;
    line-height: 1.8;
    max-width: 650px;
    margin: 0 auto 2rem;
  }
`

// ─── Date formatter ────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ─── Version renderer (picks the right shared component) ───────────────
function VersionRenderer({ version }: { version: Version }) {
  if (version.name === 'literary') return <LiteraryVersion version={version} />
  if (version.name === 'news') return <NewsVersion version={version} />
  if (version.name === 'poetic') return <PoeticVersion version={version} />
  return <FallbackVersion version={version} />
}

// ─── Single entry document ─────────────────────────────────────────────
function EntryDocument({ entry }: { entry: Entry }) {
  return (
    <>
      <div className="entry-header">
        <div className="category-label">{entry.category}</div>
        <h1 className="entry-headline">{entry.headline}</h1>
        {entry.subheading && (
          <div className="entry-subheading">{entry.subheading}</div>
        )}
        <div className="entry-meta">
          {formatDate(entry.created_at)}
          {entry.mood && ` · Mood: ${entry.mood}`}
        </div>
      </div>

      <hr className="divider" />

      <div
        className="entry-content"
        dangerouslySetInnerHTML={{ __html: entry.content }}
      />

      {entry.versions && entry.versions.length > 0 && (
        <>
          <h2 className="versions-header">Enhanced Versions</h2>
          {entry.versions.map((version) => (
            <VersionRenderer key={version.name} version={version} />
          ))}
        </>
      )}
    </>
  )
}

// ─── Multi-entry document ──────────────────────────────────────────────
function MultiEntryDocument({ entries }: { entries: Entry[] }) {
  return (
    <>
      {/* Cover page */}
      <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h1 className="entry-headline" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          Journal Entries
        </h1>
        <div className="entry-meta" style={{ fontSize: '1rem' }}>
          Collection of {entries.length} entries
        </div>
        <div className="entry-meta">
          Exported {formatDate(new Date().toISOString())}
        </div>
      </div>

      {entries.map((entry, idx) => (
        <div key={entry.id} className={idx > 0 ? 'entry-boundary' : ''}>
          <EntryDocument entry={entry} />
        </div>
      ))}
    </>
  )
}

// ─── Weekly theme document ─────────────────────────────────────────────
function WeeklyThemeDocument({ theme, entries }: { theme: WeeklyTheme; entries: Entry[] }) {
  return (
    <>
      <div style={{ textAlign: 'center', paddingTop: '2rem', marginBottom: '2rem' }}>
        <div className="category-label">Weekly Theme</div>
        <h1 className="weekly-theme-headline">{theme.headline}</h1>
        <div className="entry-meta">
          {formatDate(theme.week_start_date)} — {formatDate(theme.created_at)}
        </div>
      </div>

      <hr className="divider" />

      {theme.theme_content && (
        <div
          className="weekly-theme-content"
          dangerouslySetInnerHTML={{ __html: theme.theme_content }}
        />
      )}

      <h2 className="versions-header">Entries This Week</h2>

      {entries.map((entry, idx) => (
        <div key={entry.id} className={idx > 0 ? 'entry-boundary' : ''}>
          <EntryDocument entry={entry} />
        </div>
      ))}
    </>
  )
}

// ─── Wrap JSX in a full HTML document ──────────────────────────────────
function wrapInDocument(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${GOOGLE_FONTS_LINK}" rel="stylesheet" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`
}

// ─── Public API ────────────────────────────────────────────────────────

export async function renderEntryHtml(entry: Entry): Promise<string> {
  const bodyHtml = await renderToString(<EntryDocument entry={entry} />)
  return wrapInDocument(bodyHtml)
}

export async function renderMultiEntryHtml(entries: Entry[]): Promise<string> {
  const bodyHtml = await renderToString(<MultiEntryDocument entries={entries} />)
  return wrapInDocument(bodyHtml)
}

export async function renderWeeklyThemeHtml(theme: WeeklyTheme, entries: Entry[]): Promise<string> {
  const bodyHtml = await renderToString(<WeeklyThemeDocument theme={theme} entries={entries} />)
  return wrapInDocument(bodyHtml)
}
