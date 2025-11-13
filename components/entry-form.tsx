'use client'

import { useState } from 'react'
import { CreateEntryInput, Entry } from '@/types'
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

export function EntryForm({ onSuccess, onCancel }: EntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<CreateEntryInput>({
    headline: '',
    category: 'Business',
    subheading: '',
    content: '',
    mood: '',
  })

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

            <div className="form-group">
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

