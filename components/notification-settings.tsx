'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePush } from '@/components/push-notification-provider'

interface Device {
  id: string
  device_name: string | null
  timezone: string | null
  created_at: string
  last_used_at: string | null
}

export function NotificationSettings() {
  const { permission, isSubscribed, subscribe, unsubscribe } = usePush()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [testStatus, setTestStatus] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/push/devices', { credentials: 'same-origin' })
      if (res.ok) {
        const data = await res.json()
        setDevices(data.devices || [])
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices, isSubscribed])

  async function handleToggle() {
    setToggling(true)
    if (isSubscribed) {
      await unsubscribe()
    } else {
      await subscribe()
    }
    await fetchDevices()
    setToggling(false)
  }

  async function handleTestPush() {
    setLoading(true)
    setTestStatus(null)
    try {
      const res = await fetch('/api/push/test', {
        method: 'POST',
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (res.ok) {
        setTestStatus(`Sent to ${data.sent} device${data.sent !== 1 ? 's' : ''}${data.failed ? `, ${data.failed} failed` : ''}`)
      } else {
        setTestStatus(data.error || 'Failed to send')
      }
    } catch {
      setTestStatus('Network error')
    }
    setLoading(false)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function getPermissionLabel() {
    if (permission === 'unsupported') return 'Not supported on this browser'
    if (permission === 'denied') return 'Blocked by browser'
    if (permission === 'granted' && isSubscribed) return 'Enabled'
    if (permission === 'granted' && !isSubscribed) return 'Permitted but not subscribed'
    return 'Not enabled'
  }

  function getStatusColor() {
    if (permission === 'granted' && isSubscribed) return '#22c55e'
    if (permission === 'denied') return '#ef4444'
    return 'rgba(255,255,255,0.4)'
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <h2 style={{
        fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
        fontSize: '1.75rem',
        fontWeight: 700,
        color: '#fff',
        marginBottom: '2rem',
      }}>
        Notification Settings
      </h2>

      {/* Status card */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1rem',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}>
          <div>
            <div style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#fff',
              marginBottom: '0.25rem',
            }}>
              Push Notifications
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.5)',
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: getStatusColor(),
                display: 'inline-block',
              }} />
              {getPermissionLabel()}
            </div>
          </div>

          {/* Toggle */}
          {permission !== 'unsupported' && permission !== 'denied' && (
            <button
              onClick={handleToggle}
              disabled={toggling}
              style={{
                position: 'relative',
                width: '48px',
                height: '28px',
                borderRadius: '14px',
                border: 'none',
                background: isSubscribed ? '#DC143C' : 'rgba(255,255,255,0.2)',
                cursor: toggling ? 'wait' : 'pointer',
                transition: 'background 0.2s ease',
                opacity: toggling ? 0.6 : 1,
              }}
            >
              <span style={{
                position: 'absolute',
                top: '3px',
                left: isSubscribed ? '23px' : '3px',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s ease',
              }} />
            </button>
          )}
        </div>

        {permission === 'denied' && (
          <p style={{
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.4)',
            lineHeight: 1.5,
            margin: 0,
          }}>
            Notifications are blocked. To enable them, open your browser settings and allow notifications for this site.
          </p>
        )}
      </div>

      {/* Test button */}
      {isSubscribed && (
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1rem',
        }}>
          <button
            onClick={handleTestPush}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: '#2a2a2a',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.15s ease',
            }}
          >
            {loading ? 'Sending...' : 'Send Test Notification'}
          </button>
          {testStatus && (
            <p style={{
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.5)',
              marginTop: '0.75rem',
              marginBottom: 0,
            }}>
              {testStatus}
            </p>
          )}
        </div>
      )}

      {/* Devices list */}
      {devices.length > 0 && (
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <h3 style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginTop: 0,
            marginBottom: '1rem',
          }}>
            Subscribed Devices
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {devices.map(device => (
              <div key={device.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: '#111',
                borderRadius: '8px',
              }}>
                <div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#fff',
                    fontWeight: 500,
                  }}>
                    {device.device_name || 'Unknown device'}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.4)',
                    marginTop: '0.2rem',
                  }}>
                    {device.timezone || 'No timezone'} · Added {formatDate(device.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
