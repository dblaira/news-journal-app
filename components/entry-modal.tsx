'use client'

import { Entry, Version } from '@/types'
import { formatEntryDateLong } from '@/lib/utils'
import { useState } from 'react'

interface EntryModalProps {
  entry: Entry
  onClose: () => void
  onGenerateVersions: (id: string) => void
}

export function EntryModal({
  entry,
  onClose,
  onGenerateVersions,
}: EntryModalProps) {
  const formattedDate = formatEntryDateLong(entry.created_at)
  const hasVersions = Array.isArray(entry.versions) && entry.versions.length > 0
  const isGenerating = entry.generating_versions

  return (
    <div
      className="modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '2rem',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        style={{
          background: 'white',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '3rem',
          position: 'relative',
          borderRadius: '8px',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: '#000',
            color: 'white',
            border: 'none',
            padding: '0.6rem 1.2rem',
            cursor: 'pointer',
            fontSize: '1rem',
            zIndex: 10,
            borderRadius: '4px',
            fontWeight: 600,
          }}
        >
          Close
        </button>

        <div style={{ marginBottom: '1rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            {entry.category}
          </span>
        </div>

        <h2
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: '0.5rem',
          }}
        >
          {entry.headline}
        </h2>

        {entry.subheading && (
          <p
            style={{
              fontSize: '1.2rem',
              color: '#666',
              fontStyle: 'italic',
              marginBottom: '1.5rem',
            }}
          >
            {entry.subheading}
          </p>
        )}

        <div
          style={{
            fontSize: '0.9rem',
            color: '#666',
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #ddd',
          }}
        >
          <div>{formattedDate}</div>
          {entry.mood && (
            <div style={{ marginTop: '0.5rem' }}>Mood: {entry.mood}</div>
          )}
        </div>

        {/* Original Entry */}
        <div
          style={{
            background: '#f8f9fb',
            border: '1px solid #dfe3ef',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2.5rem',
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '1.2rem',
              color: '#1c1f2e',
            }}
          >
            📝 Your Original Entry
          </h3>
          <div
            style={{
              fontSize: '1rem',
              lineHeight: 1.85,
              color: '#1f2333',
              whiteSpace: 'pre-wrap',
            }}
          >
            {entry.content}
          </div>
        </div>

        {/* Versions Section */}
        {isGenerating ? (
          <div
            style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              padding: '2rem',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#856404',
              margin: '2rem 0',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Generating AI Versions...</h3>
            <p style={{ margin: 0 }}>
              This takes about 10-15 seconds. The page will update when ready.
            </p>
          </div>
        ) : hasVersions ? (
          <div style={{ marginTop: '2rem' }}>
            <h3
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '2rem',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              ✨ AI Generated Versions ✨
            </h3>

            {entry.versions!.map((version: Version) => (
              <div
                key={version.name}
                style={{
                  background: '#f0f9f1',
                  padding: '2rem',
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
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              background: '#e3f2fd',
              border: '1px solid #2196F3',
              padding: '2rem',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#0d47a1',
              margin: '2rem 0',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✨</div>
            <h3 style={{ margin: '0 0 1rem 0' }}>Generate AI Versions</h3>
            <p style={{ margin: '0 0 1.5rem 0' }}>
              See your journal entry rewritten in 4 different styles by AI.
            </p>
            <button
              onClick={() => {
                onClose()
                onGenerateVersions(entry.id)
              }}
              style={{
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              ✨ Generate Versions Now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

