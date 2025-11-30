'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// Web Speech API Type Declarations
interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

type VoiceInputMode = 'webSpeech' | 'whisper' | 'none'

interface UseVoiceInputReturn {
  isListening: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  isSupported: boolean
  isProcessing: boolean
  mode: VoiceInputMode
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [mode, setMode] = useState<VoiceInputMode>('none')
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Check for Web Speech API support
  const checkWebSpeechSupport = useCallback(() => {
    if (typeof window === 'undefined') return false
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    return !!SpeechRecognition
  }, [])

  // Check for MediaRecorder support (for Whisper fallback)
  const checkMediaRecorderSupport = useCallback(() => {
    if (typeof window === 'undefined') return false
    return !!navigator.mediaDevices?.getUserMedia && !!window.MediaRecorder
  }, [])

  // Initialize Web Speech API
  const initWebSpeech = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return null

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      
      // If Web Speech fails, try Whisper fallback
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone access denied. Please allow microphone access.')
      } else if (event.error === 'network' || event.error === 'no-speech') {
        // These errors might indicate Web Speech isn't working well
        // Could switch to Whisper here, but for now just show error
        switch (event.error) {
          case 'no-speech':
            setError('No speech detected. Please try again.')
            break
          case 'network':
            setError('Network error. Trying Whisper fallback...')
            // Auto-switch to Whisper mode
            if (checkMediaRecorderSupport()) {
              setMode('whisper')
            }
            break
          default:
            setError(`Speech recognition error: ${event.error}`)
        }
      } else {
        switch (event.error) {
          case 'audio-capture':
            setError('No microphone found. Please check your device.')
            break
          default:
            setError(`Speech recognition error: ${event.error}`)
        }
      }
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let currentInterim = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          currentInterim += result[0].transcript
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript)
      }
      setInterimTranscript(currentInterim)
    }

    return recognition
  }, [checkMediaRecorderSupport])

  // Initialize on mount
  useEffect(() => {
    const webSpeechSupported = checkWebSpeechSupport()
    const mediaRecorderSupported = checkMediaRecorderSupport()
    
    setIsSupported(webSpeechSupported || mediaRecorderSupported)
    
    if (webSpeechSupported) {
      setMode('webSpeech')
      recognitionRef.current = initWebSpeech()
    } else if (mediaRecorderSupported) {
      setMode('whisper')
    } else {
      setMode('none')
      setError('Voice input is not supported in this browser.')
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [checkWebSpeechSupport, checkMediaRecorderSupport, initWebSpeech])

  // Start recording with MediaRecorder (for Whisper)
  const startWhisperRecording = useCallback(async () => {
    try {
      setError(null)
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        } 
      })
      streamRef.current = stream
      
      // Try to use webm format, fallback to other formats
      let mimeType = 'audio/webm'
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg'
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setIsListening(false)
        setIsProcessing(true)
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
          
          // Send to Whisper API
          const formData = new FormData()
          const extension = mimeType.split('/')[1]
          formData.append('audio', audioBlob, `recording.${extension}`)
          
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Transcription failed')
          }
          
          const data = await response.json()
          if (data.transcript) {
            setTranscript((prev) => prev + (prev ? ' ' : '') + data.transcript)
          }
        } catch (err: any) {
          console.error('Whisper transcription error:', err)
          setError(`Transcription failed: ${err.message || 'Unknown error'}`)
        } finally {
          setIsProcessing(false)
          
          // Clean up stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
          }
        }
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsListening(true)
      setInterimTranscript('Recording... (tap to stop)')
    } catch (err: any) {
      console.error('Failed to start recording:', err)
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.')
      } else {
        setError(`Failed to start recording: ${err.message || 'Unknown error'}`)
      }
    }
  }, [])

  // Stop Whisper recording
  const stopWhisperRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setInterimTranscript('Processing...')
    }
  }, [])

  // Start listening (auto-selects method based on mode)
  const startListening = useCallback(() => {
    setError(null)
    
    if (mode === 'webSpeech' && recognitionRef.current) {
      setInterimTranscript('')
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.error('Failed to start Web Speech recognition:', err)
        // Try Whisper fallback
        if (checkMediaRecorderSupport()) {
          setMode('whisper')
          startWhisperRecording()
        }
      }
    } else if (mode === 'whisper') {
      startWhisperRecording()
    } else {
      setError('Voice input is not supported in this browser.')
    }
  }, [mode, checkMediaRecorderSupport, startWhisperRecording])

  // Stop listening
  const stopListening = useCallback(() => {
    if (mode === 'webSpeech' && recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setInterimTranscript('')
    } else if (mode === 'whisper') {
      stopWhisperRecording()
    }
  }, [mode, isListening, stopWhisperRecording])

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
  }, [])

  // Force switch to Whisper mode
  const switchToWhisper = useCallback(() => {
    if (checkMediaRecorderSupport()) {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      setMode('whisper')
      setError(null)
    }
  }, [checkMediaRecorderSupport])

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    isProcessing,
    mode,
    startListening,
    stopListening,
    resetTranscript,
  }
}
