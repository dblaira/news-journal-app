// components/capture/ImageAttachmentButton.tsx

'use client'

import { useRef } from 'react'
import { ImageAttachment } from '@/types/multimodal'

interface ImageAttachmentButtonProps {
  attachment: ImageAttachment | null
  onAttach: (attachment: ImageAttachment) => void
  onRemove: () => void
  disabled?: boolean
}

export default function ImageAttachmentButton({
  attachment,
  onAttach,
  onRemove,
  disabled = false,
}: ImageAttachmentButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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

    // Reset input so same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  if (attachment) {
    return (
      <div
        style={{
          position: 'relative',
          width: '60px',
          height: '60px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '2px solid #374151',
        }}
      >
        <img
          src={attachment.uri}
          alt="Attached"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <button
          onClick={onRemove}
          disabled={disabled}
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: 'none',
            background: '#EF4444',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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

