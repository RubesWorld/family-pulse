// Service Worker for Push Notifications
// This file handles push notifications when the app is in the background

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated')
  event.waitUntil(clients.claim())
})

self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received', event)

  if (!event.data) {
    console.log('Push event but no data')
    return
  }

  try {
    const data = event.data.json()

    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/connect',
        questionId: data.questionId,
        activityId: data.activityId,
      },
      actions: data.actions || []
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  } catch (error) {
    console.error('Error showing notification:', error)
  }
})

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)

  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/connect'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})
