'use client'

import { useState, useEffect, useRef } from 'react'
import { useVoiceInput } from '@/lib/hooks/use-voice-input'
import { Entry, EntryType, ImageExtraction, EntryMetadata } from '@/types'
import { ImageAttachment } from '@/types/multimodal'
import ImageAttachmentButton from './capture/ImageAttachmentButton'
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
  // Multimodal fields
  image_url?: string
  image_extracted_data?: ImageExtraction
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
]

export function CaptureInput({ onCapture, onClose, userId }: CaptureInputProps) {
  const [mode, setMode] = useState<InputMode>('type')
  const [text, setText] = useState('')
  const [isInferring, setIsInferring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<EntryType>('story')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [imageAttachment, setImageAttachment] = useState<ImageAttachment | null>(null)
  
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
    
    // Allow submission if there's text OR an image
    if (!content && !imageAttachment) {
      setError('Please enter some text or attach an image.')
      return
    }

    setIsInferring(true)
    setError(null)

    try {
      let finalContent = content
      let imageUrl: string | undefined
      let imageExtractedData: ImageExtraction | undefined

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

      // Process image if attached
      if (imageAttachment && userId) {
        const imageResult = await processImage(imageAttachment, content, userId)
        if (imageResult.imageUrl) {
          imageUrl = imageResult.imageUrl
        }
        if (imageResult.extractedData) {
          imageExtractedData = imageResult.extractedData
          // Use AI-generated narrative if available and user didn't provide text
          if (imageResult.finalContent && !content) {
            finalContent = imageResult.finalContent
          }
        }
      }

      // If we have image-extracted data with a suggested type, use it (unless user explicitly chose)
      const effectiveType = imageExtractedData?.suggestedEntryType || selectedType

      const response = await fetch('/api/infer-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: finalContent || imageExtractedData?.combinedNarrative || 'Image capture', 
          selectedType: effectiveType 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process entry')
      }

      const inferred = await response.json()
      
      onCapture({
        ...inferred,
        content: finalContent || imageExtractedData?.combinedNarrative || inferred.content,
        entry_type: effectiveType,
        image_url: imageUrl,
        image_extracted_data: imageExtractedData,
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

          {/* Image attachment button */}
          <ImageAttachmentButton
            attachment={imageAttachment}
            onAttach={setImageAttachment}
            onRemove={() => setImageAttachment(null)}
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
          const hasContent = text.trim() || transcript.trim() || imageAttachment
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

