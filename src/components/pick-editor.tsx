'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/i18n-provider'
import { t } from '@/lib/i18n'
import {
  SKIPPED,
  groupPromptsByInterest,
  promptLabel,
  promptsForUser,
  resolvePromptId,
} from '@/lib/pick-prompts'
import { cn } from '@/lib/utils'

interface PickEditorProps {
  userId: string
  existingPicks: Array<{
    category: string
    value: string
    interest_tag: string | null
  }>
  userInterests: Array<{
    category: string
    is_custom: boolean
  }>
  onSave: () => void
}

export function PickEditor({
  userId,
  existingPicks,
  userInterests,
  onSave,
}: PickEditorProps) {
  const { dict, locale } = useI18n()
  const router = useRouter()

  // Only prompts from interests this person claimed — plus anything they have
  // already answered, so removing an interest never silently hides a pick.
  const groups = useMemo(() => {
    const prompts = promptsForUser(
      userInterests.map((i) => i.category),
      existingPicks.map((p) => p.category)
    )
    return groupPromptsByInterest(prompts)
  }, [userInterests, existingPicks])

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    existingPicks.forEach((p) => {
      initial[resolvePromptId(p.category)] = p.value
    })
    return initial
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setAnswer = (promptId: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [promptId]: value }))

  const toggleSkip = (promptId: string) =>
    setAnswers((prev) => ({
      ...prev,
      [promptId]: prev[promptId] === SKIPPED ? '' : SKIPPED,
    }))

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const supabase = (await import('@/lib/supabase/client')).createClient()

      // Anything with content, including an explicit skip.
      const entries = Object.entries(answers).filter(
        ([, value]) => value.trim().length > 0
      )

      const { data: current } = await supabase
        .from('picks')
        .select('id, category, value')
        .eq('user_id', userId)
        .eq('is_current', true)

      const currentByPrompt = new Map(
        (current ?? []).map((p) => [resolvePromptId(p.category), p])
      )

      const changed = entries.filter(([promptId, value]) => {
        const existing = currentByPrompt.get(promptId)
        return !existing || existing.value !== value
      })

      if (changed.length > 0) {
        // Archive the rows being replaced, so pick history still works.
        const toArchive = changed
          .map(([promptId]) => currentByPrompt.get(promptId)?.id)
          .filter((id): id is string => Boolean(id))

        if (toArchive.length > 0) {
          const { error: archiveError } = await supabase
            .from('picks')
            .update({ is_current: false, archived_at: new Date().toISOString() })
            .in('id', toArchive)
          if (archiveError) throw archiveError
        }

        // Always written with the new prompt id, so legacy ids drain away as
        // people edit rather than needing a data migration.
        const { error: insertError } = await supabase.from('picks').insert(
          changed.map(([promptId, value]) => ({
            user_id: userId,
            category: promptId,
            value,
            interest_tag: promptId.split('.')[0],
            is_current: true,
          }))
        )
        if (insertError) throw insertError
      }

      onSave()
      router.refresh()
    } catch (err) {
      console.error('Failed to save picks:', err)
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (groups.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-[13.5px] font-medium leading-relaxed text-ink-soft">
          {dict.picks.noInterests}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-[13px] font-medium leading-relaxed text-ink-soft">
        {dict.picks.editorIntro}
      </p>

      {groups.map(({ interest, prompts }) => (
        <section key={interest.id} className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-base" aria-hidden>
              {interest.emoji}
            </span>
            <h4 className="font-display text-[15px] font-bold text-ink">
              {interest.label}
            </h4>
          </div>

          {prompts.map((prompt) => {
            const value = answers[prompt.id] ?? ''
            const skipped = value === SKIPPED
            return (
              <div key={prompt.id}>
                <label
                  htmlFor={prompt.id}
                  className="mb-1.5 block text-xs font-extrabold text-ink-soft"
                >
                  {promptLabel(prompt, locale)}
                </label>

                {skipped ? (
                  <button
                    type="button"
                    onClick={() => toggleSkip(prompt.id)}
                    className="flex w-full items-center justify-between rounded-field border-card border-dashed border-edge bg-field px-4 py-3 text-left"
                  >
                    <span className="text-[14px] font-semibold text-ink-faint">
                      {dict.picks.skipped}
                    </span>
                    <span className="text-[12px] font-extrabold text-coral">
                      {dict.picks.unskip}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      id={prompt.id}
                      value={value}
                      onChange={(e) => setAnswer(prompt.id, e.target.value)}
                      placeholder={dict.picks.answerPlaceholder}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      onClick={() => toggleSkip(prompt.id)}
                      className={cn(
                        'flex-none whitespace-nowrap rounded-full px-3 py-2 text-[11.5px] font-extrabold text-ink-faint transition-colors hover:bg-paper-2 hover:text-ink'
                      )}
                    >
                      {dict.picks.skipThis}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </section>
      ))}

      {error && (
        <p className="rounded-field border border-destructive/40 bg-destructive/10 p-3 text-[13px] font-bold text-destructive">
          {t(error)}
        </p>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
        {saving ? dict.common.saving : dict.common.save}
      </Button>
    </div>
  )
}
