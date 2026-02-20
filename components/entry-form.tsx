'use client'

import { useState, useRef, useEffect } from 'react'
import { CreateEntryInput, Entry, EntryType, MAX_IMAGES_PER_ENTRY, EntryImage } from '@/types'
import { createEntry } from '@/app/actions/entries'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { useAutosaveDraft, getSavedDraft, clearDraft } from '@/lib/hooks/use-draft-autosave'
import { RestoreDraftDialog } from './draft-dialogs'

function hasTextContent(html: string): boolean {
  if (!html) return false
  return html.replace(/<[^>]*>/g, '').trim().length > 0
}

interface EntryFormProps {
  onSuccess: () => void
  onCancel: () => void
  onContentChange?: (hasContent: boolean) => void
}

interface FilePreview {
  file: File
  preview: string
  type: 'image' | 'pdf' | 'document' | 'spreadsheet'
}

const categories: CreateEntryInput['category'][] = [
  'Business',
  'Finance',
  'Health',
  'Spiritual',
  'Fun',
  'Social',
  'Romance',
]

const entryTypes: { id: EntryType; label: string }[] = [
  { id: 'story', label: 'Story' },
  { id: 'note', label: 'Note' },
  { id: 'action', label: 'Action' },
]

// Helper to determine file type category
function getFileType(mimeType: string): FilePreview['type'] {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') return 'spreadsheet'
  return 'document'
}

// Helper to get icon for file type
function getFileIcon(type: FilePreview['type']): string {
  switch (type) {
    case 'image': return '📷'
    case 'pdf': return '📄'
    case 'spreadsheet': return '📊'
    case 'document': return '📝'
    default: return '📎'
  }
}

