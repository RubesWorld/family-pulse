import type { Family, User } from '@/types/database'
import { unwrap } from './errors'
import type { DbClient } from './types'

/**
 * The caller's own `users` row plus their family — the root of the cache.
 *
 * Replaces the server-side `getCurrentProfile()` for anything that needs the
 * profile *as data*. The `(app)` layout still resolves it server-side for its
 * redirect check and seeds this query with the result, so a cold load costs no
 * extra round-trip.
 */

export const profileKeys = {
  all: ['profile'] as const,
  detail: (userId: string) => ['profile', userId] as const,
}

const PROFILE_SELECT = '*, families(name, invite_code)'

/**
 * The generated `Database` type does not carry embedded relations, so the
 * shape of `families` has to be stated by hand. It used to be stated three
 * times — `feed/page.tsx:67`, `family/page.tsx:35`, `profile/page.tsx:48` each
 * wrote `(profile?.families as { name: string } | null)?.name`. One assertion
 * here replaces all of them.
 */
export type ProfileWithFamily = User & {
  families: Pick<Family, 'name' | 'invite_code'> | null
}

/**
 * `maybeSingle`, not `single`: a signed-in user with no `users` row is a real
 * state during onboarding, and `single()` turns it into a thrown PGRST116
 * rather than a null.
 */
export async function fetchProfile(
  db: DbClient,
  userId: string
): Promise<ProfileWithFamily | null> {
  const result = await db
    .from('users')
    .select(PROFILE_SELECT)
    .eq('id', userId)
    .maybeSingle()

  return unwrap(result) as ProfileWithFamily | null
}

/**
 * The fields the "About me" editor owns.
 *
 * Stated as its own type so the update cannot quietly grow a column. `users`
 * carries `family_id`, and its policy set is what keeps a member inside one
 * family — an update that could reach that column is the defect migration 12
 * exists to close.
 */
export type ProfileBioFields = Pick<
  User,
  'location' | 'occupation' | 'birthday' | 'bio' | 'phone_number'
>

/** Update the caller's own profile fields. */
export async function updateProfileBio(
  db: DbClient,
  userId: string,
  fields: ProfileBioFields
): Promise<void> {
  const { error } = await db.from('users').update(fields).eq('id', userId)

  if (error) throw error
}
