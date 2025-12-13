'use client'

import { useState } from 'react'
import { CreateEntryInput, Entry, EntryType } from '@/types'
import { createEntry } from '@/app/actions/entries'

interface EntryFormProps {
  onSuccess: () => void
  onCancel: () => void
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
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateEntryInput>({
    headline: '',
    category: 'Business',
    subheading: '',
    content: '',
    mood: '',
    entry_type: 'story',
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
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

      // Upload photo if provided
      if (photoFile && result.data) {
        try {
          const photoFormData = new FormData()
          photoFormData.append('file', photoFile)
          photoFormData.append('entryId', result.data.id)

          const photoResponse = await fetch('/api/upload-photo', {
            method: 'POST',
            body: photoFormData,
          })

          if (!photoResponse.ok) {
            const photoError = await photoResponse.json()
            console.error('Photo upload failed:', photoError)
            // Show warning but don't fail entry creation
            alert(`Entry created successfully, but photo upload failed: ${photoError.error || 'Unknown error'}. You can try uploading the photo again by editing the entry.`)
          } else {
            const photoData = await photoResponse.json()
            console.log('Photo uploaded successfully:', photoData.photoUrl)
          }
        } catch (photoErr: any) {
          console.error('Error uploading photo:', photoErr)
          // Show warning but don't fail entry creation
          alert(`Entry created successfully, but photo upload failed: ${photoErr.message || 'Network error'}. You can try uploading the photo again by editing the entry.`)
        }
      }

      onSuccess()
    } catch (err) {
      setError('Failed to create entry. Please try again.')
      setIsSubmitting(false)
    }
  }

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
              <textarea
                id="content"
                rows={12}
                required
                placeholder="Write your journal entry here..."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                disabled={isSubmitting}
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
              <label htmlFor="photo">Photo (optional)</label>
              <input
                type="file"
                id="photo"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handlePhotoChange}
                disabled={isSubmitting}
              />
              {photoPreview && (
                <div style={{ marginTop: '1rem' }}>
                  <img
                    src={photoPreview}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                    }}
                  />
                </div>
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

