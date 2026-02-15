import { Version } from '@/types'

interface PoeticVersionProps {
  version: Version
  isMobile?: boolean
  /** Slot for wrapping content with SelectionToolbar + highlights in the modal */
  children?: React.ReactNode
}

export function PoeticVersion({ version, isMobile = false, children }: PoeticVersionProps) {
  const contentBody = children ?? (
    <div
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        fontStyle: 'italic',
        fontSize: '1.25rem',
        color: '#5c4b37',
        textAlign: 'center',
        whiteSpace: 'pre-wrap',
        lineHeight: 2,
        letterSpacing: '0.03em',
      }}
    >
      {version.content}
    </div>
  )

  return (
    <div
      className="version-section"
      style={{
        maxWidth: isMobile ? '100%' : '40rem',
        margin: '0 auto 2rem',
        padding: isMobile ? '2rem 1rem' : '3rem 4rem',
        background: '#f4ebd0',
        boxShadow: 'inset 0 0 80px rgba(139, 69, 19, 0.15), 0 10px 30px rgba(0,0,0,0.1)',
        borderRadius: '2px',
        minHeight: isMobile ? '250px' : '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <h4
        style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '3px',
          marginBottom: '2rem',
          color: '#8B7355',
        }}
      >
        {version.title}
      </h4>
      {contentBody}
    </div>
  )
}
