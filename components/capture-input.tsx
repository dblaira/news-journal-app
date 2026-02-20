'use client'

import { useState, useEffect, useRef } from 'react'
import { useVoiceInput } from '@/lib/hooks/use-voice-input'
import { Entry, EntryType, ImageExtraction, EntryMetadata, EntryImage, MAX_IMAGES_PER_ENTRY } from '@/types'
import { FileAttachment, ImageAttachment } from '@/types/multimodal'
import FileAttachmentButton from './capture/FileAttachmentButton'
import { useMultimodalCapture } from '@/hooks/useMultimodalCapture'
import { captureMetadata } from '@/lib/captureMetadata'

interface InferredData {
  headline: string
  subheading: string
  category: Entry['category']
  mood: string
  content: string
  entry_type: EntryType
  due_date: string | null
  connection_type?: string | null
  // Multimodal fields (legacy single image)
  image_url?: string
  image_extracted_data?: ImageExtraction
  // Multi-image gallery (new)
  images?: EntryImage[]
  // Metadata fields
  metadata?: EntryMetadata
}

interface CaptureInputProps {
  onCapture: (data: InferredData) => void
  onClose: () => void
  userId?: string
}

type InputMode = 'voice' | 'type' | 'paste'

const entryTypeOptions: { id: EntryType; label: string; icon: string }[] = [
  { id: 'story', label: 'Story', icon: '📖' },
  { id: 'note', label: 'Note', icon: '📝' },
  { id: 'action', label: 'Action', icon: '✓' },
  { id: 'connection', label: 'Connection', icon: '🔗' },
]

