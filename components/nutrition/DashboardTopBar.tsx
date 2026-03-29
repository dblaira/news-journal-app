'use client'

import { useState } from 'react'
import { Bell, Menu } from 'lucide-react'
import Link from 'next/link'
import { FullScreenMenu } from './FullScreenMenu'
import { C } from '@/lib/nutrition/colors'

const fontFamily = `'Outfit', 'Avenir Next', 'Helvetica Neue', sans-serif`

interface DashboardTopBarProps {
  firstName: string
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardTopBar({ firstName }: DashboardTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <FullScreenMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div style={{ padding: '18px 20px 0' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Link
            href="/settings"
            aria-label="Notifications"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: C.charcoal + '0A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={22} color={C.charcoal} strokeWidth={2} />
          </Link>

          <h1 style={{
            margin: 0,
            fontSize: 30,
            fontWeight: 800,
            color: C.charcoal,
            letterSpacing: '-0.03em',
            fontFamily,
          }}>
            Optimism.
          </h1>

          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Menu"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: C.charcoal + '0A',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Menu size={22} color={C.charcoal} strokeWidth={2} />
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <p style={{
            margin: 0,
            fontSize: 18,
            color: C.charcoal,
            opacity: 0.5,
            fontWeight: 500,
            fontFamily,
          }}>
            {getGreeting()}, {firstName}
          </p>
          <p style={{
            margin: '2px 0 0',
            fontSize: 15,
            color: C.charcoal,
            opacity: 0.35,
            fontWeight: 500,
            fontFamily,
          }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </>
  )
}
