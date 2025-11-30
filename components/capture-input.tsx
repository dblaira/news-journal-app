'use client'

import { useState, useEffect, useRef } from 'react'
import { useVoiceInput } from '@/lib/hooks/use-voice-input'
import { Entry } from '@/types'

interface InferredData {
  headline: string
  subheading: string
  category: Entry['category']
  mood: string
  content: string
}

interface CaptureInputProps {
  onCapture: (data: InferredData) => void
  onClose: () => void
}

type InputMode = 'voice' | 'type' | 'paste'

export function CaptureInput({ onCapture, onClose }: CaptureInputProps) {
  const [mode, setMode] = useState<InputMode>('type')
  const [text, setText] = useState('')
  const [isInferring, setIsInferring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
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
    if (!content) {
      setError('Please enter some text first.')
      return
    }

    setIsInferring(true)
    setError(null)

    try {
      const response = await fetch('/api/infer-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process entry')
      }

      const inferred = await response.json()
      
      onCapture({
        ...inferred,
        content,
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
        if (e.target === e.currentTarget && !isInferring && !voiceProcessing) {
          onClose()
        }
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        disabled={isInferring || voiceProcessing}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'transparent',
          color: '#fff',
          border: 'none',
          fontSize: '2rem',
          cursor: isInferring || voiceProcessing ? 'not-allowed' : 'pointer',
          opacity: isInferring || voiceProcessing ? 0.5 : 0.7,
          transition: 'opacity 0.2s ease',
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          if (!isInferring && !voiceProcessing) e.currentTarget.style.opacity = '1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = isInferring || voiceProcessing ? '0.5' : '0.7'
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
        {/* Mode tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
          }}
        >
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
          - isListening && mode === 'voice': User is actively recording (must stop first)
          - No content: Nothing to submit
        */}
        <button
          onClick={handleSubmit}
          disabled={isInferring || voiceProcessing || (mode === 'voice' && isListening) || (!text.trim() && !transcript.trim())}
          style={{
            marginTop: '2rem',
            padding: '1rem 3rem',
            background: '#DC143C',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: isInferring || voiceProcessing || (mode === 'voice' && isListening) || (!text.trim() && !transcript.trim()) ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 600,
            letterSpacing: '0.05rem',
            textTransform: 'uppercase',
            transition: 'all 0.2s ease',
            opacity: isInferring || voiceProcessing || (mode === 'voice' && isListening) || (!text.trim() && !transcript.trim()) ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          onMouseEnter={(e) => {
            if (!isInferring && !voiceProcessing && !(mode === 'voice' && isListening) && (text.trim() || transcript.trim())) {
              e.currentTarget.style.background = '#B01030'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#DC143C'
          }}
        >
          {isInferring ? (
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

