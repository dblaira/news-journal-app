import { Version } from '@/types'

interface FallbackVersionProps {
  version: Version
  isMobile?: boolean
  /** Slot for wrapping content with SelectionToolbar + highlights in the modal */
  children?: React.ReactNode
}

export function FallbackVersion({ version, isMobile = false, children }: FallbackVersionProps) {
  const contentBody = children ?? (
    <div
      style={{
        fontSize: '1rem',
        lineHeight: 1.8,
        color: '#1b5e20',
        whiteSpace: 'pre-wrap',
      }}
    >
      {version.content}
    </div>
  )

  return (
    <div
      className="version-section"
      style={{
        background: '#f0f9f1',
        padding: isMobile ? '1rem' : '2rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        borderLeft: '4px solid #4CAF50',
      }}
    >
      <h4
        style={{
          fontSize: '1rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '1rem',
          color: '#2e7d32',
        }}
      >
        {version.title}
      </h4>
      {contentBody}
    </div>
  )
}
