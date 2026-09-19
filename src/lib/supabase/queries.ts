import { cache } from 'react'
import { createClient } from './server'

/**
 * Per-request cached accessors for the things almost every page needs.
 *
 * React's `cache()` memoizes for the duration of a single server render pass,
 * so a layout and the page nested inside it share one result instead of each
 * paying for its own.
 *
 * Server components only — `cache()` has no meaning on the client.
 */

/**
 * The signed-in user's id and email, or null when there is no valid session.
 *
 * Uses getClaims() rather than getUser(). getUser() is an HTTP request to the
 * Supabase Auth server on every render; getClaims() verifies the access token's
 * signature locally via WebCrypto against the project's cached public JWKS.
 * This project signs with ES256 (EC P-256), confirmed at
 * /auth/v1/.well-known/jwks.json, so the local path is the one that runs. On a
 * project still using the legacy shared HS256 secret getClaims() cannot verify
 * locally and falls back to calling getUser() internally, which is correct but
 * no faster.
 *
 * Safe on the server, unlike a bare getSession(): the signature is verified
 * rather than trusted.
 *
 * The tradeoff is staleness. These values come from the token, so they reflect
 * whatever was true when it was last issued — up to one refresh interval behind.
 * That only affects `email` here; every profile field the app displays (name,
 * bio, location, occupation, birthday, phone) is read from the `users` table by
 * getCurrentProfile() below, not from the token.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims?.sub) return null

  return {
    id: data.claims.sub,
    email: data.claims.email,
  }
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

// `getFamilyMemberIds` lived here. It resolved the caller's family members so
// the server components could pass `.in('user_id', memberIds)` into every picks,
// activities and interest-cards query.
//
// It is gone because that filter was never the boundary. The RLS policies scope
// those three tables to `current_family_member_ids()` on their own, and once the
// queries moved into the browser the id list became a parameter the caller
// chooses — which cannot be a security control. Keeping it would have left
// something that looks like a boundary sitting where the real one is.
//
// supabase/verify_isolation.sql is what actually asserts the scoping now: 49
// checks run as the `authenticated` role with a real JWT, including unfiltered
// `select * from picks / activities / interest_cards` that must return only the
// caller's family.
