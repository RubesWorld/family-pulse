import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * The Supabase client every query function in this directory takes as its
 * first argument.
 *
 * Passed in rather than imported so nothing here reaches for a *particular*
 * client. On the web that argument is the browser client from
 * `@/lib/supabase/client`; on React Native it will be an `AsyncStorage`-backed
 * one built the same way. Neither is named in this directory.
 *
 * It is never the service-role client from `@/lib/supabase/admin` — that
 * bypasses RLS entirely, and `.eslintrc.json` refuses the import here.
 */
export type DbClient = SupabaseClient<Database>
