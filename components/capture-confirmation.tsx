'use client'

import { useState, useRef } from 'react'
import { Entry, EntryType, ImageExtraction, EntryMetadata, EntryImage } from '@/types'
import { EntryEnrichment } from '@/types/metadata'
import { TiptapEditor } from './editor/TiptapEditor'
import { ContextBuilder } from './context'

interface InferredData {
  headline: string
  subheading: string
  category: Entry['category']
  mood: string
  content: string
  entry_type: EntryType
  due_date: string | null
  connection_type?: string | null
  // Multimodal fields from image capture (legacy single image)
  image_url?: string
  image_extracted_data?: ImageExtraction
  // Multi-file gallery (new - includes images and documents)
  images?: EntryImage[]
  // Metadata fields
  metadata?: EntryMetadata
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
  { id: 'connection', label: 'Connection', icon: '🔗' },
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
  // Debug: log incoming data
  console.log('🔍 Confirmation screen - received data:', {
    hasImages: !!data.images,
    imagesCount: data.images?.length || 0,
    images: data.images,
    image_url: data.image_url,
  })
  const [headline, setHeadline] = useState(data.headline)
  const [subheading, setSubheading] = useState(data.subheading)
  const [category, setCategory] = useState(data.category)
  const [mood, setMood] = useState(data.mood)
  const [content, setContent] = useState(data.content)
  const [entryType, setEntryType] = useState<EntryType>(data.entry_type || 'story')
  const [connectionType, setConnectionType] = useState<string | null>(data.connection_type ?? null)
  const [dueDate, setDueDate] = useState<string>(data.due_date || '')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  
  // Enrichment fields for context metadata
  const [enrichment, setEnrichment] = useState<EntryEnrichment>(data.metadata?.enrichment || {})
  const [contextOrder, setContextOrder] = useState<string[]>(
    data.metadata?.enrichment?.context_order || ['environment', 'activity', 'energy', 'mood']
  )
  
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
    // Build metadata with enrichment (include context order)
    const enrichmentWithOrder = { ...enrichment, context_order: contextOrder }
    const hasEnrichment = enrichmentWithOrder.activity || enrichmentWithOrder.energy || enrichmentWithOrder.mood?.length || enrichmentWithOrder.environment || enrichmentWithOrder.trigger || enrichmentWithOrder.context_order?.length
    const finalMetadata: EntryMetadata | undefined = data.metadata || hasEnrichment ? {
      ...(data.metadata || {
        captured_at: new Date().toISOString(),
        day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        time_of_day: getTimeOfDay(),
        device: getDeviceType(),
      }),
      enrichment: hasEnrichment ? enrichmentWithOrder : undefined,
    } : undefined
    
