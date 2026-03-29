'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Utensils, Plus, Dumbbell, Droplets } from 'lucide-react'
import { CaptureFAB } from './CaptureFAB'
import { C } from '@/lib/nutrition/colors'

const fontFamily = `'Outfit', 'Avenir Next', 'Helvetica Neue', sans-serif`

const tabs = [
  { label: 'Home', icon: Home, href: '/', match: (p: string) => p === '/' },
  { label: 'Food', icon: Utensils, href: '/log-food', match: (p: string) => p.startsWith('/log-food') || p.startsWith('/food') },
  { label: 'Log', icon: Plus, href: null, match: () => false },
  { label: 'Workouts', icon: Dumbbell, href: '/workouts', match: (p: string) => p.startsWith('/workouts') },
  { label: 'Hydration', icon: Droplets, href: '/hydration', match: (p: string) => p.startsWith('/hydration') },
]

export function BottomTabBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [fabOpen, setFabOpen] = useState(false)

  if (pathname === '/login') return null

  return (
    <>
      <CaptureFAB
        isOpen={fabOpen}
        onClose={() => setFabOpen(false)}
        onEntryCreated={() => {
          setFabOpen(false)
          router.refresh()
        }}
      />

      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: C.white,
          boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
          zIndex: 999,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            height: 64,
            position: 'relative',
          }}
        >
          {tabs.map((tab) => {
            if (tab.href === null) {
              return (
                <button
                  key="fab"
                  onClick={() => setFabOpen(true)}
                  aria-label="Log intake"
                  style={{
                    position: 'relative',
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: C.ocean,
                    border: 'none',
                    color: C.white,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    marginTop: -24,
                    boxShadow: '0 4px 20px rgba(29, 93, 155, 0.4)',
                    flexShrink: 0,
                  }}
                >
                  <Plus size={30} strokeWidth={2.5} />
                </button>
              )
            }

            const active = tab.match(pathname)
            const Icon = tab.icon

            return (
              <Link
                key={tab.label}
                href={tab.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  flex: 1,
                  height: '100%',
                  color: active ? C.charcoal : C.warmGray,
                  transition: 'color 0.15s ease',
                }}
              >
                <Icon size={24} strokeWidth={active ? 2.5 : 1.8} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: active ? 700 : 500,
                    marginTop: 3,
                    fontFamily,
                    letterSpacing: '0.02em',
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
