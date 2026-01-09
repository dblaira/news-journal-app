// components/capture/FileAttachmentButton.tsx

'use client'

import { useRef } from 'react'
import { FileAttachment, detectFileType, getAcceptString } from '@/types/multimodal'
import { MAX_IMAGES_PER_ENTRY } from '@/types'

interface FileAttachmentButtonProps {
  attachments: FileAttachment[]
  onAttach: (attachment: FileAttachment) => void
  onRemove: (index: number) => void
  disabled?: boolean
  maxFiles?: number
}

// Icons for different file types
function FileIcon({ fileType, size = 18 }: { fileType: string; size?: number }) {
  switch (fileType) {
    case 'image':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      )
    case 'pdf':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#DC143C" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      )
    case 'csv':
    case 'xlsx':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="16" y2="17" />
          <line x1="12" y1="9" x2="12" y2="21" />
        </svg>
      )
    case 'docx':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      )
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      )
  }
}

export default function FileAttachmentButton({
  attachments,
  onAttach,
  onRemove,
  disabled = false,
  maxFiles = MAX_IMAGES_PER_ENTRY,
}: FileAttachmentButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Process each selected file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileType = detectFileType(file.type, file.name)
      
      if (!fileType) {
        console.warn(`Unsupported file type: ${file.type} (${file.name})`)
        continue
      }

      // Read file as base64
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        // Remove data URL prefix to get pure base64
        const base64 = result.split(',')[1]

        onAttach({
          uri: URL.createObjectURL(file),
          base64,
          mimeType: file.type || 'application/octet-stream',
          fileType,
          fileName: file.name,
          fileSize: file.size,
        })
      }
      reader.readAsDataURL(file)
    }

    // Reset input so same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const canAddMore = attachments.length < maxFiles
  const imageCount = attachments.filter(a => a.fileType === 'image').length
  const docCount = attachments.filter(a => a.fileType !== 'image').length

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  // Show grid of attached files
  if (attachments.length > 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {/* Attachment grid */}
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {attachments.map((attachment, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                width: attachment.fileType === 'image' ? '40px' : 'auto',
                height: '40px',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '2px solid #374151',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: attachment.fileType === 'image' ? 0 : '0 0.5rem',
                background: attachment.fileType === 'image' ? 'transparent' : 'rgba(255,255,255,0.05)',
              }}
              title={`${attachment.fileName} (${formatSize(attachment.fileSize)})`}
            >
              {attachment.fileType === 'image' ? (
                <img
                  src={attachment.uri}
                  alt={attachment.fileName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <>
                  <FileIcon fileType={attachment.fileType} size={16} />
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: 'rgba(255,255,255,0.7)',
                      maxWidth: '60px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {attachment.fileName.length > 8 
                      ? attachment.fileName.slice(0, 6) + '...' 
                      : attachment.fileName}
                  </span>
                </>
              )}
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
              accept={getAcceptString()}
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
              title={`Add more files (${attachments.length}/${maxFiles})`}
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
          {imageCount > 0 && `${imageCount} img`}
          {imageCount > 0 && docCount > 0 && ', '}
          {docCount > 0 && `${docCount} doc`}
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
        accept={getAcceptString()}
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
        title="Attach files (images, PDF, CSV, Excel, Word)"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
        <span>📎</span>
      </button>
    </>
  )
}