    onPublish({
      headline,
      subheading,
      category,
      mood,
      content,
      entry_type: entryType,
      due_date: entryType === 'action' && dueDate ? dueDate : null,
      connection_type: entryType === 'connection' ? connectionType : null,
      photo: photoFile || undefined,
      // Pass through the multimodal image data (already uploaded)
      image_url: data.image_url,
      image_extracted_data: data.image_extracted_data,
      // Pass through the multi-file gallery (includes PDFs and documents)
      images: data.images,
      // Pass through the metadata with enrichment
      metadata: finalMetadata,
    })
  }
  
  // Helper to get time of day
  function getTimeOfDay(): string {
    const hour = new Date().getHours()
    if (hour < 6) return 'night'
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    if (hour < 21) return 'evening'
    return 'night'
  }
  
  // Helper to get device type
  function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop'
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
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
              fontSize: '2.3rem',
              fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
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
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            Entry Type
            {data.entry_type === 'action' && (
              <span
                style={{
                  fontSize: '0.6rem',
                  background: '#dcfce7',
                  color: '#166534',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '3px',
                  fontWeight: 600,
                }}
              >
                ✓ AI detected actionable intent
              </span>
            )}
            {data.entry_type === 'connection' && (
              <span
                style={{
                  fontSize: '0.6rem',
                  background: '#EDE9FE',
                  color: '#5B21B6',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '3px',
                  fontWeight: 600,
                }}
              >
                🔗 AI detected belief/principle
              </span>
            )}
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

        {/* Interactive Context Builder */}
        <ContextBuilder
          metadata={data.metadata}
          enrichment={enrichment}
          onEnrichmentChange={setEnrichment}
          contextOrder={contextOrder as ('environment' | 'activity' | 'energy' | 'mood' | 'trigger' | 'location')[]}
          onContextOrderChange={(newOrder) => {
            setContextOrder(newOrder)
            // Also update enrichment so it's saved with the entry
            setEnrichment(prev => ({ ...prev, context_order: newOrder }))
          }}
          defaultExpanded={true}
        />

        {/* AI Detected Section - Show extracted document content */}
        {data.images && data.images.some(img => img.extracted_data?.imageType === 'document' && img.extracted_data?.combinedNarrative) && (
          <div style={{ 
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
            border: '1px solid #C7D2FE',
            borderRadius: '8px',
            padding: '1rem',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
            }}>
              <span style={{ fontSize: '1.2rem' }}>✨</span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08rem',
                color: '#6366F1',
              }}>
                AI Detected from Documents
              </span>
            </div>
            
            {data.images.filter(img => img.extracted_data?.imageType === 'document').map((doc, idx) => {
              const text = doc.extracted_data?.combinedNarrative || ''
              const isLongText = text.length > 300
              const displayText = isLongText ? text.substring(0, 300) + '...' : text
              
              return (
                <div key={idx} style={{
                  background: '#FFFFFF',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  marginBottom: idx < data.images!.filter(img => img.extracted_data?.imageType === 'document').length - 1 ? '0.5rem' : 0,
                  fontSize: '0.85rem',
                  color: '#374151',
                  lineHeight: 1.5,
                }}>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    color: '#6B7280', 
                    marginBottom: '0.5rem',
                    fontWeight: 600,
                  }}>
                    📄 Document {idx + 1}
                  </div>
                  <pre style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'inherit',
                    fontSize: '0.8rem',
                    maxHeight: '150px',
                    overflowY: 'auto',
                  }}>
                    {displayText || 'No text extracted'}
                  </pre>
                </div>
              )
            })}
            
            <p style={{
              margin: '0.75rem 0 0 0',
              fontSize: '0.75rem',
              color: '#6366F1',
              fontStyle: 'italic',
            }}>
              💡 Review and edit the headline, category, and entry type above based on this content.
            </p>
          </div>
        )}

        {/* Content */}
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
            {entryType === 'connection' ? 'Your Connection' : 'Your Entry'}
          </label>
          {entryType === 'connection' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="A short belief, principle, or identity statement..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '1rem',
                border: '1px solid #eee',
                borderRadius: '4px',
                fontSize: '1.05rem',
                lineHeight: 1.6,
                fontStyle: 'italic',
                color: '#1a1a1a',
                resize: 'vertical',
                outline: 'none',
                background: '#FAFAF5',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#7C3AED' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#eee' }}
            />
          ) : (
            <div
              style={{
                border: '1px solid #eee',
                borderRadius: '4px',
                overflow: 'hidden',
                background: '#fff',
              }}
            >
              <TiptapEditor
                key={`editor-${entryType}`}
                content={content}
                onChange={(html) => setContent(html)}
                variant="light"
                placeholder={entryType === 'action' ? 'Add your tasks...' : 'Write your entry...'}
                entryType={entryType}
              />
            </div>
          )}
        </div>

        {/* Connection Type (shown for connections) */}
        {entryType === 'connection' && connectionType && (
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
              Connection Type
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {([
                { id: 'identity_anchor', label: 'Identity Anchor', color: '#7C3AED' },
                { id: 'pattern_interrupt', label: 'Pattern Interrupt', color: '#D97706' },
                { id: 'validated_principle', label: 'Validated Principle', color: '#059669' },
                { id: 'process_anchor', label: 'Process Anchor', color: '#2563EB' },
              ] as const).map((ct) => (
                <button
                  key={ct.id}
                  type="button"
                  onClick={() => setConnectionType(ct.id)}
                  style={{
                    padding: '0.5rem 0.8rem',
                    border: connectionType === ct.id ? `2px solid ${ct.color}` : '1px solid #ddd',
                    borderRadius: '6px',
                    background: connectionType === ct.id ? `${ct.color}10` : '#fff',
                    color: connectionType === ct.id ? ct.color : '#666',
                    fontSize: '0.8rem',
                    fontWeight: connectionType === ct.id ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>
        )}

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
                <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  🤖 AI Detected: {data.image_extracted_data.imageType}
                </div>
                
                {/* New context-aware structure: userConnectionAnalysis */}
                {data.image_extracted_data.userConnectionAnalysis && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>
                      {data.image_extracted_data.userConnectionAnalysis.whatTheyNoticedAbout}
                    </div>
                    {data.image_extracted_data.userConnectionAnalysis.keyElements?.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.25rem' }}>
                        Key elements: {data.image_extracted_data.userConnectionAnalysis.keyElements.join(' • ')}
                      </div>
                    )}
                  </div>
                )}

                {/* New structure: extractedText.titles */}
                {data.image_extracted_data.extractedText?.titles && data.image_extracted_data.extractedText.titles.length > 0 && (
                  <div style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '0.5rem' }}>
                    <strong>Titles:</strong> {data.image_extracted_data.extractedText.titles.join(', ')}
                  </div>
                )}

                {/* Purchase data (new structure with detected flag) */}
                {data.image_extracted_data.purchase?.detected && data.image_extracted_data.purchase.productName && (
                  <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                    <strong>{data.image_extracted_data.purchase.productName}</strong>
                    {data.image_extracted_data.purchase.price && (
                      <span style={{ color: '#6B7280' }}> • ${data.image_extracted_data.purchase.price}</span>
                    )}
                    {data.image_extracted_data.purchase.seller && (
                      <span style={{ color: '#6B7280' }}> • {data.image_extracted_data.purchase.seller}</span>
                    )}
                  </div>
                )}

                {/* Legacy purchase structure (for backwards compat) */}
                {!data.image_extracted_data.purchase?.detected && (data.image_extracted_data as any).purchase?.productName && (
                  <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                    <strong>{(data.image_extracted_data as any).purchase.productName}</strong>
                    <span style={{ color: '#6B7280' }}> • ${(data.image_extracted_data as any).purchase.price} • {(data.image_extracted_data as any).purchase.seller}</span>
                  </div>
                )}

                {/* Legacy receipt */}
                {(data.image_extracted_data as any).receipt?.merchant && (
                  <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                    <strong>{(data.image_extracted_data as any).receipt.merchant}</strong>
                    <span style={{ color: '#6B7280' }}> • ${(data.image_extracted_data as any).receipt.total}</span>
                  </div>
                )}

                {/* Legacy media */}
                {(data.image_extracted_data as any).media?.title && (
                  <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                    <strong>{(data.image_extracted_data as any).media.title}</strong>
                    {(data.image_extracted_data as any).media.author && (
                      <span style={{ color: '#6B7280' }}> by {(data.image_extracted_data as any).media.author}</span>
                    )}
                  </div>
                )}

                {/* Legacy summary for photos */}
                {data.image_extracted_data.imageType === 'photo' && (data.image_extracted_data as any).summary && (
                  <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                    {(data.image_extracted_data as any).summary}
                  </div>
                )}

                {/* Tags */}
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

        {/* Attached Files Section - Show all files from the images array */}
        {(data.images && data.images.length > 0) && (
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
              Attached Files ({data.images.length})
            </label>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '0.75rem',
            }}>
              {data.images.map((file, index) => {
                // Determine if it's an image or document based on URL or extracted_data
                const isDocument = file.extracted_data?.imageType === 'document' ||
                  file.url.includes('/documents/') ||
                  file.url.match(/\.(pdf|csv|xlsx|docx|doc|xls)$/i)
                
                // Get filename from URL
                const urlParts = file.url.split('/')
                const filename = urlParts[urlParts.length - 1].split('-').slice(1).join('-') || 'File'
                const displayName = decodeURIComponent(filename).replace(/_/g, ' ')
                
                // Determine icon based on file type
                const getFileIcon = () => {
                  if (file.url.includes('.pdf')) return '📄'
                  if (file.url.includes('.csv')) return '📊'
                  if (file.url.includes('.xlsx') || file.url.includes('.xls')) return '📊'
                  if (file.url.includes('.docx') || file.url.includes('.doc')) return '📝'
                  return '📎'
                }
                
                return (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: file.is_poster ? '2px solid #DC143C' : '1px solid #eee',
                      background: isDocument ? '#2D3748' : '#f3f4f6',
                    }}
                  >
                    {isDocument ? (
                      // Document preview
                      <div
                        style={{
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '100px',
                          color: '#FFFFFF',
                        }}
                      >
                        <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                          {getFileIcon()}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '100%',
                            padding: '0 0.25rem',
                          }}
                          title={displayName}
                        >
                          {displayName.length > 18 ? displayName.substring(0, 16) + '...' : displayName}
                        </span>
                      </div>
                    ) : (
                      // Image preview
                      <img
                        src={file.url}
                        alt={`Attached ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100px',
                          objectFit: 'cover',
                        }}
                      />
                    )}
                    
                    {/* Poster badge */}
                    {file.is_poster && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '0.25rem',
                          left: '0.25rem',
                          background: '#DC143C',
                          color: '#FFFFFF',
                          padding: '0.15rem 0.35rem',
                          borderRadius: '3px',
                          fontSize: '0.6rem',
                          fontWeight: 600,
                        }}
                      >
                        Poster
                      </div>
                    )}
                    
                    {/* Uploaded badge */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0.25rem',
                        right: '0.25rem',
                        background: 'rgba(34, 197, 94, 0.9)',
                        color: '#FFFFFF',
                        padding: '0.15rem 0.35rem',
                        borderRadius: '3px',
                        fontSize: '0.55rem',
                        fontWeight: 600,
                      }}
                    >
                      ✓
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Photo Upload - Only show if NO files attached yet */}
        {!data.image_url && (!data.images || data.images.length === 0) && (
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

