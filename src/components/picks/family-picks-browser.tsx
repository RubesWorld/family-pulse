'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { GlowAvatar } from '@/components/ui/glow-avatar'
import { useI18n } from '@/components/i18n-provider'
import { t } from '@/lib/i18n'
import {
  PICK_PROMPTS,
  interestEmoji,
  isSkipped,
  promptLabel,
  resolvePromptId,
} from '@/lib/pick-prompts'
import type { User } from '@/types/database'

interface FamilyPick {
  user_id: string
  category: string
  value: string
}

interface FamilyPicksBrowserProps {
  members: Pick<User, 'id' | 'name' | 'avatar_url'>[]
  picks: FamilyPick[]
  currentUserId: string
}

interface Answer {
  member: Pick<User, 'id' | 'name' | 'avatar_url'>
  value: string | null
  skipped: boolean
}

/**
 * Browse by question rather than by person.
 *
 * Reading five separate profiles tells you five separate things; seeing one
 * question answered by everyone at once is where the interesting part is —
 * that two people named the same trail, or that someone's answer is from 1998.
 */
export function FamilyPicksBrowser({
  members,
  picks,
  currentUserId,
}: FamilyPicksBrowserProps) {
  const { dict, locale } = useI18n()
  const [index, setIndex] = useState(0)

  const questions = useMemo(() => {
    // stored category -> prompt id, so legacy rows land in the right bucket
    const byPrompt = new Map<string, Map<string, string>>()

    for (const pick of picks) {
      if (!pick.value?.trim()) continue
      const promptId = resolvePromptId(pick.category)
      if (!byPrompt.has(promptId)) byPrompt.set(promptId, new Map())
      byPrompt.get(promptId)!.set(pick.user_id, pick.value)
    }

    const built = PICK_PROMPTS.flatMap((prompt) => {
      const answers = byPrompt.get(prompt.id)
      if (!answers) return []

      // Array.from rather than spread: the project targets es5, where
      // spreading a Map iterator needs downlevelIteration.
      const real = Array.from(answers.values()).filter((v) => !isSkipped(v))
      // A question nobody actually answered — only skipped — isn't worth a card.
      if (real.length === 0) return []

      return [
        {
          prompt,
          answeredCount: real.length,
          rows: members.map<Answer>((member) => {
            const value = answers.get(member.id) ?? null
            return {
              member,
              value: value && !isSkipped(value) ? value : null,
              skipped: isSkipped(value ?? ''),
            }
          }),
        },
      ]
    })

    // Most-answered first: those make the best comparisons.
    return built.sort((a, b) => b.answeredCount - a.answeredCount)
  }, [picks, members])

  if (questions.length === 0) {
    return (
      <div className="px-8 py-16 text-center">
        <div className="text-4xl">🌱</div>
        <p className="mt-4 font-display text-xl font-bold text-ink">
          {dict.picks.browseEmpty}
        </p>
        <p className="mx-auto mt-1.5 max-w-xs text-[13.5px] font-medium leading-relaxed text-ink-soft">
          {dict.picks.browseEmptyHint}
        </p>
      </div>
    )
  }

  const safeIndex = Math.min(index, questions.length - 1)
  const current = questions[safeIndex]
  const go = (delta: number) =>
    setIndex((i) => (i + delta + questions.length) % questions.length)

  return (
    <div className="px-5">
      <div
        className="rounded-card border-card p-5 backdrop-blur-card"
        style={{
          background:
            'linear-gradient(150deg, hsl(var(--plum) / 0.2), hsl(var(--denim) / 0.1))',
          borderColor: 'hsl(var(--plum) / 0.32)',
          boxShadow:
            '0 14px 40px -16px hsl(var(--plum) / calc(0.8 * var(--glow))), inset 0 1px 0 rgb(255 235 210 / 0.14)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="text-xl" aria-hidden>
              {interestEmoji(current.prompt.interest)}
            </span>
            <h2 className="font-display text-[21px] font-bold leading-tight tracking-tight text-ink">
              {promptLabel(current.prompt, locale)}
            </h2>
          </div>
          <span className="flex-none whitespace-nowrap text-[11px] font-extrabold text-ink-faint">
            {t(dict.picks.answeredOf, {
              answered: current.answeredCount,
              total: members.length,
            })}
          </span>
        </div>

        <div className="mt-4 space-y-3.5">
          {current.rows.map(({ member, value, skipped }) => (
            <div key={member.id} className="flex items-start gap-2.5">
              <GlowAvatar
                name={member.name}
                userId={member.id}
                avatarUrl={member.avatar_url}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-extrabold text-ink-soft">
                  {member.id === currentUserId ? dict.picks.mine : member.name}
                </div>
                {value ? (
                  <p className="mt-0.5 font-display text-[16px] leading-snug text-ink">
                    {value}
                  </p>
                ) : (
                  <p className="mt-0.5 text-[13px] font-medium italic text-ink-faint">
                    {skipped ? dict.picks.skipped : dict.picks.notAnsweredYet}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label={dict.picks.previousQuestion}
          className="grid h-11 w-11 flex-none place-items-center rounded-full border-card border-edge bg-card text-ink-soft backdrop-blur-card transition-transform active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <span className="text-[11.5px] font-extrabold tabular-nums text-ink-faint">
          {safeIndex + 1} / {questions.length}
        </span>

        <button
          type="button"
          onClick={() => go(1)}
          aria-label={dict.picks.nextQuestion}
          className="grid h-11 w-11 flex-none place-items-center rounded-full border-card border-edge bg-card text-ink-soft backdrop-blur-card transition-transform active:scale-95"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
