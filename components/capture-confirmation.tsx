'use client'

import { useState, useRef } from 'react'
import { Entry, EntryType, ImageExtraction } from '@/types'

interface InferredData {
  headline: string
  subheading: string
  category: Entry['category']
  mood: string
  content: string
  entry_type: EntryType
  due_date: string | null
  // Multimodal fields from image capture
  image_url?: string
  image_extracted_data?: ImageExtraction
}

interface CaptureConfirmationProps {
  data: InferredData
  onPublish: (data: InferredData & { photo?: File }) => void
  onBack: () => void
  isPublishing: boolean
}

const entryTypes: { id: EntryType; label: string; icon: string }[] = [
  { id: 'story', label: 'Story', icon: '📖' },
  { id: 'action', label: 'Action', icon: '✓' },
  { id: 'note', label: 'Note', icon: '📝' },
]

const categories: Entry['category'][] = [
  'Business',
  'Finance',
  'Health',
  'Spiritual',
  'Fun',
  'Social',
  'Romance',
]

export function CaptureConfirmation({
  data,
  onPublish,
  onBack,
  isPublishing,
}: CaptureConfirmationProps) {
  const [headline, setHeadline] = useState(data.headline)
  const [subheading, setSubheading] = useState(data.subheading)
  const [category, setCategory] = useState(data.category)
  const [mood, setMood] = useState(data.mood)
  const [content, setContent] = useState(data.content)
  const [entryType, setEntryType] = useState<EntryType>(data.entry_type || 'story')
  const [dueDate, setDueDate] = useState<string>(data.due_date || '')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePublish = () => {
    onPublish({
      headline,
      subheading,
      category,
      mood,
      content,
      entry_type: entryType,
      due_date: entryType === 'action' && dueDate ? dueDate : null,
      photo: photoFile || undefined,
      // Pass through the multimodal image data (already uploaded)
      image_url: data.image_url,
      image_extracted_data: data.image_extracted_data,
    })
  }

  const fieldStyle = {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid transparent',
    padding: '0.25rem 0',
    width: '100%',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    color: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  }

  const fieldHoverStyle = {
    borderBottomColor: '#DC143C',
    cursor: 'text',
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2.5rem',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1rem',
              color: '#DC143C',
            }}
          >
            Review Your Entry
          </span>
        </div>

        {/* Headline - Editable */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08rem',
              color: '#999',
              display: 'block',
              marginBottom: '0.25rem',
            }}
          >
            Headline
          </label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            onFocus={() => setEditingField('headline')}
            onBlur={() => setEditingField(null)}
            style={{
              ...fieldStyle,
              fontSize: '2rem',
              fontFamily: "'Playfair Display', serif",
              fontWeight: 400,
              lineHeight: 1.2,
              borderBottomColor: editingField === 'headline' ? '#DC143C' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (editingField !== 'headline') {
                e.currentTarget.style.borderBottomColor = '#ddd'
              }
            }}
            onMouseLeave={(e) => {
              if (editingField !== 'headline') {
                e.currentTarget.style.borderBottomColor = 'transparent'
              }
            }}
          />
        </div>

        {/* Subheading - Editable */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08rem',
              color: '#999',
              display: 'block',
              marginBottom: '0.25rem',
            }}
          >
            Subheading
          </label>
          <input
            type="text"
            value={subheading}
            onChange={(e) => setSubheading(e.target.value)}
            onFocus={() => setEditingField('subheading')}
            onBlur={() => setEditingField(null)}
            placeholder="Add a subheading..."
            style={{
              ...fieldStyle,
              fontSize: '1.1rem',
              fontStyle: 'italic',
              color: '#666',
              borderBottomColor: editingField === 'subheading' ? '#DC143C' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (editingField !== 'subheading') {
                e.currentTarget.style.borderBottomColor = '#ddd'
              }
            }}
            onMouseLeave={(e) => {
              if (editingField !== 'subheading') {
                e.currentTarget.style.borderBottomColor = 'transparent'
              }
            }}
          />
        </div>

        {/* Category & Mood Row */}
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Category - Dropdown */}
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label
              style={{
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08rem',
                color: '#999',
                display: 'block',
                marginBottom: '0.25rem',
              }}
            >
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Entry['category'])}
              style={{
                ...fieldStyle,
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#DC143C',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right center',
                paddingRight: '1.5rem',
              }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Mood - Editable */}
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label
              style={{
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08rem',
                color: '#999',
                display: 'block',
                marginBottom: '0.25rem',
              }}
            >
              Mood
            </label>
            <input
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              onFocus={() => setEditingField('mood')}
              onBlur={() => setEditingField(null)}
              style={{
                ...fieldStyle,
                fontSize: '0.95rem',
                borderBottomColor: editingField === 'mood' ? '#DC143C' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (editingField !== 'mood') {
                  e.currentTarget.style.borderBottomColor = '#ddd'
                }
              }}
              onMouseLeave={(e) => {
                if (editingField !== 'mood') {
                  e.currentTarget.style.borderBottomColor = 'transparent'
                }
              }}
            />
          </div>
        </div>

        {/* Entry Type Pills */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08rem',
              color: '#999',
              display: 'block',
              marginBottom: '0.5rem',
            }}
          >
            Entry Type
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {entryTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setEntryType(type.id)}
                style={{
                  flex: 1,
                  padding: '0.6rem 1rem',
                  border: entryType === type.id ? '2px solid #DC143C' : '1px solid #ddd',
                  borderRadius: '6px',
                  background: entryType === type.id ? '#FDF2F4' : '#fff',
                  color: entryType === type.id ? '#DC143C' : '#666',
                  fontSize: '0.85rem',
                  fontWeight: entryType === type.id ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
                onMouseEnter={(e) => {
                  if (entryType !== type.id) {
                    e.currentTarget.style.borderColor = '#DC143C'
                    e.currentTarget.style.color = '#DC143C'
                  }
                }}
                onMouseLeave={(e) => {
                  if (entryType !== type.id) {
                    e.currentTarget.style.borderColor = '#ddd'
                    e.currentTarget.style.color = '#666'
                  }
                }}
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Due Date - Only shown for actions */}
        {entryType === 'action' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08rem',
                color: '#999',
                display: 'block',
                marginBottom: '0.25rem',
              }}
            >
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                ...fieldStyle,
                fontSize: '0.95rem',
                padding: '0.5rem',
                border: '1px solid #eee',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#DC143C'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#eee'
              }}
            />
            {dueDate && (
              <button
                type="button"
                onClick={() => setDueDate('')}
                style={{
                  marginLeft: '0.5rem',
                  padding: '0.3rem 0.6rem',
                  border: 'none',
                  background: 'transparent',
                  color: '#999',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Content - Editable */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08rem',
              color: '#999',
              display: 'block',
              marginBottom: '0.5rem',
            }}
          >
            Your Entry
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setEditingField('content')}
            onBlur={() => setEditingField(null)}
            rows={6}
            style={{
              ...fieldStyle,
              fontSize: '1rem',
              lineHeight: 1.7,
              resize: 'vertical',
              minHeight: '120px',
              border: '1px solid #eee',
              borderRadius: '4px',
              padding: '1rem',
              borderColor: editingField === 'content' ? '#DC143C' : '#eee',
            }}
          />
        </div>

        {/* Pre-attached Image from Capture Phase */}
        {data.image_url && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08rem',
                color: '#999',
                display: 'block',
                marginBottom: '0.5rem',
              }}
            >
              Attached Image
            </label>
            <div style={{ position: 'relative' }}>
              <img
                src={data.image_url}
                alt="Attached"
                style={{
                  width: '100%',
                  maxHeight: '200px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: '2px solid #DC143C',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  left: '0.5rem',
                  background: '#DC143C',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              >
                ✓ Uploaded
              </div>
            </div>
            
            {/* Show extracted data if available */}
            {data.image_extracted_data && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: '#f0f9ff',
                  borderRadius: '4px',
                  border: '1px solid #bae6fd',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                  🤖 AI Detected: {data.image_extracted_data.imageType}
                </div>
                {data.image_extracted_data.purchase && (
                  <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                    <strong>{data.image_extracted_data.purchase.productName}</strong>
                    <span style={{ color: '#6B7280' }}> • ${data.image_extracted_data.purchase.price} • {data.image_extracted_data.purchase.seller}</span>
                  </div>
                )}
                {data.image_extracted_data.receipt && (
                  <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                    <strong>{data.image_extracted_data.receipt.merchant}</strong>
                    <span style={{ color: '#6B7280' }}> • ${data.image_extracted_data.receipt.total}</span>
                  </div>
                )}
                {data.image_extracted_data.media && (
                  <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                    <strong>{data.image_extracted_data.media.title}</strong>
                    {data.image_extracted_data.media.author && (
                      <span style={{ color: '#6B7280' }}> by {data.image_extracted_data.media.author}</span>
                    )}
                  </div>
                )}
                {data.image_extracted_data.imageType === 'photo' && data.image_extracted_data.summary && (
                  <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                    {data.image_extracted_data.summary}
                  </div>
                )}
                {data.image_extracted_data.suggestedTags?.length > 0 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {data.image_extracted_data.suggestedTags.map((tag, i) => (
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
          </div>
        )}

        {/* Additional Photo Upload (optional, separate from captured image) */}
        {!data.image_url && (
          <div style={{ marginBottom: '2rem' }}>
            <label
              style={{
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08rem',
                color: '#999',
                display: 'block',
                marginBottom: '0.5rem',
              }}
            >
              Photo (Optional)
            </label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />

            {photoPreview ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{
                    width: '100%',
                    maxHeight: '200px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  padding: '1.5rem',
                  background: '#f8f9fb',
                  border: '2px dashed #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: '#666',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#DC143C'
                  e.currentTarget.style.color = '#DC143C'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#ddd'
                  e.currentTarget.style.color = '#666'
                }}
              >
                📷 Add Photo
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            borderTop: '1px solid #eee',
            paddingTop: '1.5rem',
          }}
        >
          <button
            type="button"
            onClick={onBack}
            disabled={isPublishing}
            style={{
              background: 'transparent',
              color: '#666',
              border: '1px solid #ddd',
              padding: '0.8rem 1.5rem',
              cursor: isPublishing ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.05rem',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
              opacity: isPublishing ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isPublishing) {
                e.currentTarget.style.borderColor = '#DC143C'
                e.currentTarget.style.color = '#DC143C'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#ddd'
              e.currentTarget.style.color = '#666'
            }}
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing || !headline.trim() || !content.trim()}
            style={{
              background: '#DC143C',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.8rem 2rem',
              cursor: isPublishing || !headline.trim() || !content.trim() ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.05rem',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
              opacity: isPublishing || !headline.trim() || !content.trim() ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isPublishing && headline.trim() && content.trim()) {
                e.currentTarget.style.background = '#B01030'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#DC143C'
            }}
          >
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}

