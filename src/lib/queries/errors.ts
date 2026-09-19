import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Error handling shared by every query function here.
 *
 * supabase-js resolves rather than rejects: a failed request comes back as
 * `{ data: null, error }`. React Query only knows a query failed if the promise
 * rejects, so every query function has to convert one into the other. Without
 * that, a query that failed looks exactly like a query that legitimately found
 * nothing — which is how a permission error ends up rendering as an empty
 * family.
 */

/**
 * PostgREST's codes for a token it would not accept. `PGRST301` is the one
 * that actually shows up (JWT expired or otherwise rejected); `PGRST302` is
 * the anonymous-access counterpart.
 */
const AUTH_ERROR_CODES = new Set(['PGRST301', 'PGRST302'])

const AUTH_ERROR_MESSAGE =
  /jwt (expired|is invalid)|invalid jwt|token is expired|refresh token not found/i

/**
 * Whether an error means "this session is no longer usable" as opposed to
 * "this request failed".
 *
 * The distinction matters twice: a dead session must not be retried (every
 * retry fails identically), and it is the one failure that should sign the user
 * out rather than surface in the UI. Server-side this never arose — middleware
 * caught an expired token before a page rendered. Client-side the page is
 * already on screen, so the only symptom would be silently empty sections.
 */
export function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const { code, message, status } = error as {
    code?: unknown
    message?: unknown
    status?: unknown
  }

  if (typeof code === 'string' && AUTH_ERROR_CODES.has(code)) return true
  if (status === 401) return true
  if (typeof message === 'string' && AUTH_ERROR_MESSAGE.test(message)) return true

  return false
}

/** Throw on error, otherwise hand back the single row (or null). */
export function unwrap<T>(result: {
  data: T
  error: PostgrestError | null
}): T {
  if (result.error) throw result.error
  return result.data
}

/**
 * Throw on error, otherwise hand back the rows.
 *
 * `null` and `[]` both mean "no rows" from PostgREST, and every caller wants an
 * array, so they are collapsed here rather than with a `?? []` at each call
 * site — which is where the server components used to quietly swallow errors.
 */
export function unwrapRows<T>(result: {
  data: T[] | null
  error: PostgrestError | null
}): T[] {
  if (result.error) throw result.error
  return result.data ?? []
}
