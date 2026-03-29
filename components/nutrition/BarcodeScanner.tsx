'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { debugFetch } from '@/lib/nutrition/debug-fetch'
import { C } from '@/lib/nutrition/colors'

interface BarcodeScannerProps {
  onResult: (product: any) => void
  onClose: () => void
}

export function BarcodeScanner({ onResult, onClose }: BarcodeScannerProps) {
  const [manualCode, setManualCode] = useState('')
  const [isLooking, setIsLooking] = useState(false)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [showLabelCapture, setShowLabelCapture] = useState(false)
  const [isReadingLabel, setIsReadingLabel] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const manualInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerId = 'barcode-reader'

  const cleanup = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {})
      scannerRef.current.clear()
      scannerRef.current = null
    }
    setScanning(false)
  }, [])

  useEffect(() => {
    return () => { cleanup() }
  }, [cleanup])

  const lookupBarcode = useCallback(async (code: string) => {
    setIsLooking(true)
    setError('')
    setShowLabelCapture(false)
    try {
      const res = await debugFetch(`/api/barcode-lookup?code=${encodeURIComponent(code)}`)
      const data = await res.json()
      if (!res.ok || !data.found) {
        setError(
          `No nutrition info found for barcode ${code}. Try snapping a photo of the nutrition label instead.`
        )
        setShowLabelCapture(true)
        setIsLooking(false)
        return
      }
      onResult(data)
    } catch {
      setError('Could not reach the barcode database. Check your internet connection and try again.')
    }
    setIsLooking(false)
  }, [onResult])

  const startScanning = useCallback(async () => {
    cleanup()
    setError('')
    setShowLabelCapture(false)
    setScanning(true)

    // Small delay so React renders the visible container before the library tries to use it
    await new Promise(r => setTimeout(r, 100))

    try {
      const scanner = new Html5Qrcode(containerId)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 150 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          scanner.stop().catch(() => {})
          setScanning(false)
          lookupBarcode(decodedText)
        },
        () => {}
      )
    } catch (err: any) {
      setScanning(false)
      const msg = err?.message || ''
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setError('Camera access was blocked. Allow camera in your browser settings (Settings → Safari → Camera), or type the barcode number below.')
      } else {
        setError(`Camera could not start: ${msg || 'unknown error'}. Type the barcode number below instead.`)
      }
      setTimeout(() => manualInputRef.current?.focus(), 200)
    }
  }, [cleanup, lookupBarcode])

  const handleLabelPhoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsReadingLabel(true)
    setError('')

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const mediaType = file.type || 'image/jpeg'

        try {
          const res = await debugFetch('/api/read-label', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64, media_type: mediaType }),
          })
          const data = await res.json()

          if (!res.ok || !data.found) {
            setError(data.error || 'Could not read the nutrition label. Try a clearer photo with good lighting.')
            setIsReadingLabel(false)
            return
          }
          onResult(data)
        } catch {
          setError('Failed to read the label. Check your connection and try again.')
          setIsReadingLabel(false)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      setError('Could not load the photo. Please try again.')
      setIsReadingLabel(false)
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [onResult])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2500,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: 'min(400px, 100%)',
        background: C.white,
        borderRadius: 24,
        padding: 24,
        maxHeight: 'calc(100vh - 48px)',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: C.charcoal, fontFamily: "'Outfit', sans-serif" }}>
            Scan Barcode
          </h3>
          <button onClick={() => { cleanup(); onClose() }} style={{
            background: 'none', border: 'none', fontSize: '1.5rem', color: C.warmGray, cursor: 'pointer',
          }}>x</button>
        </div>

        {/* Camera scanner area — always in DOM so html5-qrcode can find it */}
        <div
          id={containerId}
          style={{
            width: '100%',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: scanning ? 16 : 0,
            minHeight: scanning ? 250 : 0,
            height: scanning ? 'auto' : 0,
          }}
        />

        {!scanning && !isLooking && !isReadingLabel && (
          <button onClick={startScanning} style={{
            width: '100%', padding: '40px 20px', borderRadius: 16,
            border: `3px dashed ${C.sand}`, background: C.cream,
            color: C.charcoal, fontSize: '1rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
            marginBottom: 16,
          }}>
            Open Camera to Scan
          </button>
        )}

        {scanning && (
          <button onClick={cleanup} style={{
            width: '100%', padding: '12px', borderRadius: 12,
            border: 'none', background: C.red, color: C.white,
            fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: "'Outfit', sans-serif", marginBottom: 16,
          }}>
            Stop Scanning
          </button>
        )}

        {/* Loading states */}
        {isLooking && (
          <div style={{
            padding: '20px', textAlign: 'center', color: C.charcoal,
            fontSize: '1rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif",
          }}>
            Looking up barcode...
          </div>
        )}

        {isReadingLabel && (
          <div style={{
            padding: '20px', textAlign: 'center', color: C.charcoal,
            fontSize: '1rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif",
          }}>
            Reading nutrition label...
          </div>
        )}

        {/* Snap nutrition label fallback */}
        {showLabelCapture && (
          <div style={{ marginBottom: 16 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleLabelPhoto}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isReadingLabel}
              style={{
                width: '100%', padding: '18px 20px', borderRadius: 16,
                border: `3px solid ${C.green}`, background: C.white,
                color: C.green, fontSize: '1rem', fontWeight: 800,
                cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Snap the Nutrition Label Instead
            </button>
            <p style={{
              fontSize: '0.8rem', color: C.warmGray, fontFamily: "'Outfit', sans-serif",
              margin: '8px 0 0', textAlign: 'center', lineHeight: 1.4,
            }}>
              Take a photo of the Nutrition Facts panel on the package.
            </p>
          </div>
        )}

        {/* Manual barcode entry */}
        <div style={{ marginBottom: 12 }}>
          <p style={{
            fontSize: '0.85rem', color: C.charcoal, fontFamily: "'Outfit', sans-serif",
            margin: '0 0 10px', fontWeight: 600,
          }}>
            {scanning ? 'Or type the barcode number:' : 'Enter barcode number:'}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={manualInputRef}
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="e.g. 0049000042566"
              inputMode="numeric"
              style={{
                flex: 1, padding: '14px 16px', borderRadius: 12,
                border: `2px solid ${C.sand}`, background: C.cream,
                fontSize: '1.1rem', fontFamily: "'Outfit', sans-serif",
                outline: 'none', color: C.charcoal, fontWeight: 600,
              }}
              onFocus={e => { e.currentTarget.style.borderColor = C.ocean }}
              onBlur={e => { e.currentTarget.style.borderColor = C.sand }}
              onKeyDown={e => { if (e.key === 'Enter' && manualCode) { cleanup(); lookupBarcode(manualCode) } }}
            />
            <button
              onClick={() => { cleanup(); lookupBarcode(manualCode) }}
              disabled={!manualCode || isLooking}
              style={{
                padding: '14px 20px', borderRadius: 12, border: 'none',
                background: manualCode ? C.ocean : C.sand,
                color: manualCode ? C.white : C.warmGray,
                fontSize: '1rem', fontWeight: 700, cursor: manualCode ? 'pointer' : 'not-allowed',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {isLooking ? '...' : 'Look Up'}
            </button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div style={{
            color: C.red, fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif",
            lineHeight: 1.5, padding: '12px 14px',
            background: '#FFF0F0', borderRadius: 12,
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
