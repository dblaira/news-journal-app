'use client'

import { useState, useEffect } from 'react'
import { usePush } from '@/components/push-notification-provider'

const DISMISS_KEY = 'understood-push-dismissed-at'
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

export function PushPermissionPrompt() {
  const { permission, isSubscribed, subscribe } = usePush()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (permission === 'unsupported' || permission === 'denied' || isSubscribed) return

    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10)
      if (elapsed < DISMISS_COOLDOWN_MS) return
    }

    const timer = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(timer)
  }, [permission, isSubscribed])

  if (!visible) return null

  async function handleEnable() {
    setLoading(true)
    const success = await subscribe()
    setLoading(false)
    if (success) {
      setVisible(false)
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
    setVisible(false)
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 2rem)',
      maxWidth: '400px',
      background: '#1a1a1a',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      zIndex: 9999,
      animation: 'slideUp 0.3s ease-out',
    }}>
      <p style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: '0.95rem',
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 1.5,
        margin: 0,
        marginBottom: '1.25rem',
      }}>
        Your Connections can follow you. Enable notifications to receive your best thinking wherever you are.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={handleEnable}
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: '#DC143C',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.15s ease',
          }}
        >
          {loading ? 'Enabling...' : 'Enable'}
        </button>
        <button
          onClick={handleDismiss}
          style={{
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Not now
        </button>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
