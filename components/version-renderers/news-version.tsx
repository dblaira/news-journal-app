import { Version } from '@/types'

interface NewsVersionProps {
  version: Version
  isMobile?: boolean
  /** Slot for wrapping content with SelectionToolbar + highlights in the modal */
  children?: React.ReactNode
}

export function NewsVersion({ version, isMobile = false, children }: NewsVersionProps) {
  const contentLooksLikeJson = version.content.trim().startsWith('{') || version.content.trim().startsWith('[')
  const newsHeadline = version.headline || (contentLooksLikeJson ? 'News Feature' : version.content.split('\n')[0])
  const newsBody = version.body || (contentLooksLikeJson ? version.content : version.content.split('\n').slice(1).join('\n'))

  const contentBody = children ?? (
    <div
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        textAlign: isMobile ? 'left' : 'justify',
        lineHeight: 1.6,
        columnCount: isMobile ? 1 : 2,
        columnGap: '2rem',
      }}
    >
      <p style={{ marginBottom: '1rem' }}>
        <span
          style={{
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontWeight: 700,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginRight: '0.5rem',
            color: '#4B5563',
          }}
        >
          SPECIAL REPORT —
        </span>
        <span style={{ whiteSpace: 'pre-wrap' }}>
          {newsBody}
        </span>
      </p>
    </div>
  )

  return (
    <div
      className="version-section"
      style={{
        maxWidth: isMobile ? '100%' : '56rem',
        margin: '0 auto 2rem',
        background: '#F1F1F1',
        color: '#000000',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        minHeight: isMobile ? '300px' : '400px',
        border: '1px solid #D1D5DB',
        position: 'relative',
      }}
    >
      <div style={{ padding: isMobile ? '1.5rem 1rem' : '2rem 3rem' }}>
        <h4
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '1rem',
            color: '#6B7280',
            textAlign: 'center',
          }}
        >
          {version.title}
        </h4>
        {/* Double border headline */}
        <div
          style={{
            borderBottom: '3px double #000000',
            paddingBottom: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
              fontSize: '2.8rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              textAlign: 'center',
            }}
          >
            {newsHeadline}
          </h1>
        </div>
        {contentBody}
      </div>
    </div>
  )
}

/** Helper to extract the news body text for copy/highlight purposes */
export function getNewsBody(version: Version): string {
  const contentLooksLikeJson = version.content.trim().startsWith('{') || version.content.trim().startsWith('[')
  return version.body || (contentLooksLikeJson ? version.content : version.content.split('\n').slice(1).join('\n'))
}
