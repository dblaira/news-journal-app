'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Entry, Version, MindMap, ReactFlowNode, ReactFlowEdge } from '@/types'
import { formatEntryDateLong, stripHtml } from '@/lib/utils'
import { getCategoryImage } from '@/lib/mindset'
import { incrementViewCount, removeEntryPhoto, togglePin, updateEntryContent } from '@/app/actions/entries'
import { TiptapEditor } from './editor/TiptapEditor'
import { generateMindMap, toReactFlowFormat } from '@/lib/mindmap/utils'

// Dynamic import for MindMapCanvas to avoid SSR issues with ReactFlow
const MindMapCanvas = dynamic(() => import('./mindmap/MindMapCanvas'), { ssr: false })

interface EntryModalProps {
  entry: Entry
  onClose: () => void
  onGenerateVersions: (id: string) => void
  onDeleteEntry: (id: string) => void
  onPhotoUpdated?: (entryId: string, photoUrl: string | null) => void
  onPinToggled?: (entryId: string, isPinned: boolean) => void
  onContentUpdated?: (entryId: string, content: string) => void
}

export function EntryModal({
  entry,
  onClose,
  onGenerateVersions,
  onDeleteEntry,
  onPhotoUpdated,
  onPinToggled,
  onContentUpdated,
}: EntryModalProps) {
  const formattedDate = formatEntryDateLong(entry.created_at)
  const hasVersions = Array.isArray(entry.versions) && entry.versions.length > 0
  const isGenerating = entry.generating_versions
  
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false)
  // Prefer image_url (from multimodal capture) over photo_url
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(entry.image_url || entry.photo_url)
  const [isPinned, setIsPinned] = useState(!!entry.pinned_at)
  const [isTogglingPin, setIsTogglingPin] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(entry.content)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Mind map state
  const [showMindMap, setShowMindMap] = useState(false)
  const [mindMapData, setMindMapData] = useState<{ nodes: ReactFlowNode[]; edges: ReactFlowEdge[]; title: string } | null>(null)
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false)

  // Track view when modal opens
  useEffect(() => {
    incrementViewCount(entry.id)
      .then((result) => {
        if (result.error) {
          console.error('Failed to increment view count:', result.error)
        }
      })
      .catch((error) => {
        console.error('Failed to increment view count:', error)
      })
  }, [entry.id])

  // Update local photo URL when entry changes (prefer image_url from multimodal capture)
  useEffect(() => {
    setCurrentPhotoUrl(entry.image_url || entry.photo_url)
  }, [entry.image_url, entry.photo_url])

  // Update pin state when entry changes
  useEffect(() => {
    setIsPinned(!!entry.pinned_at)
  }, [entry.pinned_at])

  // Update edited content when entry changes
  useEffect(() => {
    setEditedContent(entry.content)
    setIsEditing(false)
  }, [entry.id, entry.content])

  // Handle save content
  const handleSaveContent = async (content: string) => {
    setIsSaving(true)
    try {
      const result = await updateEntryContent(entry.id, content)
      if (result.error) {
        console.error('Failed to save content:', result.error)
        alert('Failed to save changes. Please try again.')
      } else {
        setLastSaved(new Date())
        onContentUpdated?.(entry.id, content)
      }
    } catch (error) {
      console.error('Failed to save content:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle cancel editing
  const handleCancelEdit = () => {
    setEditedContent(entry.content)
    setIsEditing(false)
  }

  // Handle mind map generation
  const handleGenerateMindMap = async () => {
    setIsGeneratingMindMap(true)
    try {
      // Strip HTML from content for cleaner LLM processing
      const plainText = stripHtml(entry.content)
      const textWithContext = `Title: ${entry.headline}\n${entry.subheading ? `Subtitle: ${entry.subheading}\n` : ''}Category: ${entry.category}\n\n${plainText}`
      
      const mindMap = await generateMindMap(textWithContext, entry.id)
      const { nodes, edges } = toReactFlowFormat(mindMap)
      
      setMindMapData({ nodes, edges, title: mindMap.title })
      setShowMindMap(true)
    } catch (error) {
      console.error('Failed to generate mind map:', error)
      alert('Failed to generate mind map. Please try again.')
    } finally {
      setIsGeneratingMindMap(false)
    }
  }

  // Handle manual save and exit edit mode
  const handleSaveAndClose = async () => {
    await handleSaveContent(editedContent)
    setIsEditing(false)
  }

  const handleTogglePin = async () => {
    setIsTogglingPin(true)
    const previousPinState = isPinned
    
    // Optimistic update
    setIsPinned(!isPinned)
    
    try {
      const result = await togglePin(entry.id)
      if (result.error) {
        // Revert on error
        setIsPinned(previousPinState)
        alert(result.error)
      } else {
        // Notify parent of pin change
        onPinToggled?.(entry.id, result.pinned ?? !previousPinState)
      }
    } catch (error) {
      // Revert on error
      setIsPinned(previousPinState)
      console.error('Failed to toggle pin:', error)
      alert('Failed to toggle pin. Please try again.')
    } finally {
      setIsTogglingPin(false)
    }
  }

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
            onClick={() => setIsEditing(!isEditing)}
            style={{
              background: isEditing ? '#2563EB' : 'transparent',
              color: isEditing ? '#FFFFFF' : '#2563EB',
              border: '1px solid #2563EB',
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
              e.currentTarget.style.background = '#2563EB'
              e.currentTarget.style.color = '#FFFFFF'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isEditing ? '#2563EB' : 'transparent'
              e.currentTarget.style.color = isEditing ? '#FFFFFF' : '#2563EB'
            }}
          >
            {isEditing ? 'Editing' : 'Edit'}
          </button>
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
            onClick={handleTogglePin}
            disabled={isTogglingPin}
            style={{
              background: isPinned ? '#228B22' : 'transparent',
              color: isPinned ? '#FFFFFF' : '#228B22',
              border: '1px solid #228B22',
              padding: '0.5rem 1rem',
              cursor: isTogglingPin ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              borderRadius: 0,
              fontWeight: 600,
              letterSpacing: '0.05rem',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
              opacity: isTogglingPin ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isTogglingPin) {
                e.currentTarget.style.background = '#228B22'
                e.currentTarget.style.color = '#FFFFFF'
              }
            }}
            onMouseLeave={(e) => {
              if (!isTogglingPin) {
                e.currentTarget.style.background = isPinned ? '#228B22' : 'transparent'
                e.currentTarget.style.color = isPinned ? '#FFFFFF' : '#228B22'
              }
            }}
          >
            {isTogglingPin ? '...' : isPinned ? 'Unpin' : 'Pin'}
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
              
              {/* Display AI-extracted data from multimodal capture */}
              {entry.image_extracted_data && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: '#f0f9ff',
                    borderRadius: '6px',
                    border: '1px solid #bae6fd',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    🤖 AI Detected: {entry.image_extracted_data.imageType}
                  </div>
                  
                  {/* New context-aware structure: userConnectionAnalysis */}
                  {entry.image_extracted_data.userConnectionAnalysis && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>
                        {entry.image_extracted_data.userConnectionAnalysis.whatTheyNoticedAbout}
                      </div>
                      {entry.image_extracted_data.userConnectionAnalysis.keyElements?.length > 0 && (
                        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.25rem' }}>
                          Key elements: {entry.image_extracted_data.userConnectionAnalysis.keyElements.join(' • ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* New structure: extractedText.titles */}
                  {entry.image_extracted_data.extractedText?.titles && entry.image_extracted_data.extractedText.titles.length > 0 && (
                    <div style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '0.5rem' }}>
                      <strong>Titles:</strong> {entry.image_extracted_data.extractedText.titles.join(', ')}
                    </div>
                  )}

                  {/* Purchase data (both old and new structure) */}
                  {entry.image_extracted_data.purchase?.detected && entry.image_extracted_data.purchase.productName && (
                    <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                      <strong>{entry.image_extracted_data.purchase.productName}</strong>
                      {entry.image_extracted_data.purchase.price && (
                        <span style={{ color: '#6B7280' }}> • ${entry.image_extracted_data.purchase.price}</span>
                      )}
                      {entry.image_extracted_data.purchase.seller && (
                        <span style={{ color: '#6B7280' }}> • {entry.image_extracted_data.purchase.seller}</span>
                      )}
                    </div>
                  )}

                  {/* Legacy purchase structure (for old entries) */}
                  {!entry.image_extracted_data.purchase?.detected && (entry.image_extracted_data as any).purchase?.productName && (
                    <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                      <strong>{(entry.image_extracted_data as any).purchase.productName}</strong>
                      <span style={{ color: '#6B7280' }}> • ${(entry.image_extracted_data as any).purchase.price} • {(entry.image_extracted_data as any).purchase.seller}</span>
                    </div>
                  )}

                  {/* Legacy receipt (for old entries) */}
                  {(entry.image_extracted_data as any).receipt?.merchant && (
                    <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                      <strong>{(entry.image_extracted_data as any).receipt.merchant}</strong>
                      <span style={{ color: '#6B7280' }}> • ${(entry.image_extracted_data as any).receipt.total}</span>
                    </div>
                  )}

                  {/* Legacy media (for old entries) */}
                  {(entry.image_extracted_data as any).media?.title && (
                    <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                      <strong>{(entry.image_extracted_data as any).media.title}</strong>
                      {(entry.image_extracted_data as any).media.author && (
                        <span style={{ color: '#6B7280' }}> by {(entry.image_extracted_data as any).media.author}</span>
                      )}
                    </div>
                  )}

                  {/* Legacy travel (for old entries) */}
                  {(entry.image_extracted_data as any).travel?.type && (
                    <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                      <strong>{(entry.image_extracted_data as any).travel.type}</strong>
                      {(entry.image_extracted_data as any).travel.destination && (
                        <span style={{ color: '#6B7280' }}> → {(entry.image_extracted_data as any).travel.destination}</span>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {entry.image_extracted_data.suggestedTags && entry.image_extracted_data.suggestedTags.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {entry.image_extracted_data.suggestedTags.map((tag: string, i: number) => (
                        <span
                          key={i}
                          style={{
                            background: '#e0f2fe',
                            color: '#0369a1',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '3px',
                            fontSize: '0.7rem',
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
            background: isEditing ? '#1a1a2e' : '#f8f9fb',
            border: isEditing ? '1px solid #374151' : '1px solid #dfe3ef',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2.5rem',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.2rem',
          }}>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: isEditing ? '#E5E7EB' : '#1c1f2e',
                margin: 0,
              }}
            >
              {isEditing ? '✏️ Editing Entry' : '📝 Your Original Entry'}
            </h3>
            {isEditing && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {lastSaved && (
                  <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                    {isSaving ? 'Saving...' : `Saved ${lastSaved.toLocaleTimeString()}`}
                  </span>
                )}
                <button
                  onClick={handleCancelEdit}
                  style={{
                    background: 'transparent',
                    color: '#9CA3AF',
                    border: '1px solid #4B5563',
                    padding: '0.4rem 0.8rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAndClose}
                  disabled={isSaving}
                  style={{
                    background: '#22C55E',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.4rem 0.8rem',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    fontWeight: 600,
                    opacity: isSaving ? 0.6 : 1,
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save & Close'}
                </button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <TiptapEditor
              content={editedContent}
              onChange={setEditedContent}
              onSave={handleSaveContent}
              editable={true}
              autoSaveDelay={2000}
            />
          ) : (
            <div
              className="rendered-content"
              onClick={() => setIsEditing(true)}
              style={{
                fontSize: '1rem',
                lineHeight: 1.85,
                color: '#1f2333',
                cursor: 'pointer',
              }}
              title="Click to edit"
              dangerouslySetInnerHTML={{ __html: entry.content }}
            />
          )}
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

            {entry.versions!.map((version: Version) => {
              // Literary/Personal Essay Style
              if (version.name === 'literary') {
                return (
                  <div
                    key={version.name}
                    style={{
                      maxWidth: '650px',
                      margin: '0 auto 2rem',
                      padding: '2rem 3rem',
                      background: '#FAF9F6',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                      minHeight: '400px',
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

              // News Feature Style
              if (version.name === 'news') {
                // Use structured headline/body if available
                // Fallback to splitting only if content looks like prose (not JSON/error)
                const contentLooksLikeJson = version.content.trim().startsWith('{') || version.content.trim().startsWith('[')
                const newsHeadline = version.headline || (contentLooksLikeJson ? 'News Feature' : version.content.split('\n')[0])
                const newsBody = version.body || (contentLooksLikeJson ? version.content : version.content.split('\n').slice(1).join('\n'))
                
                return (
                  <div
                    key={version.name}
                    style={{
                      maxWidth: '56rem',
                      margin: '0 auto 2rem',
                      background: '#F1F1F1',
                      color: '#000000',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      overflow: 'hidden',
                      minHeight: '400px',
                      border: '1px solid #D1D5DB',
                    }}
                  >
                    <div style={{ padding: '2rem 3rem' }}>
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
                            fontFamily: "'Playfair Display', 'Times New Roman', serif",
                            fontSize: '2.5rem',
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

                      {/* Article body with dateline */}
                      <div
                        style={{
                          fontFamily: "'Georgia', 'Times New Roman', serif",
                          textAlign: 'justify',
                          lineHeight: 1.6,
                          columnCount: 2,
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
                          <span style={{ whiteSpace: 'pre-wrap' }}>{newsBody}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }

              // Poetic Style
              if (version.name === 'poetic') {
                return (
                  <div
                    key={version.name}
                    style={{
                      maxWidth: '40rem',
                      margin: '0 auto 2rem',
                      padding: '3rem 4rem',
                      background: '#f4ebd0',
                      boxShadow: 'inset 0 0 80px rgba(139, 69, 19, 0.15), 0 10px 30px rgba(0,0,0,0.1)',
                      borderRadius: '2px',
                      minHeight: '400px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
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
                  </div>
                )
              }

              // Fallback for unknown styles
              return (
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
              )
            })}
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
              See your journal entry rewritten in 3 different styles by AI.
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
            <button
              onClick={handleGenerateMindMap}
              disabled={isGeneratingMindMap}
              style={{
                background: 'transparent',
                color: '#6B21A8',
                border: '1px solid #6B21A8',
                padding: '0.8rem 1.8rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.08rem',
                textTransform: 'uppercase',
                borderRadius: 0,
                cursor: isGeneratingMindMap ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isGeneratingMindMap ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isGeneratingMindMap) {
                  e.currentTarget.style.background = '#6B21A8'
                  e.currentTarget.style.color = '#FFFFFF'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#6B21A8'
              }}
            >
              {isGeneratingMindMap ? '🧠 Generating...' : '🧠 Mind Map'}
            </button>
          </div>
        )}
      </div>

      {/* Mind Map Modal */}
      {showMindMap && mindMapData && (
        <MindMapCanvas
          initialNodes={mindMapData.nodes}
          initialEdges={mindMapData.edges}
          title={mindMapData.title}
          onClose={() => setShowMindMap(false)}
        />
      )}
    </div>
  )
}

