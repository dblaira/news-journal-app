// components/capture/ImageAttachmentButton.tsx

'use client'

import { useRef } from 'react'
import { ImageAttachment } from '@/types/multimodal'
import { MAX_IMAGES_PER_ENTRY } from '@/types'

interface ImageAttachmentButtonProps {
  attachments: ImageAttachment[]
  onAttach: (attachment: ImageAttachment) => void
  onRemove: (index: number) => void
  disabled?: boolean
  maxImages?: number
}

export default function ImageAttachmentButton({
  attachments,
  onAttach,
  onRemove,
  disabled = false,
  maxImages = MAX_IMAGES_PER_ENTRY,
}: ImageAttachmentButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Process each selected file
    for (let i = 0; i < files.length; i++) {
      if (attachments.length + i >= maxImages) break
      
      const file = files[i]
      
      // Read file as base64
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        // Remove data URL prefix to get pure base64
        const base64 = result.split(',')[1]
        
        onAttach({
          uri: URL.createObjectURL(file),
          base64,
          mimeType: file.type || 'image/jpeg',
        })
      }
      reader.readAsDataURL(file)
    }

    // Reset input so same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const canAddMore = attachments.length < maxImages

  // Show grid of attached images
  if (attachments.length > 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Thumbnail grid */}
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {attachments.map((attachment, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                width: '40px',
                height: '40px',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '2px solid #374151',
              }}
            >
              <img
                src={attachment.uri}
                alt={`Attached ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <button
                onClick={() => onRemove(index)}
                disabled={disabled}
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: disabled ? 0.5 : 1,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Add more button */}
        {canAddMore && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={disabled}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '6px',
                border: '2px dashed rgba(255, 255, 255, 0.3)',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '1.2rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
              }}
              title={`Add more images (${attachments.length}/${maxImages})`}
            >
              +
            </button>
          </>
        )}

        {/* Count indicator */}
        <span
          style={{
            fontSize: '0.7rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginLeft: '0.25rem',
          }}
        >
          {attachments.length}/{maxImages}
        </span>
      </div>
    )
  }

  // No attachments - show add button
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        disabled={disabled}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          color: '#FFFFFF',
          fontSize: '0.85rem',
          fontWeight: 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span>📷</span>
      </button>
    </>
  )
}
