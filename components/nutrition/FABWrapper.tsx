'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { CaptureFAB } from './CaptureFAB'

export function FABWrapper() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  if (pathname === '/login') return null

  return (
    <CaptureFAB
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onEntryCreated={() => {
        setIsOpen(false)
        router.refresh()
      }}
    />
  )
}
