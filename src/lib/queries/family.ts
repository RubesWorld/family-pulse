import type { User } from '@/types/database'
import { unwrapRows } from './errors'
import type { DbClient } from './types'

export const familyKeys = {
  all: ['family'] as const,
  members: (familyId: string) => ['family', 'members', familyId] as const,
}

/**
 * An explicit column list, replacing the `select('*')` that
 * `family/page.tsx:26` used to run.
 *
 * On the server the extra columns never left the process — only the fields
 * `family-content` referenced crossed the serialization boundary. Client-side
 * every column lands in the network tab and in the cache, so the list is
 * exactly what the Family tab renders and nothing else. `interests`,
 * `family_id` and `created_at` are dropped because nothing displays them.
 *
 * `phone_number`, `birthday`, `bio`, `location` and `occupation` stay: the
 * member detail view shows all five. That is inside the family trust boundary
 * — the point is that it is now a decision rather than a leftover `*`.
 */
export const FAMILY_MEMBER_COLUMNS =
  'id, name, avatar_url, location, occupation, birthday, bio, phone_number'

export type FamilyMember = Pick<
  User,
  | 'id'
  | 'name'
  | 'avatar_url'
  | 'location'
  | 'occupation'
  | 'birthday'
  | 'bio'
  | 'phone_number'
>

/**
 * Everyone in the given family, by name.
 *
 * The `family_id` filter is not the security boundary — the
 * "Users can view family members" policy is, and it restricts this table to
 * `family_id = public.current_family_id()` regardless of what is asked for.
 * The filter is here because the query has to name the family it is about, and
 * because the key is scoped by it.
 */
export async function fetchFamilyMembers(
  db: DbClient,
  familyId: string
): Promise<FamilyMember[]> {
  const result = await db
    .from('users')
    .select(FAMILY_MEMBER_COLUMNS)
    .eq('family_id', familyId)
    .order('name')

  return unwrapRows<FamilyMember>(result)
}
