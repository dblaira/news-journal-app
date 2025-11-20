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
          background: 'var(--bg-panel)',
          maxWidth: '900px',
          width: '100%',
          marginTop: '2rem',
          marginBottom: '2rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-soft)',
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
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
            zIndex: 10,
            borderRadius: 'var(--radius-xs)',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
          }}
        >
          ✕ Close
        </button>
        
        <div style={{ padding: '2.5rem' }}>
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h1
              style={{
                fontSize: '2rem',
                fontFamily: "'Playfair Display', serif",
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
              }}
            >
              Write Your Headline
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Capture your story, your way
            </p>
          </div>
          
          <EntryForm onSuccess={onSuccess} onCancel={onCancel} />
        </div>
      </div>
    </div>
  )
}

