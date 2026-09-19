'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { GlowAvatar } from '@/components/ui/glow-avatar'
import { useI18n } from '@/components/i18n-provider'
import { t } from '@/lib/i18n'
import type { User } from '@/types/database'

interface WeeklyQuestionCardProps {
  questionId: string
  questionText: string
  askedBy: Pick<User, 'id' | 'name' | 'avatar_url'> | null
  userId: string
  answeredCount: number
  totalMembers: number
}

/**
 * The weekly question, answerable inline in the feed.
 *
 * It used to live only in Connect, which meant the ritual was invisible
 * unless you went looking for it. It is an event — someone asked, and the
 * week is running — so the feed is where it belongs.
 */
export function WeeklyQuestionCard({
  questionId,
  questionText,
  askedBy,
  userId,
  answeredCount,
  totalMembers,
}: WeeklyQuestionCardProps) {
  const { dict } = useI18n()
  const router = useRouter()
  const [answer, setAnswer] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  if (done) return null

  const submit = async () => {
    const text = answer.trim()
    if (!text) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('question_answers').insert({
        question_id: questionId,
        user_id: userId,
        answer_text: text,
        is_current: true,
      })
      if (error) throw error

      setDone(true)
      router.refresh()
    } catch (err) {
      console.error('Failed to answer weekly question:', err)
      setSaving(false)
    }
  }

  return (
    <div
      className="mx-5 mb-4 rounded-card border-card p-5 backdrop-blur-card"
      style={{
        background:
          'linear-gradient(150deg, hsl(var(--plum) / 0.22), hsl(var(--denim) / 0.12))',
        borderColor: 'hsl(var(--plum) / 0.34)',
        boxShadow:
          '0 14px 40px -16px hsl(var(--plum) / calc(0.8 * var(--glow))), inset 0 1px 0 rgb(255 235 210 / 0.14)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-marigold">
          {dict.feed.weeklyQuestion}
        </span>
        <span className="text-[11px] font-extrabold text-ink-faint">
          {t(dict.picks.answeredOf, {
            answered: answeredCount,
            total: totalMembers,
          })}
        </span>
      </div>

      <h2 className="mt-2 font-display text-[22px] font-bold leading-tight tracking-tight text-ink">
        {questionText}
      </h2>

      {askedBy && (
        <div className="mt-2.5 flex items-center gap-2">
          <GlowAvatar
            name={askedBy.name}
            userId={askedBy.id}
            avatarUrl={askedBy.avatar_url}
            size="xs"
          />
          <span className="text-[11.5px] font-bold text-ink-soft">
            {t(dict.feed.askedThisWeek, { name: askedBy.name })}
          </span>
        </div>
      )}

      <div className="mt-3.5">
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={dict.picks.answerPlaceholder}
          rows={3}
          disabled={saving}
          className="resize-none"
          aria-label={questionText}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          onClick={submit}
          disabled={saving || !answer.trim()}
          className="flex-1"
        >
          {saving ? dict.common.saving : dict.common.save}
        </Button>
        <Link
          href="/connect"
          className="whitespace-nowrap rounded-full px-3.5 py-2.5 text-[12px] font-extrabold text-ink-faint transition-colors hover:bg-paper-2 hover:text-ink"
        >
          {dict.feed.seeAllAnswers}
        </Link>
      </div>
    </div>
  )
}

/** Shown to whoever is on the hook for choosing this week's question. */
export function YourTurnToAskCard() {
  const { dict } = useI18n()

  return (
    <div
      className="mx-5 mb-4 rounded-card border-card p-5 backdrop-blur-card"
      style={{
        background:
          'linear-gradient(150deg, hsl(var(--coral) / 0.2), hsl(var(--marigold) / 0.12))',
        borderColor: 'hsl(var(--coral) / 0.34)',
        boxShadow:
          '0 14px 40px -16px hsl(var(--coral) / calc(0.8 * var(--glow))), inset 0 1px 0 rgb(255 235 210 / 0.14)',
      }}
    >
      <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-marigold">
        {dict.feed.yourTurnToAsk}
      </div>
      <p className="mt-2 font-display text-[20px] font-bold leading-tight text-ink">
        {dict.feed.yourTurnToAskHint}
      </p>
      <Button asChild className="mt-3.5 w-full">
        <Link href="/connect">{dict.feed.chooseQuestion}</Link>
      </Button>
    </div>
  )
}
