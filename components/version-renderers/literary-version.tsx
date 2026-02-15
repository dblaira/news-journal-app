import { Version } from '@/types'

interface LiteraryVersionProps {
  version: Version
  isMobile?: boolean
  /** Slot for wrapping content with SelectionToolbar + highlights in the modal */
  children?: React.ReactNode
}

export function LiteraryVersion({ version, isMobile = false, children }: LiteraryVersionProps) {
  const contentBody = children ?? (
    <div
      style={{
        fontFamily: "'Georgia', serif",
        fontSize: '1.25rem',
        lineHeight: 1.8,
        color: '#2c2c2c',
        textAlign: 'justify',
      }}
    >
      {/* Drop cap for first letter */}
      <span
        style={{
          float: 'left',
          fontSize: '3.5em',
          fontWeight: 'bold',
          lineHeight: 0.8,
          paddingRight: '8px',
          color: '#8b0000',
        }}
      >
        {version.content.charAt(0)}
      </span>
      <span style={{ whiteSpace: 'pre-wrap' }}>
        {version.content.slice(1)}
      </span>
    </div>
  )

  return (
    <div
      className="version-section"
      style={{
        maxWidth: isMobile ? '100%' : '650px',
        margin: '0 auto 2rem',
        padding: isMobile ? '1.5rem 1rem' : '2rem 3rem',
        background: '#FAF9F6',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
        minHeight: isMobile ? '300px' : '400px',
        position: 'relative',
      }}
    >
      <h4
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: '1.5rem',
          color: '#8B4513',
          textAlign: 'center',
        }}
      >
        {version.title}
      </h4>
      {contentBody}
      {/* Decorative separator */}
      <div
        style={{
          marginTop: '3rem',
          textAlign: 'center',
          color: '#9CA3AF',
          fontSize: '1.5rem',
        }}
      >
        ❦
      </div>
    </div>
  )
}
