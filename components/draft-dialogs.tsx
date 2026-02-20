'use client'

interface UnsavedChangesDialogProps {
  onDiscard: () => void
  onCancel: () => void
}

export function UnsavedChangesDialog({ onDiscard, onCancel }: UnsavedChangesDialogProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          padding: '2rem',
          maxWidth: '340px',
          width: '100%',
          textAlign: 'center',
          borderRadius: '4px',
        }}
      >
        <p style={{
          fontSize: '1.05rem',
          fontWeight: 600,
          color: '#000',
          margin: '0 0 0.5rem 0',
        }}>
          Unsaved Changes
        </p>
        <p style={{
          fontSize: '0.9rem',
          color: '#666',
          margin: '0 0 1.5rem 0',
        }}>
          You have unsaved changes. Discard them?
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: '#fff',
              color: '#333',
              border: '1px solid #ddd',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.03rem',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onDiscard}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: '#DC143C',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.03rem',
            }}
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  )
}

interface RestoreDraftDialogProps {
  onResume: () => void
  onStartFresh: () => void
}

export function RestoreDraftDialog({ onResume, onStartFresh }: RestoreDraftDialogProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onResume()
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          padding: '2rem',
          maxWidth: '340px',
          width: '100%',
          textAlign: 'center',
          borderRadius: '4px',
        }}
      >
        <p style={{
          fontSize: '1.05rem',
          fontWeight: 600,
          color: '#000',
          margin: '0 0 0.5rem 0',
        }}>
          Resume Your Draft?
        </p>
        <p style={{
          fontSize: '0.9rem',
          color: '#666',
          margin: '0 0 1.5rem 0',
        }}>
          You have an unfinished entry. Pick up where you left off?
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={onStartFresh}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: '#fff',
              color: '#333',
              border: '1px solid #ddd',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.03rem',
            }}
          >
            Start Fresh
          </button>
          <button
            onClick={onResume}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: '#DC143C',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.03rem',
            }}
          >
            Resume
          </button>
        </div>
      </div>
    </div>
  )
}
