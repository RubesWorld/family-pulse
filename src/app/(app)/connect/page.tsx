import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, getCurrentUser } from '@/lib/supabase/queries'
import { ConnectContent } from './connect-content'
import { getCurrentWeekNumber } from '@/lib/connect-utils'

export default async function ConnectPage() {
  const supabase = await createClient()

  // Both already resolved by the (app) layout.
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getCurrentProfile()

  if (!profile?.family_id) {
    redirect('/onboarding')
  }

  const familyId = profile.family_id
  const currentWeekNumber = getCurrentWeekNumber()

  // Four independent reads. Previously each waited on the one before it, so the
  // page cost the sum of four round-trips rather than the slowest of them.
  const [
    { data: members },
    { data: currentQuestion },
    { data: pastQuestions },
    { data: currentPicks },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id, name, avatar_url')
      .eq('family_id', familyId)
      .order('name'),

    supabase
      .from('weekly_questions')
      .select(
        `
      *,
      users!weekly_questions_assigned_user_id_fkey(id, name, avatar_url),
      question_answers(
        *,
        users(id, name, avatar_url)
      )
    `
      )
      .eq('family_id', familyId)
      .eq('week_number', currentWeekNumber)
      .eq('is_current', true)
      .single(),

    supabase
      .from('weekly_questions')
      .select(
        `
      id,
      question_text,
      week_start_date,
      week_number,
      users!weekly_questions_assigned_user_id_fkey(id, name, avatar_url)
    `
      )
      .eq('family_id', familyId)
      .neq('week_number', currentWeekNumber)
      .order('week_number', { ascending: false })
      .limit(10),

    supabase
      .from('picks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_current', true),
  ])

  return (
    <ConnectContent
      currentUserId={user.id}
      familyMembers={members || []}
      currentQuestion={currentQuestion}
      pastQuestions={pastQuestions || []}
      currentPicks={currentPicks || []}
    />
  )
}
