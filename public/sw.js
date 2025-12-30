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
    // Try to get the data as text first to debug
    const textData = event.data.text()
    console.log('Raw push data (text):', textData)

    // Parse the JSON
    const data = JSON.parse(textData)
    console.log('Parsed push data:', data)

    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'family-pulse-notification',
      requireInteraction: false,
      data: {
        url: data.url || '/connect',
        questionId: data.questionId,
        activityId: data.activityId,
      },
    }

    console.log('About to show notification with title:', data.title)
    console.log('Notification options:', options)

    event.waitUntil(
      self.registration.showNotification(data.title, options)
        .then(() => {
          console.log('✅ Notification shown successfully!')
        })
        .catch((err) => {
          console.error('❌ Failed to show notification:', err)
        })
    )
  } catch (error) {
    console.error('Error in push event handler:', error)
    console.error('Error details:', error.message, error.stack)
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
