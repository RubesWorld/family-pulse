import type {
  Activity,
  ActivityWithUser,
  Database,
} from '@/types/database'
import { unwrapRows } from './errors'
import type { DbClient } from './types'

export const activityKeys = {
  all: ['activities'] as const,
  family: (familyId: string) => ['activities', 'family', familyId] as const,
  own: (userId: string) => ['activities', 'user', userId] as const,
}

/**
 * How many activities the feed loads. Was `FEED_ACTIVITY_LIMIT` in
 * `feed/page.tsx`; before that the query had no limit at all and its cost grew
 * without bound as the app aged.
 */
export const FEED_ACTIVITY_LIMIT = 100

/** How many recent activities the profile screen shows. */
export const PROFILE_ACTIVITY_LIMIT = 5

/**
 * The family's activities, newest first.
 *
 * Unfiltered by `user_id` — the `activities` SELECT policy scopes it to
 * `user_id IN (SELECT public.current_family_member_ids())`.
 */
export async function fetchFamilyActivities(
  db: DbClient,
  limit: number = FEED_ACTIVITY_LIMIT
): Promise<ActivityWithUser[]> {
  const result = await db
    .from('activities')
    .select('*, users(name, avatar_url, phone_number)')
    .order('created_at', { ascending: false })
    .limit(limit)

  return unwrapRows<ActivityWithUser>(result)
}

/** The caller's own recent activities. */
export async function fetchOwnActivities(
  db: DbClient,
  userId: string,
  limit: number = PROFILE_ACTIVITY_LIMIT
): Promise<Activity[]> {
  const result = await db
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return unwrapRows<Activity>(result)
}

export type NewActivity = Database['public']['Tables']['activities']['Insert']

/**
 * Post one activity.
 *
 * `user_id` is part of the argument rather than resolved in here: the caller
 * already holds the signed-in user from the session context, and asking
 * `auth.getUser()` again — which is what `add/page.tsx` did — is a round-trip
 * to answer a question the page had answered before it rendered. What actually
 * enforces the id is the `activities` INSERT policy's
 * `WITH CHECK (user_id = auth.uid())`; a wrong one here is rejected, not
 * accepted.
 */
export async function createActivity(
  db: DbClient,
  activity: NewActivity
): Promise<void> {
  const { error } = await db.from('activities').insert(activity)

  if (error) throw error
}
