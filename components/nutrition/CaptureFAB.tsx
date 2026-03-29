'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Mic, MicOff } from 'lucide-react'
import { saveIntake } from '@/app/nutrition/actions/intake'
import { BarcodeScanner } from './BarcodeScanner'
import { debugFetch } from '@/lib/nutrition/debug-fetch'
import { logWarn, logError } from '@/lib/nutrition/debug-logger'
import { C } from '@/lib/nutrition/colors'

interface FoodItem {
  name: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  caffeine_mg: number
  confidence: 'high' | 'medium' | 'low'
}

interface InferredIntake {
  type: 'food' | 'water' | 'caffeine' | 'supplement' | 'multi'
  meal_name?: string | null
  items?: FoodItem[]
  water_oz?: number | null
  caffeine_source?: string | null
  caffeine_mg?: number | null
  supplements?: string[] | null
  raw_text: string
}

const fontFamily = `'Outfit', 'Avenir Next', 'Helvetica Neue', sans-serif`

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}


interface CaptureFABProps {
  isOpen: boolean
  onClose: () => void
  onEntryCreated?: () => void
}

export function CaptureFAB({ isOpen, onClose, onEntryCreated }: CaptureFABProps) {
  const [mode, setMode] = useState<'input' | 'confirming'>('input')
  const [inputText, setInputText] = useState('')
  const [isInferring, setIsInferring] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [inferredData, setInferredData] = useState<InferredIntake | null>(null)
  const [error, setError] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const voiceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    // Voice is supported if we have MediaRecorder (for Whisper transcription)
    setVoiceSupported(!!navigator.mediaDevices?.getUserMedia)
    return () => { 
      recognitionRef.current?.abort()
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setMode('input')
      setInputText('')
      setInferredData(null)
      setError('')
      setVoiceError(null)
      setIsTranscribing(false)
      setShowBarcodeScanner(false)
    } else {
      recognitionRef.current?.abort()
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      setIsListening(false)
      setIsTranscribing(false)
      setVoiceError(null)
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current)
        voiceTimeoutRef.current = null
      }
    }
  }, [isOpen])

  const startListening = useCallback(async () => {
    // If already recording, stop and transcribe
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      return
    }

    setVoiceError(null)
    audioChunksRef.current = []

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = 'Audio recording not supported on this device'
      setVoiceError(msg)
      logWarn('CaptureFAB.voice', msg, { userAgent: navigator.userAgent })
      return
    }

    try {
      setVoiceError('Requesting microphone...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4') 
          ? 'audio/mp4' 
          : 'audio/wav'
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setIsListening(false)
        setIsTranscribing(true)
        setVoiceError('Transcribing...')

        // Stop all tracks
        stream.getTracks().forEach(t => t.stop())

        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'm4a' : 'wav'
        
        const form = new FormData()
        form.append('file', blob, `recording.${ext}`)

        try {
          const res = await fetch('/api/nutrition/transcribe', { method: 'POST', body: form })
          const data = await res.json()
          
          if (!res.ok) {
            const errMsg = data?.error || 'Transcription failed'
            setVoiceError(errMsg)
            logError('CaptureFAB.transcribe', errMsg, { details: data?.details })
          } else {
            const text = data.text?.trim() || ''
            if (text) {
              setInputText(prev => prev ? `${prev} ${text}` : text)
              setVoiceError(null)
            } else {
              setVoiceError('No speech detected. Try again.')
            }
          }
        } catch (err: any) {
          const msg = err.message || 'Upload failed'
          setVoiceError(msg)
          logError('CaptureFAB.transcribe', msg, { userAgent: navigator.userAgent })
        } finally {
          setIsTranscribing(false)
          mediaRecorderRef.current = null
        }
      }

      mediaRecorder.onerror = (e: any) => {
        const msg = e.error?.message || 'Recording error'
        setVoiceError(msg)
        logError('CaptureFAB.voice', msg, { userAgent: navigator.userAgent })
        setIsListening(false)
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorder.start()
      setIsListening(true)
      setVoiceError('Recording... Tap mic to stop')

      // Auto-stop after 15 seconds as safeguard
      voiceTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }, 15000)

    } catch (err: any) {
      const msg = err.message || 'Microphone access denied'
      setVoiceError(msg)
      logError('CaptureFAB.voice', msg, { userAgent: navigator.userAgent })
      setIsListening(false)
    }
  }, [])

  const handleClose = () => {
    recognitionRef.current?.abort()
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current)
      voiceTimeoutRef.current = null
    }
    setIsListening(false)
    setIsTranscribing(false)
    setVoiceError(null)
    setMode('input')
    setInputText('')
    setInferredData(null)
    setError('')
    setShowBarcodeScanner(false)
    onClose()
  }

  const handleBarcodeResult = (product: any) => {
    setShowBarcodeScanner(false)
    setInferredData({
      type: 'food',
      meal_name: null,
      items: [{
        name: product.name,
        quantity: 1,
        unit: product.serving_size || '1 serving',
        calories: product.calories,
        protein: product.protein,
        carbs: product.carbs,
        fat: product.fat,
        caffeine_mg: 0,
        confidence: 'high',
      }],
      water_oz: null,
      caffeine_source: null,
      caffeine_mg: null,
      supplements: null,
      raw_text: `Barcode: ${product.barcode} - ${product.name}`,
    })
    setMode('confirming')
  }

  const handleInfer = async () => {
    if (!inputText.trim()) return
    setIsInferring(true)
    setError('')

    try {
      const res = await debugFetch('/api/infer-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputText.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to parse intake')
        setIsInferring(false)
        return
      }

      setInferredData(data)
      setMode('confirming')
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setIsInferring(false)
    }
  }

  const handlePublish = async () => {
    if (!inferredData) return
    setIsPublishing(true)
    setError('')

    try {
      const result = await saveIntake({
        type: inferredData.type,
        meal_name: inferredData.meal_name,
        items: inferredData.items,
        water_oz: inferredData.water_oz,
        caffeine_source: inferredData.caffeine_source,
        caffeine_mg: inferredData.caffeine_mg,
        supplements: inferredData.supplements,
        external_source: 'ai_parsed',
      })

      if (result.error) {
        setError(result.error)
        setIsPublishing(false)
        return
      }

      onEntryCreated?.()
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setIsPublishing(false)
    }
  }

  if (!isOpen) return null

  if (showBarcodeScanner) {
    return (
      <BarcodeScanner
        onResult={handleBarcodeResult}
        onClose={() => setShowBarcodeScanner(false)}
      />
    )
  }

  /* ═══════ INPUT MODE — full-screen, voice-first ═══════ */
  if (mode === 'input') {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: C.cream,
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '16px 20px 0',
        }}>
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: C.charcoal + '10',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={24} color={C.charcoal} />
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '16px 20px 0' }}>
          <h2 style={{
            fontSize: 32,
            fontWeight: 800,
            color: C.charcoal,
            fontFamily,
            margin: 0,
          }}>
            What did you have?
          </h2>
        </div>

        {voiceSupported && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '36px 20px 20px',
          }}>
            <button
              onClick={isTranscribing ? undefined : startListening}
              disabled={isTranscribing}
              aria-label={isListening ? 'Stop recording' : 'Start voice input'}
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: isTranscribing ? C.ocean : isListening ? C.red : C.ocean,
                border: 'none',
                color: C.white,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isTranscribing ? 'wait' : 'pointer',
                opacity: isTranscribing ? 0.7 : 1,
                boxShadow: isListening
                  ? '0 0 0 16px rgba(220, 53, 53, 0.12), 0 8px 32px rgba(220, 53, 53, 0.25)'
                  : '0 8px 32px rgba(29, 93, 155, 0.25)',
                transition: 'all 0.3s ease',
              }}
            >
              {isListening
                ? <MicOff size={48} strokeWidth={1.8} />
                : <Mic size={48} strokeWidth={1.8} />
              }
            </button>
            <p style={{
              fontSize: 18,
              fontWeight: 600,
              color: isListening ? C.red : isTranscribing ? C.ocean : C.warmGray,
              fontFamily,
              marginTop: 16,
              marginBottom: 0,
            }}>
              {isTranscribing ? 'Transcribing...' : isListening ? 'Recording... Tap to stop' : 'Tap to speak'}
            </p>
            {voiceError && (
              <p style={{
                fontSize: 14,
                fontWeight: 600,
                color: C.orange,
                fontFamily,
                marginTop: 12,
                marginBottom: 0,
                textAlign: 'center',
                padding: '0 20px',
                maxWidth: 280,
              }}>
                {voiceError}
              </p>
            )}
          </div>
        )}

        <div style={{ padding: '0 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={voiceSupported
              ? 'Or type here...'
              : 'What did you have? e.g. "2 eggs and toast"'
            }
            style={{
              width: '100%',
              minHeight: 100,
              border: `2px solid ${C.sand}`,
              borderRadius: 16,
              padding: 16,
              fontSize: 18,
              resize: 'none',
              outline: 'none',
              fontFamily,
              color: C.charcoal,
              background: C.white,
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.orange }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.sand }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleInfer()
            }}
          />

          {error && (
            <p style={{
              color: C.red,
              fontSize: 16,
              margin: '12px 0 0',
              fontFamily,
              fontWeight: 600,
            }}>
              {error}
            </p>
          )}
        </div>

        <div style={{ padding: '16px 20px 24px' }}>
          <button
            onClick={() => setShowBarcodeScanner(true)}
            style={{
              width: '100%',
              height: 52,
              background: C.white,
              border: `2px solid ${C.sand}`,
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke={C.warmGray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5V3h4" /><path d="M17 3h4v2" />
              <path d="M21 19v2h-4" /><path d="M7 21H3v-2" />
              <line x1="7" y1="8" x2="7" y2="16" />
              <line x1="11" y1="8" x2="11" y2="16" />
              <line x1="15" y1="8" x2="15" y2="16" />
            </svg>
            <span style={{
              fontSize: 16,
              fontWeight: 600,
              color: C.warmGray,
              fontFamily,
            }}>
              Scan barcode
            </span>
          </button>

          <button
            onClick={handleInfer}
            disabled={isInferring || !inputText.trim()}
            style={{
              width: '100%',
              height: 56,
              background: C.ocean,
              color: C.white,
              border: 'none',
              borderRadius: 16,
              fontSize: 20,
              fontWeight: 700,
              cursor: isInferring ? 'wait' : 'pointer',
              opacity: isInferring || !inputText.trim() ? 0.5 : 1,
              fontFamily,
              transition: 'opacity 0.15s',
            }}
          >
            {isInferring ? 'Thinking...' : 'Capture'}
          </button>
        </div>
      </div>
    )
  }

  /* ═══════ CONFIRMING MODE — full-screen ═══════ */
  if (mode === 'confirming' && inferredData) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: C.cream,
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '16px 20px 0',
        }}>
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: C.charcoal + '10',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={24} color={C.charcoal} />
          </button>
        </div>

        <div style={{ padding: '8px 20px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
            <TypeBadge type={inferredData.type} />
            {inferredData.meal_name && (
              <span style={{
                padding: '6px 16px',
                background: C.sand,
                borderRadius: 20,
                fontSize: 16,
                fontWeight: 600,
                color: C.charcoal,
                fontFamily,
              }}>
                {inferredData.meal_name}
              </span>
            )}
          </div>

          {inferredData.items && inferredData.items.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              {inferredData.items.map((item, i) => (
                <div key={i} style={{
                  padding: '18px 20px',
                  background: C.white,
                  borderRadius: 16,
                  marginBottom: 10,
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: C.charcoal,
                      fontFamily,
                    }}>
                      {item.name}
                    </span>
                    <span style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: C.orange,
                      fontFamily,
                    }}>
                      {Math.round(item.calories * item.quantity)} cal
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: 14,
                    marginTop: 8,
                    fontSize: 15,
                    color: C.warmGray,
                    fontFamily,
                    fontWeight: 600,
                  }}>
                    <span>{item.quantity} {item.unit}</span>
                    <span>P: {Math.round(item.protein * item.quantity)}g</span>
                    <span>C: {Math.round(item.carbs * item.quantity)}g</span>
                    <span>F: {Math.round(item.fat * item.quantity)}g</span>
                  </div>
                </div>
              ))}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderTop: `2px solid ${C.sand}`,
                marginTop: 6,
              }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: C.charcoal, fontFamily }}>
                  Total
                </span>
                <span style={{ fontSize: 20, fontWeight: 800, color: C.orange, fontFamily }}>
                  {Math.round(inferredData.items.reduce((s, it) => s + it.calories * it.quantity, 0))} cal
                </span>
              </div>
            </div>
          )}

          {inferredData.water_oz != null && inferredData.water_oz > 0 && (
            <div style={{
              padding: '18px 20px',
              background: '#E8F4FD',
              borderRadius: 16,
              marginBottom: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: C.ocean, fontFamily }}>Water</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: C.ocean, fontFamily }}>
                {inferredData.water_oz} oz
              </span>
            </div>
          )}

          {inferredData.caffeine_mg != null && inferredData.caffeine_mg > 0 && (
            <div style={{
              padding: '18px 20px',
              background: '#FFF3E0',
              borderRadius: 16,
              marginBottom: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: C.charcoal, fontFamily }}>
                {inferredData.caffeine_source || 'Caffeine'}
              </span>
              <span style={{ fontSize: 20, fontWeight: 800, color: C.charcoal, fontFamily }}>
                {inferredData.caffeine_mg} mg
              </span>
            </div>
          )}

          {inferredData.supplements && inferredData.supplements.length > 0 && (
            <div style={{
              padding: '18px 20px',
              background: '#E8F5E9',
              borderRadius: 16,
              marginBottom: 20,
            }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#2E7D32', fontFamily }}>
                Supplements
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                {inferredData.supplements.map((s, i) => (
                  <span key={i} style={{
                    padding: '6px 16px',
                    background: '#C8E6C9',
                    borderRadius: 14,
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#1B5E20',
                    fontFamily,
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p style={{
              color: C.red,
              fontSize: 16,
              margin: '0 0 14px',
              fontFamily,
              fontWeight: 600,
            }}>
              {error}
            </p>
          )}
        </div>

        <div style={{
          padding: '16px 20px 24px',
          display: 'flex',
          gap: 12,
        }}>
          <button
            onClick={() => { setMode('input'); setError('') }}
            style={{
              flex: 1,
              height: 56,
              background: C.white,
              border: `2px solid ${C.sand}`,
              borderRadius: 16,
              fontSize: 18,
              fontWeight: 700,
              color: C.warmGray,
              cursor: 'pointer',
              fontFamily,
            }}
          >
            &#8592; Edit
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            style={{
              flex: 2,
              height: 56,
              background: C.ocean,
              color: C.white,
              border: 'none',
              borderRadius: 16,
              fontSize: 20,
              fontWeight: 700,
              cursor: isPublishing ? 'wait' : 'pointer',
              opacity: isPublishing ? 0.5 : 1,
              fontFamily,
              transition: 'opacity 0.15s',
            }}
          >
            {isPublishing ? 'Saving...' : 'Log It'}
          </button>
        </div>
      </div>
    )
  }

  return null
}

function TypeBadge({ type }: { type: string }) {
  const fontFamily = `'Outfit', 'Avenir Next', 'Helvetica Neue', sans-serif`
  const config: Record<string, { bg: string; color: string; label: string }> = {
    food: { bg: '#FDEBD0', color: '#E67E22', label: 'Food' },
    water: { bg: '#D6EAF8', color: '#2980B9', label: 'Water' },
    caffeine: { bg: '#FFF3E0', color: '#E65100', label: 'Caffeine' },
    supplement: { bg: '#E8F5E9', color: '#2E7D32', label: 'Supplement' },
    multi: { bg: '#F3E5F5', color: '#7B1FA2', label: 'Multiple' },
  }
  const c = config[type] || config.food
  return (
    <span style={{
      padding: '6px 16px',
      background: c.bg,
      borderRadius: 20,
      fontSize: 16,
      fontWeight: 700,
      color: c.color,
      fontFamily,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>
      {c.label}
    </span>
  )
}
