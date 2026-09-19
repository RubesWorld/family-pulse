// Service Worker: push notifications + a minimal offline app shell.
//
// THE CACHING RULE, because getting it wrong is a data leak rather than a bug:
// this app is cookie-authenticated and every document and API response is
// scoped to one user's family. A cached HTML document would survive logout and
// could be handed to the next session on the device. So the fetch handler is an
// allowlist, not a denylist — only build-immutable and user-independent assets
// are ever written to a cache, and anything not explicitly matched is left to
// the network by not calling respondWith() at all.

// Bump this when the precache list or the handler logic changes; activate()
// deletes every family-pulse cache that isn't the current one.
const CACHE_VERSION = 'v1'
const STATIC_CACHE = `family-pulse-static-${CACHE_VERSION}`

const OFFLINE_URL = '/offline'

// Identical for every user and every session. Nothing else belongs here.
// These are served cache-first, so editing any of them needs a CACHE_VERSION
// bump — unlike /_next/static, their URLs do not change when contents do.
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
]

// Used only if precaching the real /offline page failed, so that a navigation
// failure still shows something rather than the browser's error page.
const FALLBACK_HTML = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline — Family Pulse</title></head>
<body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#17110C;color:#F6EADA;font:600 15px/1.5 -apple-system,system-ui,sans-serif">
<p style="padding:0 2rem;text-align:center">No connection.</p></body></html>`

async function precache() {
  const cache = await caches.open(STATIC_CACHE)

  // One at a time rather than cache.addAll, which is all-or-nothing: a single
  // asset 404ing mid-deploy would fail install and leave no worker at all,
  // taking the push handlers down with it.
  await Promise.allSettled(
    PRECACHE_URLS.map(async (url) => {
      const response = await fetch(url, { cache: 'reload' })

      // A redirect means auth intercepted this request, and we would be
      // storing the login page under the asset's key. Refuse it.
      if (!response.ok || response.redirected) return

      await cache.put(url, response)
    })
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache())
  self.skipWaiting()
})

async function dropStaleCaches() {
  const names = await caches.keys()

  await Promise.all(
    names
      .filter((name) => name.startsWith('family-pulse-') && name !== STATIC_CACHE)
      .map((name) => caches.delete(name))
  )
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await dropStaleCaches()
      await self.clients.claim()
    })()
  )
})

// Hashed by the build and served immutable, so the filename is the version —
// a cache hit can never be stale. This is also where next/font puts its woff2
// files, which is why fonts need no separate rule.
function isImmutableAsset(url) {
  return url.pathname.startsWith('/_next/static/')
}

function isPrecachedAsset(url) {
  return PRECACHE_URLS.includes(url.pathname)
}

async function cacheFirst(request) {
  const cached = await caches.match(request, {
    cacheName: STATIC_CACHE,
    // Safe here specifically because everything in this cache is either
    // content-addressed by the build hash or identical for all users, so no
    // Vary header can select a different body. Without this, Next's
    // `Vary: RSC, ...` on some responses turns into silent cache misses.
    ignoreVary: true,
  })
  if (cached) return cached

  const response = await fetch(request)

  if (response.ok && !response.redirected) {
    const cache = await caches.open(STATIC_CACHE)
    // Clone first: a body can only be consumed once, and the caller needs it.
    await cache.put(request, response.clone()).catch(() => {})
  }

  return response
}

async function networkWithOfflineFallback(request) {
  try {
    // fetch() only rejects on an actual network failure, so a 500 or a
    // redirect to /login still passes straight through to the browser.
    return await fetch(request)
  } catch {
    const cached = await caches.match(OFFLINE_URL, {
      cacheName: STATIC_CACHE,
      // The failing navigation may carry router headers the precached copy
      // was not fetched with, and Next varies on those. We want the HTML
      // regardless of how the request that failed was framed.
      ignoreVary: true,
    })

    if (cached) return cached

    return new Response(FALLBACK_HTML, {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Never intervene in writes, and never in cross-origin traffic — that is
  // where the Supabase calls go.
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navigations are checked before the precache list on purpose: /offline is
  // precached but arrives as a navigation, and a navigation carries router
  // headers the precached copy was not fetched with. Routing it through the
  // fallback path below — which matches with ignoreVary — is what makes
  // visiting /offline directly while offline actually work.
  //
  // Documents are otherwise never cached. The HTML here is per-user and
  // cookie-authenticated: a cached document would outlive logout and could be
  // served to the next session on the device. Only the failure is cached.
  if (request.mode === 'navigate') {
    event.respondWith(networkWithOfflineFallback(request))
    return
  }

  if (isImmutableAsset(url) || isPrecachedAsset(url)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Deliberately unhandled, and left to the network: /api/*, the RSC payloads
  // the router fetches on navigation (the page URL with ?_rsc=), /auth/*, and
  // every HTML document. All of them are per-user.
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
