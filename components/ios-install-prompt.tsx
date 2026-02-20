'use client'

import { useState, useEffect } from 'react'

const IOS_DISMISS_KEY = 'understood-ios-install-dismissed'

function isIosSafari(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua)
  return isIos && isSafari
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone) ||
    window.matchMedia('(display-mode: standalone)').matches
}

export function IosInstallPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isIosSafari() || isStandalone()) return

    const dismissed = sessionStorage.getItem(IOS_DISMISS_KEY)
    if (dismissed) return

    const timer = setTimeout(() => setVisible(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  function handleDismiss() {
    sessionStorage.setItem(IOS_DISMISS_KEY, 'true')
    setVisible(false)
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 2rem)',
      maxWidth: '380px',
      background: '#1a1a1a',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      zIndex: 9999,
      animation: 'iosSlideUp 0.3s ease-out',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <p style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: '0.95rem',
          fontWeight: 600,
          color: '#fff',
          margin: 0,
        }}>
          Install Understood
        </p>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: 0,
            lineHeight: 1,
          }}
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>

      <p style={{
        fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.6)',
        lineHeight: 1.5,
        margin: 0,
        marginBottom: '1rem',
      }}>
        Add Understood to your home screen to receive push notifications with your Connections.
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        fontSize: '0.82rem',
        color: 'rgba(255,255,255,0.75)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.1)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#DC143C',
            flexShrink: 0,
          }}>1</span>
          <span>Tap the <strong style={{ color: '#fff' }}>Share</strong> button in Safari</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.1)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#DC143C',
            flexShrink: 0,
          }}>2</span>
          <span>Scroll down, tap <strong style={{ color: '#fff' }}>Add to Home Screen</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.1)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#DC143C',
            flexShrink: 0,
          }}>3</span>
          <span>Open from home screen to enable notifications</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes iosSlideUp {
          from { transform: translateX(-50%) translateY(30px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