// Accepted file types
const ACCEPTED_FILES = 'image/jpeg,image/jpg,image/png,image/webp,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function EntryForm({ onSuccess, onCancel, onContentChange }: EntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<FilePreview[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [formData, setFormData] = useState<CreateEntryInput>({
    headline: '',
    category: 'Business',
    subheading: '',
    content: '',
    mood: '',
    entry_type: 'story',
  })

  useAutosaveDraft('form', () => ({
    text: formData.content,
    headline: formData.headline,
    entryType: formData.entry_type,
  }))

  useEffect(() => {
    const draft = getSavedDraft('form')
    if (draft && (draft.text?.trim() || draft.headline?.trim())) {
      setShowRestoreDialog(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const has = formData.headline.trim().length > 0 || hasTextContent(formData.content)
    onContentChange?.(has)
  }, [formData.headline, formData.content, onContentChange])

  const handleResumeDraft = () => {
    const draft = getSavedDraft('form')
    if (draft) {
      setFormData(prev => ({
        ...prev,
        headline: draft.headline || prev.headline,
        content: draft.text || prev.content,
        entry_type: (draft.entryType as EntryType) || prev.entry_type,
      }))
    }
    setShowRestoreDialog(false)
  }

  const handleStartFresh = () => {
    clearDraft('form')
    setShowRestoreDialog(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    const newFiles: FilePreview[] = []
    const remainingSlots = MAX_IMAGES_PER_ENTRY - files.length

    for (let i = 0; i < Math.min(selectedFiles.length, remainingSlots); i++) {
      const file = selectedFiles[i]
      const fileType = getFileType(file.type)
      newFiles.push({
        file,
        preview: fileType === 'image' ? URL.createObjectURL(file) : '',
        type: fileType,
      })
    }

    setFiles([...files, ...newFiles])

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = (index: number) => {
    const fileItem = files[index]
    if (fileItem.preview) {
      URL.revokeObjectURL(fileItem.preview) // Clean up object URL for images
    }
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // Create entry first
      const result = await createEntry(formData)
      if (result.error) {
        setError(result.error)
        setIsSubmitting(false)
        return
      }

      // Upload files if provided
      if (files.length > 0 && result.data) {
        const imageFiles = files.filter(f => f.type === 'image')
        const documentFiles = files.filter(f => f.type !== 'image')

        // Upload images via upload-photo endpoint
        if (imageFiles.length > 0) {
          try {
            const photoFormData = new FormData()
            imageFiles.forEach((photo) => {
              photoFormData.append('files', photo.file)
            })
            photoFormData.append('entryId', result.data.id)

            const photoResponse = await fetch('/api/upload-photo', {
              method: 'POST',
              body: photoFormData,
            })

            if (!photoResponse.ok) {
              const photoError = await photoResponse.json()
              console.error('Photo upload failed:', photoError)
              alert(`Entry created, but image upload failed: ${photoError.error || 'Unknown error'}`)
            }
          } catch (photoErr: any) {
            console.error('Error uploading photos:', photoErr)
            alert(`Entry created, but image upload failed: ${photoErr.message || 'Network error'}`)
          }
        }

        // Upload documents via upload-document endpoint
        if (documentFiles.length > 0) {
          try {
            const docFormData = new FormData()
            documentFiles.forEach((doc) => {
              docFormData.append('files', doc.file)
            })
            docFormData.append('entryId', result.data.id)

            const docResponse = await fetch('/api/upload-document', {
              method: 'POST',
              body: docFormData,
            })

            if (!docResponse.ok) {
              const docError = await docResponse.json()
              console.error('Document upload failed:', docError)
              alert(`Entry created, but document upload failed: ${docError.error || 'Unknown error'}`)
            }
          } catch (docErr: any) {
            console.error('Error uploading documents:', docErr)
            alert(`Entry created, but document upload failed: ${docErr.message || 'Network error'}`)
          }
        }
      }

      // Clean up object URLs
      files.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview)
      })

      clearDraft('form')
      onSuccess()
    } catch (err) {
      setError('Failed to create entry. Please try again.')
      setIsSubmitting(false)
    }
  }

  const canAddMoreFiles = files.length < MAX_IMAGES_PER_ENTRY

  return (
    <section className="entry-form">
      <h2>Write Your Headline</h2>
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>
      )}
      <form id="journalForm" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-column">
            {/* Headline */}
            <div className="form-group">
              <label htmlFor="headline">Headline</label>
              <input
                type="text"
                id="headline"
                required
                placeholder="What's your big story today?"
                value={formData.headline}
                onChange={(e) =>
                  setFormData({ ...formData, headline: e.target.value })
                }
                disabled={isSubmitting}
              />
            </div>

            {/* Subheading */}
            <div className="form-group">
              <label htmlFor="subheading">Subheading (optional)</label>
              <input
                type="text"
                id="subheading"
                placeholder="Add context to your headline"
                value={formData.subheading}
                onChange={(e) =>
                  setFormData({ ...formData, subheading: e.target.value })
                }
                disabled={isSubmitting}
              />
            </div>

            {/* Category and Type row */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as CreateEntryInput['category'],
                    })
                  }
                  disabled={isSubmitting}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="entry_type">Type</label>
                <select
                  id="entry_type"
                  required
                  value={formData.entry_type || 'story'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      entry_type: e.target.value as EntryType,
                    })
                  }
                  disabled={isSubmitting}
                >
                  {entryTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-column">
            <div className="form-group">
              <label htmlFor="content">Your Story</label>
              <TiptapEditor
                key={`editor-${formData.entry_type}`}
                content={formData.content}
                onChange={(html) => setFormData({ ...formData, content: html })}
                variant="light"
                placeholder={formData.entry_type === 'action' ? 'Add your tasks...' : 'Write your journal entry here...'}
                editable={!isSubmitting}
                entryType={formData.entry_type}
              />
            </div>

            <div className="form-group">
              <label htmlFor="mood">Mood (optional)</label>
              <input
                type="text"
                id="mood"
                placeholder="e.g., motivated, reflective, excited"
                value={formData.mood}
                onChange={(e) =>
                  setFormData({ ...formData, mood: e.target.value })
                }
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="files">
                Attachments (optional) 
                <span style={{ 
                  fontWeight: 400, 
                  color: '#6B7280', 
                  marginLeft: '0.5rem',
                  fontSize: '0.85rem' 
                }}>
                  {files.length}/{MAX_IMAGES_PER_ENTRY} • Images, PDF, Excel, Word, CSV
                </span>
              </label>
              
              {/* File previews grid */}
              {files.length > 0 && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                }}>
                  {files.map((fileItem, index) => (
                    <div 
                      key={index}
                      style={{ 
                        position: 'relative',
                        paddingTop: '100%', // Square aspect ratio
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: fileItem.type === 'image' ? '#f3f4f6' : '#2D3748',
                      }}
                    >
                      {fileItem.type === 'image' ? (
                        <img
                          src={fileItem.preview}
                          alt={`Preview ${index + 1}`}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            padding: '0.5rem',
                          }}
                        >
                          <span style={{ fontSize: '2rem' }}>{getFileIcon(fileItem.type)}</span>
                          <span style={{ 
                            fontSize: '0.6rem', 
                            marginTop: '0.25rem',
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '100%',
                            padding: '0 0.25rem',
                          }}>
                            {fileItem.file.name.length > 12 
                              ? fileItem.file.name.substring(0, 10) + '...' 
                              : fileItem.file.name
                            }
                          </span>
                        </div>
                      )}
                      {/* First file badge (poster) */}
                      {index === 0 && fileItem.type === 'image' && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '0.25rem',
                            left: '0.25rem',
                            background: '#DC143C',
                            color: '#fff',
                            padding: '0.15rem 0.35rem',
                            borderRadius: '3px',
                            fontSize: '0.6rem',
                            fontWeight: 600,
                          }}
                        >
                          Poster
                        </div>
                      )}
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        disabled={isSubmitting}
                        style={{
                          position: 'absolute',
                          top: '0.25rem',
                          right: '0.25rem',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: 'none',
                          background: 'rgba(220, 20, 60, 0.9)',
                          color: '#fff',
                          fontSize: '12px',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add files button */}
              {canAddMoreFiles && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="files"
                    accept={ACCEPTED_FILES}
                    multiple
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: '#f8f9fb',
                      border: '2px dashed #ddd',
                      borderRadius: '8px',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      color: '#666',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.borderColor = '#DC143C'
                        e.currentTarget.style.color = '#DC143C'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#ddd'
                      e.currentTarget.style.color = '#666'
                    }}
                  >
                    📎 {files.length === 0 ? 'Add Files' : 'Add More Files'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Publishing...' : 'Publish Entry'}
          </button>
          <button
            type="button"
            id="cancelBtn"
            className="btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>

      {showRestoreDialog && (
        <RestoreDraftDialog
          onResume={handleResumeDraft}
          onStartFresh={handleStartFresh}
        />
      )}
    </section>
  )
}
