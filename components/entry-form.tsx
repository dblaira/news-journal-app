'use client'

import { useState, useRef } from 'react'
import { CreateEntryInput, Entry, EntryType, MAX_IMAGES_PER_ENTRY } from '@/types'
import { createEntry } from '@/app/actions/entries'
import { TiptapEditor } from '@/components/editor/TiptapEditor'

interface EntryFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface PhotoPreview {
  file: File
  preview: string
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

export function EntryForm({ onSuccess, onCancel }: EntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState<PhotoPreview[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<CreateEntryInput>({
    headline: '',
    category: 'Business',
    subheading: '',
    content: '',
    mood: '',
    entry_type: 'story',
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPhotos: PhotoPreview[] = []
    const remainingSlots = MAX_IMAGES_PER_ENTRY - photos.length

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i]
      newPhotos.push({
        file,
        preview: URL.createObjectURL(file),
      })
    }

    setPhotos([...photos, ...newPhotos])

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = (index: number) => {
    const photo = photos[index]
    URL.revokeObjectURL(photo.preview) // Clean up object URL
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await createEntry(formData)
      if (result.error) {
        setError(result.error)
        setIsSubmitting(false)
        return
      }

      // Upload photos if provided
      if (photos.length > 0 && result.data) {
        try {
          const photoFormData = new FormData()
          photos.forEach((photo) => {
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
            // Show warning but don't fail entry creation
            alert(`Entry created successfully, but photo upload failed: ${photoError.error || 'Unknown error'}. You can try uploading the photos again by editing the entry.`)
          } else {
            const photoData = await photoResponse.json()
            console.log('Photos uploaded successfully:', photoData.uploadedUrls)
          }
        } catch (photoErr: any) {
          console.error('Error uploading photos:', photoErr)
          // Show warning but don't fail entry creation
          alert(`Entry created successfully, but photo upload failed: ${photoErr.message || 'Network error'}. You can try uploading the photos again by editing the entry.`)
        }
      }

      // Clean up object URLs
      photos.forEach((photo) => URL.revokeObjectURL(photo.preview))

      onSuccess()
    } catch (err) {
      setError('Failed to create entry. Please try again.')
      setIsSubmitting(false)
    }
  }

  const canAddMorePhotos = photos.length < MAX_IMAGES_PER_ENTRY

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
              <label htmlFor="photo">
                Photos (optional) 
                <span style={{ 
                  fontWeight: 400, 
                  color: '#6B7280', 
                  marginLeft: '0.5rem',
                  fontSize: '0.85rem' 
                }}>
                  {photos.length}/{MAX_IMAGES_PER_ENTRY}
                </span>
              </label>
              
              {/* Photo previews grid */}
              {photos.length > 0 && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                }}>
                  {photos.map((photo, index) => (
                    <div 
                      key={index}
                      style={{ 
                        position: 'relative',
                        paddingTop: '100%', // Square aspect ratio
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#f3f4f6',
                      }}
                    >
                      <img
                        src={photo.preview}
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
                      {/* First image badge */}
                      {index === 0 && (
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
                        onClick={() => handleRemovePhoto(index)}
                        disabled={isSubmitting}
                        style={{
                          position: 'absolute',
                          top: '0.25rem',
                          right: '0.25rem',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: 'none',
                          background: 'rgba(0, 0, 0, 0.6)',
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

              {/* Add photos button */}
              {canAddMorePhotos && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="photo"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={handlePhotoChange}
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
                    📷 {photos.length === 0 ? 'Add Photos' : 'Add More Photos'}
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
    </section>
  )
}
