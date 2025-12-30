// Utility functions for push notifications

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) {
    console.log('Push notifications not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })

    console.log('Service Worker registered:', registration)
    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    return 'denied'
  }

  try {
    const permission = await Notification.requestPermission()
    console.log('Notification permission:', permission)
    return permission
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return 'denied'
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    })

    console.log('Push subscription created:', subscription)
    return subscription
  } catch (error) {
    console.error('Error subscribing to push:', error)
    return null
  }
}

/**
 * Get current push subscription
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return subscription
  } catch (error) {
    console.error('Error getting subscription:', error)
    return null
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const subscription = await getCurrentSubscription()
    if (subscription) {
      const success = await subscription.unsubscribe()
      console.log('Unsubscribed from push:', success)
      return success
    }
    return true
  } catch (error) {
    console.error('Error unsubscribing from push:', error)
    return false
  }
}

/**
 * Convert VAPID public key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/**
 * Save subscription to database
 */
export async function saveSubscriptionToServer(
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to save subscription')
    }

    console.log('Subscription saved to server')
    return true
  } catch (error) {
    console.error('Error saving subscription to server:', error)
    return false
  }
}

/**
 * Remove subscription from database
 */
export async function removeSubscriptionFromServer(
  endpoint: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint }),
    })

    if (!response.ok) {
      throw new Error('Failed to remove subscription')
    }

    console.log('Subscription removed from server')
    return true
  } catch (error) {
    console.error('Error removing subscription from server:', error)
    return false
  }
}

/**
 * Complete flow to enable push notifications
 */
export async function enablePushNotifications(): Promise<boolean> {
  try {
    // 1. Register service worker
    const registration = await registerServiceWorker()
    if (!registration) {
      return false
    }

    // 2. Request permission
    const permission = await requestNotificationPermission()
    if (permission !== 'granted') {
      return false
    }

    // 3. Subscribe to push
    const subscription = await subscribeToPush(registration)
    if (!subscription) {
      return false
    }

    // 4. Save to server
    const saved = await saveSubscriptionToServer(subscription)
    return saved
  } catch (error) {
    console.error('Error enabling push notifications:', error)
    return false
  }
}

/**
 * Complete flow to disable push notifications
 */
export async function disablePushNotifications(): Promise<boolean> {
  try {
    const subscription = await getCurrentSubscription()
    if (!subscription) {
      return true
    }

    const endpoint = subscription.endpoint

    // 1. Unsubscribe from push
    const unsubscribed = await unsubscribeFromPush()
    if (!unsubscribed) {
      return false
    }

    // 2. Remove from server
    const removed = await removeSubscriptionFromServer(endpoint)
    return removed
  } catch (error) {
    console.error('Error disabling push notifications:', error)
    return false
  }
}
