'use client'

import { NotificationSettings } from '@/components/notification-settings'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      padding: '2rem',
      fontFamily: "Georgia, 'Times New Roman', serif",
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.85rem',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '2rem',
          }}
        >
          ← Back
        </button>

        <h1 style={{
          fontFamily: "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif",
          fontSize: '2.25rem',
          fontWeight: 700,
          marginBottom: '2.5rem',
        }}>
          Settings
        </h1>

        <NotificationSettings />
      </div>
    </div>
  )
}
