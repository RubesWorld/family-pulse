'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { GlowAvatar } from '@/components/ui/glow-avatar'
import { useI18n } from '@/components/i18n-provider'
import { t } from '@/lib/i18n'
import { isSkipped } from '@/lib/pick-prompts'
import { cn } from '@/lib/utils'
import type { User } from '@/types/database'

export interface LibraryEntry {
  id: string
  /** Already localised by the caller — weekly questions are user-written. */
  label: string
  emoji: string
  kind: 'weekly' | 'interest'
  /** userId -> answer text. SKIPPED means "not for me". */
  answers: Record<string, string>
}

interface QuestionLibraryProps {
  members: Pick<User, 'id' | 'name' | 'avatar_url'>[]
  entries: LibraryEntry[]
  currentUserId: string
}

type Filter = 'all' | 'weekly' | 'interest'

/**
 * The library: every question the family has answered, browsed one at a time
 * with everyone's answers side by side.
 *
 * Weekly questions and interest prompts sit in the same list because they are
 * the same thing — a question, and everyone's answers. Splitting them into
 * tabs implied a distinction that was never real.
 */
export function QuestionLibrary({
  members,
  entries,
  currentUserId,
}: QuestionLibraryProps) {
  const { dict } = useI18n()
  const [filter, setFilter] = useState<Filter>('all')
  const [index, setIndex] = useState(0)

  const visible = useMemo(() => {
    const filtered =
      filter === 'all' ? entries : entries.filter((e) => e.kind === filter)

    return filtered
      .map((entry) => {
        const answered = Object.values(entry.answers).filter(
          (v) => v?.trim() && !isSkipped(v)
        ).length
        return { entry, answered }
      })
      .filter((x) => x.answered > 0)
      .sort((a, b) => b.answered - a.answered)
  }, [entries, filter])

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: dict.connect.filterAll },
    { id: 'weekly', label: dict.connect.filterWeekly },
    { id: 'interest', label: dict.connect.filterInterests },
  ]

  const safeIndex = Math.min(index, Math.max(visible.length - 1, 0))
  const current = visible[safeIndex]

  const go = (delta: number) =>
    setIndex((i) => (i + delta + visible.length) % visible.length)

  return (
    <div className="px-5">
      <div className="mb-3.5 flex gap-1.5">
        {filters.map(({ id, label }) => {
          const active = filter === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setFilter(id)
                setIndex(0)
              }}
              aria-pressed={active}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-[12.5px] font-extrabold transition-all',
                active
                  ? 'border-[1.5px] border-solid border-marigold bg-marigold/[0.18] text-marigold'
                  : 'border-[1.5px] border-dashed border-edge text-ink-soft'
              )}
            >
              {label}
            </button>
          )
        })}
      </div>

      {!current ? (
        <div className="px-3 py-16 text-center">
          <div className="text-4xl">🌱</div>
          <p className="mt-4 font-display text-xl font-bold text-ink">
            {dict.picks.browseEmpty}
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[13.5px] font-medium leading-relaxed text-ink-soft">
            {dict.picks.browseEmptyHint}
          </p>
        </div>
      ) : (
        <>
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
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-marigold">
                {current.entry.kind === 'weekly'
                  ? dict.connect.weeklyBadge
                  : dict.connect.interestBadge}
              </span>
              <span className="flex-none text-[11px] font-extrabold text-ink-faint">
                {t(dict.picks.answeredOf, {
                  answered: current.answered,
                  total: members.length,
                })}
              </span>
            </div>

            <div className="mt-2 flex items-start gap-2.5">
              <span className="text-xl" aria-hidden>
                {current.entry.emoji}
              </span>
              <h2 className="font-display text-[21px] font-bold leading-tight tracking-tight text-ink">
                {current.entry.label}
              </h2>
            </div>

            <div className="mt-4 space-y-3.5">
              {members.map((member) => {
                const raw = current.entry.answers[member.id]
                const skipped = isSkipped(raw ?? '')
                const value = raw && !skipped ? raw : null

                return (
                  <div key={member.id} className="flex items-start gap-2.5">
                    <GlowAvatar
                      name={member.name}
                      userId={member.id}
                      avatarUrl={member.avatar_url}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-extrabold text-ink-soft">
                        {member.id === currentUserId
                          ? dict.picks.mine
                          : member.name}
                      </div>
                      {value ? (
                        <p className="mt-0.5 font-display text-[16px] leading-snug text-ink">
                          {value}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[13px] font-medium italic text-ink-faint">
                          {skipped
                            ? dict.picks.skipped
                            : dict.picks.notAnsweredYet}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
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
              {safeIndex + 1} / {visible.length}
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
        </>
      )}
    </div>
  )
}
