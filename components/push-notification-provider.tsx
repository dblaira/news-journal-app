'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

interface PushContextValue {
  permission: NotificationPermission | 'unsupported'
  isSubscribed: boolean
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<void>
}

const PushContext = createContext<PushContextValue>({
  permission: 'unsupported',
  isSubscribed: false,
  subscribe: async () => false,
  unsubscribe: async () => {},
})

export function usePush() {
  return useContext(PushContext)
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotificationProvider({ children }: { children: ReactNode }) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission)

    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        setSwRegistration(reg)
        return reg.pushManager.getSubscription()
      })
      .then(sub => {
        setIsSubscribed(!!sub)
      })
      .catch(err => {
        console.error('Service worker registration failed:', err)
      })
  }, [])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!swRegistration) return false

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      console.error('VAPID public key not configured')
      return false
    }

    const result = await Notification.requestPermission()
    setPermission(result)

    if (result !== 'granted') return false

    try {
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      })

      const subJSON = subscription.toJSON()

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJSON.endpoint,
          keys: subJSON.keys,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      })

      if (response.ok) {
        setIsSubscribed(true)
        return true
      }

      return false
    } catch (err) {
      console.error('Push subscription failed:', err)
      return false
    }
  }, [swRegistration])

  const unsubscribe = useCallback(async () => {
    if (!swRegistration) return

    try {
      const subscription = await swRegistration.pushManager.getSubscription()
      if (!subscription) return

      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      })

      await subscription.unsubscribe()
      setIsSubscribed(false)
    } catch (err) {
      console.error('Push unsubscribe failed:', err)
    }
  }, [swRegistration])

  return (
    <PushContext.Provider value={{ permission, isSubscribed, subscribe, unsubscribe }}>
      {children}
    </PushContext.Provider>
  )
}
