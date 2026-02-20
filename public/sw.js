// Understood — Push Notification Service Worker

self.addEventListener('push', function(event) {
  if (!event.data) return

  const payload = event.data.json()

  const options = {
    body: payload.body,
    icon: '/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: payload.connectionId || 'understood-default',
    data: {
      url: payload.url || '/',
      connectionId: payload.connectionId,
    },
    actions: [
      { action: 'landed', title: '\u2713 This landed' },
      { action: 'snooze', title: 'Snooze' },
    ],
    vibrate: [100, 50, 100],
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Understood', options)
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  const connectionId = event.notification.data.connectionId
  const action = event.action || 'opened'

  event.waitUntil(
    fetch('/api/notifications/response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId, action }),
    })
    .catch(function() { /* fire-and-forget */ })
    .then(function() {
      if (action !== 'snooze') {
        return clients.openWindow(event.notification.data.url || '/')
      }
    })
  )
})

self.addEventListener('install', function(event) {
  self.skipWaiting()
})

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim())
})
