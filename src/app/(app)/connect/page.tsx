import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ConnectContent } from './connect-content'
import { getCurrentWeekNumber } from '@/lib/connect-utils'

export default async function ConnectPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's family
  const { data: userData } = await supabase
    .from('users')
    .select('family_id')
    .eq('id', user.id)
    .single()

  if (!userData?.family_id) {
    redirect('/onboarding')
  }

  // Get family members
  const { data: members } = await supabase
    .from('users')
    .select('id, name, avatar_url')
    .eq('family_id', userData.family_id)
    .order('name')

  // Get current week's question with answers
  const currentWeekNumber = getCurrentWeekNumber()
  const { data: currentQuestion } = await supabase
    .from('weekly_questions')
    .select(`
      *,
      users!weekly_questions_assigned_user_id_fkey(id, name, avatar_url),
      question_answers(
        *,
        users(id, name, avatar_url)
      )
    `)
    .eq('family_id', userData.family_id)
    .eq('week_number', currentWeekNumber)
    .eq('is_current', true)
    .single()

  // Get past questions (last 10 weeks, excluding current)
  const { data: pastQuestions } = await supabase
    .from('weekly_questions')
    .select(`
      id,
      question_text,
      week_start_date,
      week_number,
      users!weekly_questions_assigned_user_id_fkey(id, name, avatar_url)
    `)
    .eq('family_id', userData.family_id)
    .neq('week_number', currentWeekNumber)
    .order('week_number', { ascending: false })
    .limit(10)

  // Get user's current picks
  const { data: currentPicks } = await supabase
    .from('picks')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_current', true)

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
