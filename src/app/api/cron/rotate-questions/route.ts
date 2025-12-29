import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWeekNumber, getCurrentWeekStart, getNextQuestionAsker } from '@/lib/connect-utils'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const currentWeekNumber = getCurrentWeekNumber()
  const weekStartDate = getCurrentWeekStart()

  try {
    // Get all families
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('id')

    if (familiesError) throw familiesError

    const results = []

    for (const family of families || []) {
      // Check if question already exists for this family this week
      const { data: existingQuestion } = await supabase
        .from('weekly_questions')
        .select('id')
        .eq('family_id', family.id)
        .eq('week_number', currentWeekNumber)
        .single()

      if (existingQuestion) {
        results.push({ family_id: family.id, status: 'skipped', reason: 'question already exists' })
        continue
      }

      // Get family members
      const { data: members } = await supabase
        .from('users')
        .select('id, name')
        .eq('family_id', family.id)

      if (!members || members.length === 0) {
        results.push({ family_id: family.id, status: 'skipped', reason: 'no family members' })
        continue
      }

      // Get the last week's question to determine next asker
      const { data: lastQuestion } = await supabase
        .from('weekly_questions')
        .select('assigned_user_id')
        .eq('family_id', family.id)
        .order('week_number', { ascending: false })
        .limit(1)
        .single()

      // Determine next asker using round-robin
      const nextAsker = getNextQuestionAsker(members, lastQuestion?.assigned_user_id)

      if (!nextAsker) {
        results.push({ family_id: family.id, status: 'failed', reason: 'could not determine next asker' })
        continue
      }

      // Get a random preset question
      const { data: presetQuestions } = await supabase
        .from('preset_questions')
        .select('question_text')

      if (!presetQuestions || presetQuestions.length === 0) {
        results.push({ family_id: family.id, status: 'failed', reason: 'no preset questions available' })
        continue
      }

      const randomQuestion = presetQuestions[Math.floor(Math.random() * presetQuestions.length)]

      // Create new pending question for this week
      const { error: insertError } = await supabase
        .from('weekly_questions')
        .insert({
          family_id: family.id,
          question_text: '', // Will be set when assigned person chooses
          suggested_question_text: randomQuestion.question_text,
          week_start_date: weekStartDate.toISOString().split('T')[0],
          week_number: currentWeekNumber,
          assigned_user_id: nextAsker.id,
          is_preset: true, // Will be updated to false if they write custom
          is_current: true,
          status: 'pending',
        })

      if (insertError) {
        results.push({ family_id: family.id, status: 'failed', error: insertError.message })
      } else {
        results.push({
          family_id: family.id,
          status: 'success',
          suggested_question: randomQuestion.question_text,
          asker: nextAsker.name,
        })
      }
    }

    return NextResponse.json({
      success: true,
      week_number: currentWeekNumber,
      week_start: weekStartDate.toISOString(),
      results,
    })
  } catch (error) {
    console.error('Error rotating questions:', error)
    return NextResponse.json(
      { error: 'Failed to rotate questions', details: error },
      { status: 500 }
    )
  }
}
