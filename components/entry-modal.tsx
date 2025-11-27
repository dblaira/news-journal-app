'use client'

import { useEffect, useRef, useState } from 'react'
import { Entry, Version } from '@/types'
import { formatEntryDateLong } from '@/lib/utils'
import { getCategoryImage } from '@/lib/mindset'
import { incrementViewCount, removeEntryPhoto } from '@/app/actions/entries'

interface EntryModalProps {
  entry: Entry
  onClose: () => void
  onGenerateVersions: (id: string) => void
  onDeleteEntry: (id: string) => void
  onPhotoUpdated?: (entryId: string, photoUrl: string | null) => void
}

export function EntryModal({
  entry,
  onClose,
  onGenerateVersions,
  onDeleteEntry,
  onPhotoUpdated,
}: EntryModalProps) {
  const formattedDate = formatEntryDateLong(entry.created_at)
  const hasVersions = Array.isArray(entry.versions) && entry.versions.length > 0
  const isGenerating = entry.generating_versions
  
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false)
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(entry.photo_url)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Track view when modal opens
  useEffect(() => {
    incrementViewCount(entry.id).catch((error) => {
      console.error('Failed to increment view count:', error)
    })
  }, [entry.id])

  // Update local photo URL when entry changes
  useEffect(() => {
    setCurrentPhotoUrl(entry.photo_url)
  }, [entry.photo_url])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entryId', entry.id)

      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload photo')
      }

      const data = await response.json()
      setCurrentPhotoUrl(data.photoUrl)
      onPhotoUpdated?.(entry.id, data.photoUrl)
    } catch (error: any) {
      console.error('Error uploading photo:', error)
      alert(`Failed to upload photo: ${error.message || 'Unknown error'}`)
    } finally {
      setIsUploadingPhoto(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove this photo?')) return

    setIsRemovingPhoto(true)
    try {
      const result = await removeEntryPhoto(entry.id)
      if (result.error) {
        throw new Error(result.error)
      }
      setCurrentPhotoUrl(undefined)
      onPhotoUpdated?.(entry.id, null)
    } catch (error: any) {
      console.error('Error removing photo:', error)
      alert(`Failed to remove photo: ${error.message || 'Unknown error'}`)
    } finally {
      setIsRemovingPhoto(false)
    }
  }

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
          background: '#FFFFFF',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '3rem',
          position: 'relative',
          borderRadius: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          gap: '0.5rem',
          zIndex: 10,
        }}>
          <button
            onClick={() => onDeleteEntry(entry.id)}
            style={{
              background: 'transparent',
              color: '#DC143C',
              border: '1px solid #DC143C',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              borderRadius: 0,
              fontWeight: 600,
              letterSpacing: '0.05rem',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#DC143C'
              e.currentTarget.style.color = '#FFFFFF'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#DC143C'
            }}
          >
            Delete
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: '#000000',
              border: '1px solid rgba(0,0,0,0.2)',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
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
            Close
          </button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1rem',
              color: '#DC143C',
            }}
          >
            {entry.category}
          </span>
        </div>

        <h2
          style={{
            fontSize: '2.8rem',
            fontFamily: "'Playfair Display', serif",
            fontWeight: 400,
            lineHeight: 1.15,
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em',
            color: '#000000',
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

        {/* Hidden file input for photo upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handlePhotoUpload}
          style={{ display: 'none' }}
        />

        {/* Photo Section */}
        <div style={{ marginBottom: '2rem' }}>
          {currentPhotoUrl ? (
            <>
              <img
                src={currentPhotoUrl}
                alt={entry.headline}
                onError={(e) => {
                  console.error('Image failed to load:', currentPhotoUrl)
                  e.currentTarget.style.display = 'none'
                }}
                style={{
                  width: '100%',
                  maxHeight: '400px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                }}
              />
              <div style={{ 
                marginTop: '0.75rem', 
                display: 'flex', 
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  style={{
                    background: 'transparent',
                    color: '#666',
                    border: '1px solid #ddd',
                    padding: '0.4rem 0.8rem',
                    cursor: isUploadingPhoto ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    opacity: isUploadingPhoto ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isUploadingPhoto) {
                      e.currentTarget.style.borderColor = '#DC143C'
                      e.currentTarget.style.color = '#DC143C'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#ddd'
                    e.currentTarget.style.color = '#666'
                  }}
                >
                  {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
                </button>
                <button
                  onClick={handleRemovePhoto}
                  disabled={isRemovingPhoto}
                  style={{
                    background: 'transparent',
                    color: '#DC143C',
                    border: '1px solid #DC143C',
                    padding: '0.4rem 0.8rem',
                    cursor: isRemovingPhoto ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    opacity: isRemovingPhoto ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isRemovingPhoto) {
                      e.currentTarget.style.background = '#DC143C'
                      e.currentTarget.style.color = '#FFFFFF'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#DC143C'
                  }}
                >
                  {isRemovingPhoto ? 'Removing...' : 'Remove Photo'}
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              style={{
                width: '100%',
                padding: '2rem',
                background: '#f8f9fb',
                border: '2px dashed #ddd',
                borderRadius: '8px',
                cursor: isUploadingPhoto ? 'not-allowed' : 'pointer',
                color: '#666',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                opacity: isUploadingPhoto ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isUploadingPhoto) {
                  e.currentTarget.style.borderColor = '#DC143C'
                  e.currentTarget.style.color = '#DC143C'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#ddd'
                e.currentTarget.style.color = '#666'
              }}
            >
              {isUploadingPhoto ? 'Uploading...' : '📷 Click to Add Photo'}
            </button>
          )}
        </div>

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
                background: '#DC143C',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.8rem 1.8rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.08rem',
                textTransform: 'uppercase',
                borderRadius: 0,
                cursor: 'pointer',
                marginRight: '1rem',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#B01030'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#DC143C'
              }}
            >
              ✨ Generate Versions Now
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/export-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'entry', entryIds: [entry.id] }),
                  })
                  if (response.ok) {
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `entry-${entry.id}.pdf`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                  } else {
                    alert('Failed to export PDF')
                  }
                } catch (error) {
                  console.error('Error exporting PDF:', error)
                  alert('Failed to export PDF')
                }
              }}
              style={{
                background: 'transparent',
                color: '#000000',
                border: '1px solid rgba(0,0,0,0.2)',
                padding: '0.8rem 1.8rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.08rem',
                textTransform: 'uppercase',
                borderRadius: 0,
                cursor: 'pointer',
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
              📄 Export PDF
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

