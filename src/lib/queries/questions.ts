import type {
  AnswerWithUser,
  QuestionWithAnswers,
  User,
  WeeklyQuestion,
} from '@/types/database'
import { unwrap, unwrapRows } from './errors'
import type { DbClient } from './types'

/**
 * Every key starts with `'questions'`, so a write anywhere in Connect can
 * invalidate the whole area with `invalidateQueries({ queryKey: questionKeys.all })`
 * without knowing which screens are mounted. That one line replaces the three
 * `window.location.reload()` calls this area used to rely on.
 */
export const questionKeys = {
  all: ['questions'] as const,
  current: (familyId: string, weekNumber: number) =>
    ['questions', 'family', familyId, 'current', weekNumber] as const,
  answered: (familyId: string) =>
    ['questions', 'family', familyId, 'answered'] as const,
  answers: (questionId: string) =>
    ['questions', 'answers', questionId] as const,
}

export const ANSWERED_QUESTION_LIMIT = 20

const CURRENT_QUESTION_SELECT = `
  *,
  users!weekly_questions_assigned_user_id_fkey(id, name, avatar_url),
  question_answers(
    *,
    users(id, name, avatar_url)
  )
`

const PAST_QUESTION_SELECT = `
  id,
  question_text,
  week_start_date,
  week_number,
  status,
  users!weekly_questions_assigned_user_id_fkey(id, name, avatar_url)
`

export type PastQuestion = Pick<
  WeeklyQuestion,
  'id' | 'question_text' | 'week_start_date' | 'week_number' | 'status'
> & {
  users: Pick<User, 'id' | 'name' | 'avatar_url'>
}

/**
 * This week's question for the family, with its answers.
 *
 * `maybeSingle`, not the `single` that `connect/page.tsx:55` uses. `single()`
 * raises PGRST116 when there are no rows; server-side the destructured `data`
 * was simply `undefined` and the "No question yet" branch rendered, so the
 * behaviour was masked. In a `queryFn` that same error is a rejected query and
 * the screen shows an error state instead of the intended empty one.
 */
export async function fetchCurrentQuestion(
  db: DbClient,
  familyId: string,
  weekNumber: number
): Promise<QuestionWithAnswers | null> {
  const result = await db
    .from('weekly_questions')
    .select(CURRENT_QUESTION_SELECT)
    .eq('family_id', familyId)
    .eq('week_number', weekNumber)
    .eq('is_current', true)
    .maybeSingle()

  return unwrap(result) as QuestionWithAnswers | null
}

/**
 * The family's questions that reached `active` — the history screen's list.
 *
 * This is the deduped form of two near-identical server reads: the history
 * screen's own query (`connect/history/page.tsx:23`, `status = 'active'`,
 * limit 20) and the Connect screen's "past questions" query
 * (`connect/page.tsx:57`, `week_number != current`, limit 10). The second one
 * fetched ten full rows with an embedded asker purely to decide whether to
 * render a "View past questions" button, and its results were never displayed.
 *
 * One query under one key means the history screen paints from cache when you
 * arrive from Connect, which is the navigation this dedupe is actually for.
 * Connect keeps its "is there anything other than this week?" meaning by
 * filtering the cached rows rather than by asking the database a second
 * question.
 */
export async function fetchAnsweredQuestions(
  db: DbClient,
  familyId: string,
  limit: number = ANSWERED_QUESTION_LIMIT
): Promise<PastQuestion[]> {
  const result = await db
    .from('weekly_questions')
    .select(PAST_QUESTION_SELECT)
    .eq('family_id', familyId)
    .eq('status', 'active')
    .order('week_number', { ascending: false })
    .limit(limit)

  return unwrapRows<PastQuestion>(result)
}

/**
 * Archived answers to one question, for the expandable history rows.
 *
 * Ported as-is from `question-history.tsx:46`, `is_current = false` filter
 * included. Note that filter is almost certainly wrong — it shows only answers
 * that were later edited away, and never the current one, so a member who
 * answered once and never edited does not appear at all. Left alone here
 * because changing it changes what users see and needs a product call
 * (§8.11 of the migration plan).
 */
export async function fetchArchivedAnswers(
  db: DbClient,
  questionId: string
): Promise<AnswerWithUser[]> {
  const result = await db
    .from('question_answers')
    .select('*, users(id, name, avatar_url)')
    .eq('question_id', questionId)
    .eq('is_current', false)
    .order('created_at', { ascending: false })

  return unwrapRows<AnswerWithUser>(result)
}

/**
 * Record the caller's answer to a question, superseding their previous one.
 *
 * Two statements, in the order `answer-form.tsx:45-58` already used: archive
 * the old row, then insert the new one. They are not a transaction, so a
 * failure between them leaves the member with no current answer — their old
 * one archived and no replacement. That is pre-existing and is left as-is here
 * rather than reordered, because inserting first would instead leave two
 * `is_current` rows, which the answer count and the family answers list would
 * both double-count. A single RPC would fix it properly.
 *
 * The archive is scoped by `id`, and `question_answers` UPDATE is policy-scoped
 * to `user_id = auth.uid()`, so this cannot touch anyone else's answer.
 */
export async function submitAnswer(
  db: DbClient,
  params: {
    questionId: string
    userId: string
    answerText: string
    previousAnswerId?: string
  }
): Promise<void> {
  if (params.previousAnswerId) {
    const archived = await db
      .from('question_answers')
      .update({ is_current: false })
      .eq('id', params.previousAnswerId)

    // The original swallowed this one — it awaited the update without looking
    // at `error`, so a failed archive was followed by the insert anyway and the
    // member ended up with two current answers.
    if (archived.error) throw archived.error
  }

  const inserted = await db.from('question_answers').insert({
    question_id: params.questionId,
    user_id: params.userId,
    answer_text: params.answerText,
    is_current: true,
  })

  if (inserted.error) throw inserted.error
}

/**
 * Set a pending week's question text and open it for answers.
 *
 * Ported from `question-selector.tsx:34-41`. Note the UPDATE policy on
 * `weekly_questions` is family-wide rather than asker-scoped (§6.2(d) of the
 * migration plan), so the "only the assigned member may do this" rule lives
 * only in the UI that renders this component.
 */
export async function activateQuestion(
  db: DbClient,
  params: { questionId: string; questionText: string; isPreset: boolean }
): Promise<void> {
  const result = await db
    .from('weekly_questions')
    .update({
      question_text: params.questionText,
      status: 'active',
      is_preset: params.isPreset,
    })
    .eq('id', params.questionId)

  if (result.error) throw result.error
}
