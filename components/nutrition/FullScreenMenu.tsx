'use client'

import { X, Home, Utensils, Dumbbell, Droplets, LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signout } from '@/app/nutrition/login-actions'
import { C } from '@/lib/nutrition/colors'

const fontFamily = `'Outfit', 'Avenir Next', 'Helvetica Neue', sans-serif`

const menuItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Food', icon: Utensils, href: '/log-food' },
  { label: 'Workouts', icon: Dumbbell, href: '/workouts' },
  { label: 'Hydration', icon: Droplets, href: '/hydration' },
]

interface FullScreenMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function FullScreenMenu({ isOpen, onClose }: FullScreenMenuProps) {
  const pathname = usePathname()

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: C.charcoal,
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
          onClick={onClose}
          aria-label="Close menu"
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: C.white + '14',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={24} color={C.cream} />
        </button>
      </div>

      <nav style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 32px',
        gap: 8,
      }}>
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                textDecoration: 'none',
                padding: '20px 16px',
                borderRadius: 16,
                background: active ? C.white + '0A' : 'transparent',
                transition: 'background 0.15s ease',
              }}
            >
              <Icon
                size={32}
                strokeWidth={1.8}
                color={active ? C.sun : C.warmGray}
              />
              <span style={{
                fontSize: 36,
                fontWeight: 800,
                color: active ? C.cream : C.warmGray,
                fontFamily,
                letterSpacing: '-0.02em',
              }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '0 32px 32px' }}>
        <form action={signout}>
          <button
            type="submit"
            style={{
              width: '100%',
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              background: C.red + '20',
              border: 'none',
              borderRadius: 16,
              cursor: 'pointer',
              fontFamily,
            }}
          >
            <LogOut size={22} color={C.red} />
            <span style={{
              fontSize: 20,
              fontWeight: 700,
              color: C.red,
            }}>
              Log out
            </span>
          </button>
        </form>
      </div>
    </div>
  )
}
