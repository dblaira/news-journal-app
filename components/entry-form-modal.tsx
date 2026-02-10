'use client'

import { EntryForm } from './entry-form'

interface EntryFormModalProps {
  onSuccess: () => void
  onCancel: () => void
}

export function EntryFormModal({ onSuccess, onCancel }: EntryFormModalProps) {
  return (
    <div
      className="entry-form-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        zIndex: 2000,
        padding: '2rem',
        overflowY: 'auto',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel()
        }
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          maxWidth: '900px',
          width: '100%',
          marginTop: '2rem',
          marginBottom: '2rem',
          borderRadius: 0,
          border: 'none',
          boxShadow: 'none',
          position: 'relative',
          maxHeight: 'calc(100vh - 4rem)',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'transparent',
            color: '#000000',
            border: '1px solid rgba(0,0,0,0.2)',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontSize: '0.85rem',
            zIndex: 10,
            borderRadius: 0,
            fontWeight: 600,
            letterSpacing: '0.05rem',
            textTransform: 'uppercase',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#DC143C'
            e.currentTarget.style.color = '#FFFFFF'
            e.currentTarget.style.borderColor = '#DC143C'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#000000'
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'
          }}
        >
          ✕ Close
        </button>
        
        <div style={{ padding: '2.5rem' }}>
          <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
            <h1
              style={{
                fontSize: '2.5rem',
                fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
                color: '#000000',
                marginBottom: '0.5rem',
                fontWeight: 400,
                letterSpacing: '-0.02em',
              }}
            >
              Write Your Headline
            </h1>
            <p style={{ color: '#666666', fontSize: '1rem' }}>
              Capture your story, your way
            </p>
          </div>
          
          <EntryForm onSuccess={onSuccess} onCancel={onCancel} />
        </div>
      </div>
    </div>
  )
}