export function CaptureInput({ onCapture, onClose, userId }: CaptureInputProps) {
  const [mode, setMode] = useState<InputMode>('type')
  const [text, setText] = useState('')
  const [isInferring, setIsInferring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<EntryType>('story')
  const [userExplicitlySelectedType, setUserExplicitlySelectedType] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [fileAttachments, setFileAttachments] = useState<FileAttachment[]>([])
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typeDropdownRef = useRef<HTMLDivElement>(null)
  
  const { processImage, isProcessingImage, processingStep } = useMultimodalCapture()
  const {
    isListening,
    transcript,
    interimTranscript,
    error: voiceError,
    isSupported: voiceSupported,
    isProcessing: voiceProcessing,
    mode: voiceMode,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput()

  // Auto-focus textarea on mode change
  useEffect(() => {
    if (mode === 'type' || mode === 'paste') {
      textareaRef.current?.focus()
    }
  }, [mode])

  // Update text from voice transcript
  useEffect(() => {
    if (transcript) {
      setText(transcript)
    }
  }, [transcript])

  // Close type dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false)
      }
    }
    if (showTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTypeDropdown])

  // Handle paste detection
  const handlePaste = (e: React.ClipboardEvent) => {
    if (mode === 'paste') {
      const pastedText = e.clipboardData.getData('text')
      setText(pastedText)
    }
  }

  const handleSubmit = async () => {
    // Use transcript in voice mode, text otherwise
    const content = mode === 'voice' ? transcript.trim() : text.trim()
    
    // Allow submission if there's text OR files
    if (!content && fileAttachments.length === 0) {
      setError('Please enter some text or attach an image.')
      return
    }

    setIsInferring(true)
    setError(null)

    try {
      let finalContent = content
      let imageUrl: string | undefined
      let imageExtractedData: ImageExtraction | undefined
      const processedImages: EntryImage[] = []

      // Capture metadata (time, device, location) silently in background
      // Don't block on location - it's optional and may take time
      let metadata: EntryMetadata | undefined
      if (userId) {
        try {
          metadata = await captureMetadata(userId, true)
        } catch (metadataError) {
          console.log('Metadata capture failed (non-blocking):', metadataError)
          // Continue without metadata - not a failure
        }
      }

      // Separate image attachments from document attachments
      const imageFiles = fileAttachments.filter(f => f.fileType === 'image')
      const documentFiles = fileAttachments.filter(f => f.fileType !== 'image')

      // Process image attachments (existing multimodal flow)
      if (imageFiles.length > 0 && userId) {
        for (let i = 0; i < imageFiles.length; i++) {
          const attachment = imageFiles[i]
          try {
            // Convert FileAttachment to ImageAttachment for existing processor
            const imageAttachment: ImageAttachment = {
              uri: attachment.uri,
              base64: attachment.base64,
              mimeType: attachment.mimeType,
            }
            const imageResult = await processImage(imageAttachment, content, userId)
            
            // Build EntryImage object
            const entryImage: EntryImage = {
              url: imageResult.imageUrl || '',
              extracted_data: imageResult.extractedData || undefined,
              is_poster: i === 0, // First image is poster
              order: i,
            }
            
            if (entryImage.url) {
              processedImages.push(entryImage)
            }
            
            // Use first image's data for legacy fields and content inference
            if (i === 0) {
              imageUrl = imageResult.imageUrl ?? undefined
              imageExtractedData = imageResult.extractedData ?? undefined
              // Use AI-generated narrative if available and user didn't provide text
              if (imageResult.finalContent && !content) {
                finalContent = imageResult.finalContent
              }
            }
          } catch (err) {
            console.error(`Error processing image ${i}:`, err)
            // Continue with other images
          }
        }
      }

      // Process document attachments (PDF, CSV, XLSX, DOCX)
      if (documentFiles.length > 0 && userId) {
        for (const docFile of documentFiles) {
          try {
            // Upload document file to storage and get URL
            const formData = new FormData()
            // Convert base64 back to blob
            const byteCharacters = atob(docFile.base64)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: docFile.mimeType })
            
            formData.append('file', blob, docFile.fileName)
            formData.append('userId', userId)
            formData.append('fileType', docFile.fileType)

            const uploadResponse = await fetch('/api/upload-document', {
              method: 'POST',
              body: formData,
            })

            if (uploadResponse.ok) {
              const responseData = await uploadResponse.json()
              const { url, extractedText, fileType: responseFileType } = responseData
              console.log('📄 Document upload response:', { 
                fileName: docFile.fileName, 
                url, 
                fileType: responseFileType,
                hasExtractedText: !!extractedText,
                extractedTextLength: extractedText?.length || 0,
                extractedTextPreview: extractedText?.substring(0, 200) || 'none'
              })
              
              // Add document as an EntryImage (reusing the gallery structure)
              processedImages.push({
                url,
                extracted_data: extractedText ? { 
                  imageType: 'document' as const,
                  combinedNarrative: extractedText,
                  suggestedTags: [responseFileType || docFile.fileType],
                  suggestedEntryType: 'note' as const,
                } : undefined,
                is_poster: processedImages.length === 0, // First file is poster if no images
                order: processedImages.length,
              })

              // If we extracted text and user didn't provide any, use it
              if (extractedText && !content && !finalContent) {
                finalContent = `Document: ${docFile.fileName}\n\n${extractedText.substring(0, 500)}${extractedText.length > 500 ? '...' : ''}`
              }
            } else {
              let errorData = {}
              try {
                errorData = await uploadResponse.json()
              } catch {
                // Response may not be JSON
              }
              console.error('📄 Document upload failed:', { 
                fileName: docFile.fileName, 
                status: uploadResponse.status, 
                statusText: uploadResponse.statusText,
                error: errorData 
              })
            }
          } catch (err) {
            console.error(`Error processing document ${docFile.fileName}:`, err)
          }
        }
      }

      // Collect extracted text from all documents for AI inference
      const documentTexts = processedImages
        .filter(img => img.extracted_data?.imageType === 'document')
        .map(img => img.extracted_data?.combinedNarrative)
        .filter(Boolean)
        .join('\n\n---\n\n')
      
      console.log('📄 Document texts for AI inference:', {
        hasDocumentTexts: !!documentTexts,
        documentTextsLength: documentTexts?.length || 0,
        documentTextsPreview: documentTexts?.substring(0, 300) || 'none',
        processedImagesCount: processedImages.length,
        documentCount: processedImages.filter(img => img.extracted_data?.imageType === 'document').length
      })
      
      // Determine if we should pass an explicit type to override AI inference:
      // 1. User explicitly clicked the type selector dropdown
      // 2. Image processing suggested a type (like a receipt suggesting 'note')
      // If neither, let the AI infer the type from content
      const explicitTypeOverride = userExplicitlySelectedType 
        ? selectedType 
        : imageExtractedData?.suggestedEntryType || null

      // Build content for AI inference - prioritize user text, then document content, then image content
      const contentForInference = finalContent 
        || documentTexts 
        || imageExtractedData?.combinedNarrative 
        || 'File capture'

      const response = await fetch('/api/infer-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: contentForInference,
          // Pass document extracted text separately so AI knows it's from a document
          documentContent: documentTexts || undefined,
          // Only pass selectedType if user explicitly chose or image suggests one
          // This allows AI to infer type when user hasn't made an explicit choice
          selectedType: explicitTypeOverride
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process entry')
      }

      const inferred = await response.json()
      
      // Use AI-inferred type unless user explicitly overrode it
      const finalEntryType = explicitTypeOverride || inferred.entry_type || 'story'
      
      // Update the displayed type to match what was inferred (for UX feedback)
      if (!userExplicitlySelectedType && inferred.entry_type) {
        setSelectedType(inferred.entry_type)
      }
      
      // Debug: log what we're passing to confirmation
      console.log('📁 Capture - passing to confirmation:', {
        processedImagesCount: processedImages.length,
        processedImages: processedImages,
        imageUrl,
        hasExtractedData: !!imageExtractedData,
      })
      
      onCapture({
        ...inferred,
        content: finalContent || imageExtractedData?.combinedNarrative || inferred.content,
        entry_type: finalEntryType,
        connection_type: inferred.connection_type ?? null,
        // Legacy single-image fields (for backward compatibility)
        image_url: imageUrl,
        image_extracted_data: imageExtractedData,
        // New multi-image array
        images: processedImages.length > 0 ? processedImages : undefined,
        metadata,
      })
    } catch (err: any) {
      console.error('Error inferring entry:', err)
      setError(err.message || 'Failed to process your entry. Please try again.')
    } finally {
      setIsInferring(false)
    }
  }

  const handleModeChange = (newMode: InputMode) => {
    setMode(newMode)
    setError(null)
    if (newMode === 'voice') {
      // Reset transcript when switching to voice
      resetTranscript()
    }
  }

  const toggleVoice = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const displayText = mode === 'voice' 
    ? (transcript + (interimTranscript ? ` ${interimTranscript}` : '')) 
    : text

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        zIndex: 2500,
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isInferring && !voiceProcessing && !isProcessingImage) {
          onClose()
        }
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        disabled={isInferring || voiceProcessing || isProcessingImage}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'transparent',
          color: '#fff',
          border: 'none',
          fontSize: '2rem',
          cursor: isInferring || voiceProcessing || isProcessingImage ? 'not-allowed' : 'pointer',
          opacity: isInferring || voiceProcessing || isProcessingImage ? 0.5 : 0.7,
          transition: 'opacity 0.2s ease',
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          if (!isInferring && !voiceProcessing && !isProcessingImage) e.currentTarget.style.opacity = '1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = isInferring || voiceProcessing || isProcessingImage ? '0.5' : '0.7'
        }}
      >
        ×
      </button>

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '600px',
          width: '100%',
          margin: '0 auto',
          paddingTop: '3rem',
        }}
      >
        {/* Mode tabs row with type selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Input mode tabs */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { id: 'voice' as InputMode, label: '🎤 Voice', disabled: !voiceSupported },
              { id: 'type' as InputMode, label: '⌨️ Type', disabled: false },
              { id: 'paste' as InputMode, label: '📋 Paste', disabled: false },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleModeChange(tab.id)}
                disabled={tab.disabled || isInferring}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: mode === tab.id ? '#DC143C' : 'rgba(255, 255, 255, 0.1)',
                  color: tab.disabled ? '#666' : '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: tab.disabled || isInferring ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  opacity: tab.disabled ? 0.5 : 1,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.2)' }} />

          {/* File attachment button (images, PDF, CSV, XLSX, DOCX) */}
          <FileAttachmentButton
            attachments={fileAttachments}
            onAttach={(attachment) => {
              // Use functional setState to avoid stale closure when multiple files selected
              setFileAttachments(prev => {
                if (prev.length < MAX_IMAGES_PER_ENTRY) {
                  return [...prev, attachment]
                }
                return prev
              })
            }}
            onRemove={(index) => {
              setFileAttachments(prev => prev.filter((_, i) => i !== index))
            }}
            disabled={isInferring || isProcessingImage}
          />

          {/* Divider */}
          <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.2)' }} />

          {/* Type selector - inline with mode tabs */}
          <div ref={typeDropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              disabled={isInferring || isProcessingImage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: isInferring ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isInferring ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isInferring) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              }}
            >
              <span>{entryTypeOptions.find(t => t.id === selectedType)?.icon}</span>
              <span>{entryTypeOptions.find(t => t.id === selectedType)?.label}</span>
              <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>▼</span>
            </button>

            {/* Dropdown */}
            {showTypeDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.5rem)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#1a1a1a',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  minWidth: '140px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  zIndex: 100,
                }}
              >
                {entryTypeOptions.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type.id)
                      setUserExplicitlySelectedType(true)
                      setShowTypeDropdown(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: selectedType === type.id ? 'rgba(220, 20, 60, 0.2)' : 'transparent',
                      border: 'none',
                      color: selectedType === type.id ? '#DC143C' : '#fff',
                      fontSize: '0.85rem',
                      fontWeight: selectedType === type.id ? 600 : 400,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedType !== type.id) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = selectedType === type.id ? 'rgba(220, 20, 60, 0.2)' : 'transparent'
                    }}
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Voice mode */}
        {mode === 'voice' && (
          <div style={{ textAlign: 'center', width: '100%' }}>
            {/* Voice mode indicator */}
            <p style={{ 
              color: '#666', 
              fontSize: '0.75rem', 
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1rem'
            }}>
              {voiceMode === 'whisper' ? '🔊 Whisper Mode' : '🎙️ Live Transcription'}
            </p>
            
            <button
              onClick={toggleVoice}
              disabled={isInferring || voiceProcessing}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: isListening ? '#DC143C' : voiceProcessing ? '#666' : 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                border: isListening ? '4px solid #fff' : '2px solid rgba(255, 255, 255, 0.3)',
                cursor: isInferring || voiceProcessing ? 'not-allowed' : 'pointer',
                fontSize: '3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                animation: isListening ? 'pulse 1.5s infinite' : voiceProcessing ? 'none' : 'none',
                margin: '0 auto 1.5rem',
                opacity: voiceProcessing ? 0.7 : 1,
              }}
            >
              {voiceProcessing ? '⏳' : '🎤'}
            </button>
            <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {voiceProcessing 
                ? 'Processing audio...' 
                : isListening 
                  ? (voiceMode === 'whisper' ? 'Recording... Tap to stop & process' : 'Listening... Tap to stop')
                  : 'Tap to start speaking'
              }
            </p>
            {voiceError && (
              <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '1rem' }}>{voiceError}</p>
            )}
            
            {/* Voice transcript display */}
            {(displayText || voiceProcessing) && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginTop: '1rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {voiceProcessing && !displayText ? (
                  <p style={{ color: '#999', fontSize: '1rem', margin: 0 }}>
                    Transcribing with Whisper AI...
                  </p>
                ) : (
                  <p style={{ color: '#fff', fontSize: '1.1rem', lineHeight: 1.6, margin: 0 }}>
                    {displayText}
                    {interimTranscript && !voiceProcessing && (
                      <span style={{ color: '#999' }}> {interimTranscript}</span>
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Type mode */}
        {mode === 'type' && (
          <div style={{ width: '100%' }}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind? Just write..."
              disabled={isInferring}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1.1rem',
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#DC143C'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              }}
            />
          </div>
        )}

        {/* Paste mode */}
        {mode === 'paste' && (
          <div style={{ width: '100%' }}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPaste={handlePaste}
              placeholder="Paste your text here..."
              disabled={isInferring}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '2px dashed rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1.1rem',
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#DC143C'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              }}
            />
            <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center' }}>
              Ctrl/Cmd + V to paste
            </p>
          </div>
        )}

        {/* Error display */}
        {error && (
          <p style={{ color: '#ff6b6b', fontSize: '0.9rem', marginTop: '1rem', textAlign: 'center' }}>
            {error}
          </p>
        )}

        {/* Submit button */}
        {/* 
          Button disabled during:
          - isInferring: AI is processing the entry
          - voiceProcessing: Whisper is transcribing audio
          - isProcessingImage: Vision API is analyzing image
          - isListening && mode === 'voice': User is actively recording (must stop first)
          - No content and no image: Nothing to submit
        */}
        {(() => {
          const hasContent = text.trim() || transcript.trim() || fileAttachments.length > 0
          const isDisabled = isInferring || voiceProcessing || isProcessingImage || (mode === 'voice' && isListening) || !hasContent
          return (
            <button
              onClick={handleSubmit}
              disabled={isDisabled}
              style={{
                marginTop: '2rem',
                padding: '1rem 3rem',
                background: '#DC143C',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                letterSpacing: '0.05rem',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease',
                opacity: isDisabled ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.background = '#B01030'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#DC143C'
              }}
            >
              {isProcessingImage ? (
                <>
                  <span className="spinner" style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid rgba(255,255,255,0.3)', 
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  {processingStep || 'Processing image...'}
                </>
              ) : isInferring ? (
                <>
                  <span className="spinner" style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid rgba(255,255,255,0.3)', 
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  Processing...
                </>
              ) : voiceProcessing ? (
                'Transcribing...'
              ) : mode === 'voice' && isListening ? (
                'Stop recording first'
              ) : (
                'Continue →'
              )}
            </button>
          )
        })()}
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

