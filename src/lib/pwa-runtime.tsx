'use client'

import { useEffect } from 'react'
import {
  VAPID_PUBLIC_KEY,
  isPushSupported,
  matchesConfiguredVapidKey,
  registerServiceWorker,
  saveSubscriptionToServer,
  subscribeToPush,
} from '@/lib/push'
import { getInstallState } from '@/lib/pwa'

/**
 * A healthy, unchanged subscription is re-POSTed no more often than this.
 *
 * Not just belt-and-braces: send-push.ts flips is_active to false when the
 * push service answers 410 Gone, and the client has no way to observe that.
 * If the browser still hands back the same subscription afterwards there is
 * nothing to re-subscribe, so the only route back to a working notification is
 * to re-save it periodically and let the server mark it active again.
 */
const REVALIDATE_AFTER_MS = 24 * 60 * 60 * 1000

const LAST_SAVED_KEY = 'fp-push-last-saved'

/**
 * The userId is part of the record, not just the endpoint.
 *
 * A push endpoint belongs to the browser, not the account, so on a shared
 * family device two people have the *same* endpoint. Keyed on endpoint alone,
 * the second person to open the app would look up the first person's record,
 * match, and skip the save — leaving their subscription filed under the first
 * account, so they get no notifications and the first person's arrive on a
 * phone they are not holding.
 */
interface LastSaved {
  endpoint: string
  userId: string
  at: number
}

function readLastSaved(): LastSaved | null {
  try {
    const raw = localStorage.getItem(LAST_SAVED_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<LastSaved>
    if (
      typeof parsed.endpoint !== 'string' ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.at !== 'number'
    ) {
      return null
    }

    return { endpoint: parsed.endpoint, userId: parsed.userId, at: parsed.at }
  } catch {
    // Unparseable, or Safari private mode throwing on localStorage. Treating
    // it as "never saved" only costs one extra POST.
    return null
  }
}

function writeLastSaved(endpoint: string, userId: string): void {
  try {
    const record: LastSaved = { endpoint, userId, at: Date.now() }
    localStorage.setItem(LAST_SAVED_KEY, JSON.stringify(record))
  } catch {
    // Non-fatal: we just re-save on the next launch.
  }
}

function needsResave(endpoint: string, userId: string): boolean {
  const last = readLastSaved()
  if (!last) return true
  if (last.endpoint !== endpoint) return true
  if (last.userId !== userId) return true

  return Date.now() - last.at > REVALIDATE_AFTER_MS
}

/**
 * Make sure a subscription matching this build's VAPID key exists and the
 * server knows about it. Returns quietly on any failure — this runs on every
 * launch and must never be something the user notices.
 */
async function repairSubscription(
  registration: ServiceWorkerRegistration,
  userId: string
): Promise<void> {
  const existing = await registration.pushManager.getSubscription()

  // iOS drops the subscription outright when the Home Screen icon is removed
  // and re-added, and a key mismatch means the VAPID pair was rotated under
  // it. Neither is repairable — both need a new subscription.
  const reusable =
    existing && matchesConfiguredVapidKey(existing) ? existing : null

  if (existing && !reusable) {
    await existing.unsubscribe().catch(() => {})
  }

  const subscription = reusable ?? (await subscribeToPush(registration))
  if (!subscription) return

  // A subscription we just created is unknown to the server by definition.
  if (reusable && !needsResave(subscription.endpoint, userId)) return

  if (await saveSubscriptionToServer(subscription)) {
    writeLastSaved(subscription.endpoint, userId)
  }
}

async function startPwaRuntime(userId: string): Promise<void> {
  // Registered unconditionally and before any permission check: the worker is
  // also what serves the offline shell, and registering one prompts the user
  // for nothing. Only the repair below needs permission.
  const registration = await registerServiceWorker()
  if (!registration) return

  // Skip only the one case that cannot work: an iOS browser tab, where the
  // push APIs look available but subscribing does not work until the app is
  // on the Home Screen. Android and desktop push fine from a plain tab, so
  // gating this on standalone alone would leave those subscriptions to die
  // exactly the way this function exists to prevent.
  if (getInstallState() === 'ios-browser') return

  // The hard rule for this whole component: repair, never nag. We never call
  // Notification.requestPermission(), so a user who has not opted in — or who
  // has said no — sees no change at all.
  if (Notification.permission !== 'granted') return

  // Absent at runtime means every subscribe attempt would throw on launch.
  if (!VAPID_PUBLIC_KEY) return

  await repairSubscription(registration, userId)
}

/**
 * Registers the service worker and silently revives dead push subscriptions.
 *
 * Renders nothing. Until this existed, the settings screen was the only place
 * that ever called subscribe, so once a subscription died nothing re-created
 * it: the user silently stopped receiving the weekly "it's your turn" push —
 * the core loop of the product — with no symptom anywhere in the UI.
 */
export function PwaRuntime({ userId }: { userId: string }) {
  useEffect(() => {
    if (!isPushSupported()) return

    startPwaRuntime(userId).catch((error) => {
      console.error('PWA runtime startup failed:', error)
    })
  }, [userId])

  return null
}
