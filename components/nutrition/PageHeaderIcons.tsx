'use client'

import { useState } from 'react'
import { Bell, Menu } from 'lucide-react'
import Link from 'next/link'
import { FullScreenMenu } from './FullScreenMenu'
import { C } from '@/lib/nutrition/colors'

interface PageHeaderIconsProps {
  iconColor?: string
  bgColor?: string
  size?: number
}

export function NotificationIcon({ iconColor = C.charcoal, bgColor = 'rgba(0,0,0,0.04)', size = 40 }: PageHeaderIconsProps) {
  return (
    <Link
      href="/settings"
      aria-label="Notifications"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
      }}
    >
      <Bell size={size * 0.5} color={iconColor} strokeWidth={2} />
    </Link>
  )
}

export function MenuIcon({ iconColor = C.charcoal, bgColor = 'rgba(0,0,0,0.04)', size = 40 }: PageHeaderIconsProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <FullScreenMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <button
        onClick={() => setMenuOpen(true)}
        aria-label="Menu"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: bgColor,
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Menu size={size * 0.5} color={iconColor} strokeWidth={2} />
      </button>
    </>
  )
}
