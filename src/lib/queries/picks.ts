import type { PickWithUser, UserPick } from '@/types/database'
import { unwrapRows } from './errors'
import type { DbClient } from './types'

/**
 * `picks` is read by four screens and written from one editor, so every key
 * here starts with `'picks'`. That prefix is what lets a write invalidate all
 * of them in a line — `invalidateQueries({ queryKey: pickKeys.all })` — without
 * the editor holding a reference to any screen.
 */
export const pickKeys = {
  all: ['picks'] as const,
  /** Family-wide current picks, newest first, capped. */
  familyRecent: (familyId: string) =>
    ['picks', 'family', familyId, 'recent'] as const,
  /** Every family member's current picks, ungrouped. */
  familyCurrent: (familyId: string) =>
    ['picks', 'family', familyId, 'current'] as const,
  /** Family current picks from the last 24 h (the feed's window). */
  familyLatest: (familyId: string, sinceIso: string) =>
    ['picks', 'family', familyId, 'latest', sinceIso] as const,
  own: (userId: string) => ['picks', 'user', userId, 'current'] as const,
  ownVisible: (userId: string) =>
    ['picks', 'user', userId, 'current', 'non-empty'] as const,
  history: (userId: string, category: string) =>
    ['picks', 'user', userId, 'history', category] as const,
}

/**
 * How many picks the Family tab's "Fresh picks" section shows. Was inline at
 * `family/page.tsx:69`.
 */
export const FAMILY_RECENT_PICK_LIMIT = 10

/**
 * The family's most recent current picks, with each pick's author embedded.
 *
 * No `user_id` filter. The server version passed `.in('user_id', memberIds)`
 * with ids it had just looked up; client-side those ids would be a parameter
 * the caller picks, which is not a boundary. The
 * "Users can view family picks" policy scopes this to
 * `user_id IN (SELECT public.current_family_member_ids())`, so the rows that
 * come back are the family's rows — that is the whole answer, and the
 * duplicate filter only made it look otherwise.
 */
export async function fetchFamilyRecentPicks(
  db: DbClient,
  limit: number = FAMILY_RECENT_PICK_LIMIT
): Promise<PickWithUser[]> {
  const result = await db
    .from('picks')
    .select('*, users(name, avatar_url)')
    .eq('is_current', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  return unwrapRows<PickWithUser>(result)
}

/**
 * Every family member's current picks, unordered and uncapped.
 *
 * Feeds the per-member detail view. A family is a handful of people, so
 * fetching everyone's at once stays cheaper than a round-trip per tap — and in
 * cache it is now also cheaper than re-entering the tab.
 */
export async function fetchFamilyCurrentPicks(
  db: DbClient
): Promise<UserPick[]> {
  const result = await db.from('picks').select('*').eq('is_current', true)

  return unwrapRows<UserPick>(result)
}

/** The family's current picks created since `sinceIso`. The feed's window. */
export async function fetchFamilyPicksSince(
  db: DbClient,
  sinceIso: string
): Promise<PickWithUser[]> {
  const result = await db
    .from('picks')
    .select('*, users(name, avatar_url)')
    .eq('is_current', true)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })

  return unwrapRows<PickWithUser>(result)
}

/** The caller's own current picks. */
export async function fetchOwnCurrentPicks(
  db: DbClient,
  userId: string
): Promise<UserPick[]> {
  const result = await db
    .from('picks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_current', true)

  return unwrapRows<UserPick>(result)
}

/** The caller's own current picks that actually have a value set. */
export async function fetchOwnVisiblePicks(
  db: DbClient,
  userId: string
): Promise<UserPick[]> {
  const result = await db
    .from('picks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_current', true)
    .neq('value', '')
    .not('value', 'is', null)

  return unwrapRows<UserPick>(result)
}

/** One category's archived picks for one member, newest first. */
export async function fetchPickHistory(
  db: DbClient,
  userId: string,
  category: string
): Promise<UserPick[]> {
  const result = await db
    .from('picks')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .eq('is_current', false)
    .order('archived_at', { ascending: false })

  return unwrapRows<UserPick>(result)
}

/**
 * The feed's picks, already annotated with the value each one replaced.
 *
 * `attachPreviousValues` is not a pure fold — it issues its own query — so it
 * cannot run as a React Query `select`. Composing the two here rather than in
 * the feed component keeps the whole read in the portable layer.
 */
export async function fetchFamilyPicksSinceWithPrevious(
  db: DbClient,
  sinceIso: string
): Promise<PickWithPrevious<PickWithUser>[]> {
  const picks = await fetchFamilyPicksSince(db, sinceIso)

  return attachPreviousValues(db, picks)
}

export type PickWithPrevious<T> = T & { previous_value: string | null }

/**
 * Annotate each pick with the value it replaced, so the feed can show
 * "changed from X to Y".
 *
 * Ported unchanged from `feed/page.tsx:86`. One query covering every
 * (user, category) pair in play, rather than one per pick; the most recent
 * archived row per pair wins.
 */
export async function attachPreviousValues<
  T extends { user_id: string; category: string },
