import { cache } from 'react'
import { createClient } from './server'

/**
 * Per-request cached accessors for the things almost every page needs.
 *
 * React's `cache()` memoizes for the duration of a single server render pass,
 * so a layout and the page nested inside it share one result instead of each
 * paying for its own. Before this, loading /feed made three separate
 * `getUser()` calls — one in middleware, one in the (app) layout, one in the
 * page — and `getUser()` is a network round-trip to the Supabase Auth server,
 * not a local cookie read. The layout and page halves of that now collapse
 * into one. (Middleware runs as a separate invocation and cannot share the
 * cache; it needs its own call anyway to refresh the session cookie.)
 *
 * Server components only — `cache()` has no meaning on the client.
 */

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

/**
 * The caller's own row plus their family, which the (app) layout needs for its
 * redirect check and most pages then need again for display.
 */
export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('*, families(name, invite_code)')
    .eq('id', user.id)
    .single()

  return data
})

/**
 * IDs of everyone in the caller's family. Used to scope picks and activities.
 */
export const getFamilyMemberIds = cache(async (familyId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('family_id', familyId)

  return (data ?? []).map((m) => m.id)
})
