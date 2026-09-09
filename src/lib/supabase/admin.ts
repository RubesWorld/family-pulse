import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

/**
 * Supabase client using the service role key.
 *
 * Use this only for server-side work that runs without a logged-in user —
 * cron jobs, webhooks, background sends. It bypasses RLS entirely, so every
 * caller is responsible for scoping its own queries.
 *
 * Never import this from a client component.
 *
 * Env vars are read inside the function rather than at module scope: reading
 * them at import time makes the Vercel build fail, since the build has no
 * runtime secrets. See Learnings.md section 5.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'createAdminClient requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