>(db: DbClient, picks: T[]): Promise<PickWithPrevious<T>[]> {
  if (picks.length === 0) return []

  const userIds = Array.from(new Set(picks.map((p) => p.user_id)))
  const categories = Array.from(new Set(picks.map((p) => p.category)))

  const archived = unwrapRows<{
    user_id: string
    category: string
    value: string
    archived_at: string | null
  }>(
    await db
      .from('picks')
      .select('user_id, category, value, archived_at')
      .in('user_id', userIds)
      .in('category', categories)
      .eq('is_current', false)
      .order('archived_at', { ascending: false })
  )

  // Ordered newest-first, so the first row seen for a pair is the one we want.
  const mostRecent = new Map<string, string>()
  for (const row of archived) {
    const key = `${row.user_id}:${row.category}`
    if (!mostRecent.has(key)) {
      mostRecent.set(key, row.value)
    }
  }

  return picks.map((pick) => ({
    ...pick,
    previous_value: mostRecent.get(`${pick.user_id}:${pick.category}`) ?? null,
  }))
}

/** One category's worth of what the editor currently has on screen. */
export interface PickDraft {
  category: string
  value: string
  interest_tag: string | null
}

export interface PickSavePlan {
  /** Current picks to retire, because their value changed or was cleared. */
  archiveIds: string[]
  /** Replacement rows, one per category whose value is new or changed. */
  inserts: {
    user_id: string
    category: string
    value: string
    interest_tag: string | null
    is_current: true
  }[]
  /**
   * Categories whose value is unchanged but whose interest tag moved. Grouped
   * by tag so one statement covers every id sharing a tag — `picks` has a
   * partial unique index on `(user_id, category) WHERE is_current`, so these
   * cannot ride along in an upsert.
   */
  retags: { interest_tag: string | null; ids: string[] }[]
}

/**
 * Work out the whole save up front, as a pure function of the drafts and the
 * picks already on file.
 *
 * The editor used to decide this inline while issuing statements, one category
 * at a time, which is how it ended up with up to twelve sequential round-trips
 * for a screen that can change six rows. Separating the decision from the
 * writing collapses it to at most three statements and makes the decision
 * testable without a database.
 */
export function planPickSave(
  userId: string,
  drafts: PickDraft[],
  current: readonly UserPick[]
): PickSavePlan {
  const currentByCategory = new Map(current.map((pick) => [pick.category, pick]))

  const plan: PickSavePlan = { archiveIds: [], inserts: [], retags: [] }
  const retagsByTag = new Map<string, string[]>()

  for (const draft of drafts) {
    const value = draft.value.trim()
    const existing = currentByCategory.get(draft.category)

    if (existing && existing.value === value) {
      // Same value: the row stays, and only a moved tag is worth a write.
      // Retagging in place is deliberate — it is not a change of favourite, so
      // it should not push the old one into the history the profile shows.
      if (existing.interest_tag !== draft.interest_tag) {
        const key = draft.interest_tag ?? ''
        const ids = retagsByTag.get(key)
        if (ids) ids.push(existing.id)
        else retagsByTag.set(key, [existing.id])
      }
      continue
    }

    if (existing) plan.archiveIds.push(existing.id)

    if (value) {
      plan.inserts.push({
        user_id: userId,
        category: draft.category,
        value,
        interest_tag: draft.interest_tag,
        is_current: true,
      })
    }
  }

  for (const [tag, ids] of Array.from(retagsByTag)) {
    plan.retags.push({ interest_tag: tag === '' ? null : tag, ids })
  }

  return plan
}

/**
 * Apply a pick save.
 *
 * Archiving has to come before inserting: the partial unique index forbids two
 * current picks in one category, so there is no ordering in which the new row
 * exists before the old one is retired. Without a transaction that leaves a
 * window in which a failed insert would have left the category archived and
 * empty — the picks would simply read as absent, which is what the previous
 * per-category loop did up to six times over.
 *
 * So the failed insert is compensated: every row this call archived goes back
 * to current, clearing the `archived_at` the `picks_archive_timestamp` trigger
 * stamped on the way out. The whole save is undone rather than half-applied.
 * That is still not atomicity — the compensating update can itself fail — but
 * it turns the common failure (one request lost) from silent data loss into a
 * no-op plus an error the editor shows.
 *
 * A `SECURITY DEFINER` RPC doing all of this in one transaction would remove
 * the window entirely, and is the right long-term fix; it needs a migration,
 * which is deliberately out of this change's scope.
 */
export async function savePicks(
  db: DbClient,
  userId: string,
  drafts: PickDraft[],
  current: readonly UserPick[]
): Promise<void> {
  const plan = planPickSave(userId, drafts, current)

  if (plan.archiveIds.length > 0) {
    const { error } = await db
      .from('picks')
      .update({ is_current: false })
      .in('id', plan.archiveIds)

    if (error) throw error
  }

  if (plan.inserts.length > 0) {
    const { error } = await db.from('picks').insert(plan.inserts)

    if (error) {
      if (plan.archiveIds.length > 0) {
        await db
          .from('picks')
          .update({ is_current: true, archived_at: null })
          .in('id', plan.archiveIds)
      }
      throw error
    }
  }

  // Last because a failure here loses nothing: the picks themselves are
  // already saved and only the interest link is missing.
  for (const { interest_tag, ids } of plan.retags) {
    const { error } = await db
      .from('picks')
      .update({ interest_tag })
      .in('id', ids)

    if (error) throw error
  }
}
