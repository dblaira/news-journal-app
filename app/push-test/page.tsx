'use client'

import { useState } from 'react'
import { usePush } from '@/components/push-notification-provider'

export default function PushTestPage() {
  const { permission, isSubscribed, subscribe, unsubscribe } = usePush()
  const [log, setLog] = useState<string[]>([])
  const [sending, setSending] = useState(false)

  function addLog(msg: string) {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()} — ${msg}`])
  }

  async function handleSubscribe() {
    addLog('Requesting permission and subscribing...')
    const success = await subscribe()
    addLog(success ? 'Subscribed successfully ✓' : 'Subscribe failed ✗')
  }

  async function handleUnsubscribe() {
    addLog('Unsubscribing...')
    await unsubscribe()
    addLog('Unsubscribed ✓')
  }

  async function handleTestPush() {
    setSending(true)
    addLog('Sending test push...')
    try {
      const res = await fetch('/api/push/test', {
        method: 'POST',
        credentials: 'same-origin',
      })
      const data = await res.json()
      addLog(`Response ${res.status}: ${JSON.stringify(data)}`)
    } catch (err) {
      addLog(`Error: ${err}`)
    }
    setSending(false)
  }

  async function handleCheckSW() {
    if (!('serviceWorker' in navigator)) {
      addLog('Service workers not supported ✗')
      return
    }
    const reg = await navigator.serviceWorker.getRegistration('/')
    addLog(reg ? `Service worker: ${reg.active?.state || 'registered'} ✓` : 'Service worker: NOT registered ✗')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      padding: '2rem',
      fontFamily: "Georgia, 'Times New Roman', serif",
    }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Push Notification Test</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Tap each button in order to test the full pipeline.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
        <div style={{
          padding: '1rem',
          background: '#1a1a1a',
          borderRadius: '8px',
          fontSize: '0.85rem',
        }}>
          <div>Permission: <strong>{permission}</strong></div>
          <div>Subscribed: <strong>{isSubscribed ? 'Yes ✓' : 'No'}</strong></div>
        </div>

        <button onClick={handleCheckSW} style={btnStyle}>
          1. Check Service Worker
        </button>

        {!isSubscribed ? (
          <button onClick={handleSubscribe} style={{ ...btnStyle, background: '#DC143C' }}>
            2. Subscribe to Push
          </button>
        ) : (
          <button onClick={handleUnsubscribe} style={{ ...btnStyle, background: '#555' }}>
            2. Unsubscribe
          </button>
        )}

        <button
          onClick={handleTestPush}
          disabled={sending || !isSubscribed}
          style={{
            ...btnStyle,
            background: isSubscribed ? '#1a6b3c' : '#333',
            opacity: sending ? 0.6 : 1,
            cursor: (!isSubscribed || sending) ? 'not-allowed' : 'pointer',
          }}
        >
          {sending ? 'Sending...' : '3. Send Test Notification'}
        </button>
      </div>

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: '#111',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        lineHeight: 1.8,
        maxHeight: '300px',
        overflow: 'auto',
        color: 'rgba(255,255,255,0.7)',
      }}>
        {log.length === 0 ? 'Waiting...' : log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '0.85rem 1.25rem',
  borderRadius: '8px',
  border: 'none',
  background: '#2a2a2a',
  color: '#fff',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'left',
}
