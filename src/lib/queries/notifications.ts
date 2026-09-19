import type { Database, NotificationPreferences } from '@/types/database'
import { unwrap } from './errors'
import type { DbClient } from './types'

/** The subset of preference columns the settings screen can change. */
export type NotificationPreferencesPatch = Omit<
  Database['public']['Tables']['notification_preferences']['Update'],
  'id' | 'user_id' | 'created_at' | 'updated_at'
>

export const notificationKeys = {
  all: ['notification-preferences'] as const,
  preferences: (userId: string) =>
    ['notification-preferences', userId] as const,
}

/**
 * The caller's notification preferences, or null when the row does not exist
 * yet.
 *
 * Read only. `settings/notifications/page.tsx:27` used to *insert* a default row
 * during render when this came back empty — a GET page that writes. That insert
 * is now `ensureNotificationPreferences` below, called from a mutation.
 *
 * `maybeSingle` because "no row yet" is the normal state for a user who has
 * never opened the settings screen.
 */
export async function fetchNotificationPreferences(
  db: DbClient,
  userId: string
): Promise<NotificationPreferences | null> {
  const result = await db
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  return unwrap(result)
}

/**
 * Return the caller's preference row, creating it with the column defaults if
 * it is missing.
 *
 * An upsert rather than the insert the render path used. There are already
 * three places that create this row — `09_notifications.sql:140-143` backfills
 * it, `api/push/subscribe:86-91` creates it, and this screen does — so any of
 * them can win the race. `UNIQUE(user_id)` means a plain insert loses that race
 * with a duplicate-key error; `onConflict: 'user_id'` makes losing it a no-op
 * that still returns the existing row. No column but `user_id` is named, so an
 * upsert onto an existing row cannot reset anyone's settings to the defaults.
 *
 * Requires both the INSERT and UPDATE policies on `notification_preferences`;
 * both are `user_id = auth.uid()`.
 */
export async function ensureNotificationPreferences(
  db: DbClient,
  userId: string
): Promise<NotificationPreferences> {
  const result = await db
    .from('notification_preferences')
    .upsert({ user_id: userId }, { onConflict: 'user_id' })
    .select()
    .single()

  return required(unwrap(result))
}

/**
 * Apply a partial change to the caller's preferences.
 *
 * Returns the stored row so the cache holds what the database actually has
 * rather than what the optimistic update guessed — `updated_at` is set by a
 * trigger (`09_notifications.sql:134-137`), so the two are never identical.
 */
export async function updateNotificationPreferences(
  db: DbClient,
  userId: string,
  patch: NotificationPreferencesPatch
): Promise<NotificationPreferences> {
  const result = await db
    .from('notification_preferences')
    .update(patch)
    .eq('user_id', userId)
    .select()
    .single()

  return required(unwrap(result))
}

/**
 * `single()` fails the request when it matches no row, so `unwrap` has already
 * thrown by the time this runs — but the generated types still describe `data`
 * as nullable. This states the guarantee once instead of casting it away twice.
 *
 * It is not dead weight either: an UPDATE that RLS narrows to zero rows lands
 * here, and silently returning null would leave the screen showing a change
 * that was never stored.
 */
function required<T>(row: T | null): T {
  if (row === null) {
    throw new Error('notification_preferences: expected a row, got none')
  }
  return row
}
