'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/i18n-provider'
import {
  SKIPPED,
  getPrompt,
  interestEmoji,
  promptLabel,
} from '@/lib/pick-prompts'

interface PromptCardProps {
  userId: string
  /** Prompt id chosen on the server, so it is stable across a render. */
  promptId: string
}

/**
 * The nudge. One unanswered question, answerable inline in the feed.
 *
 * Without this, "Things I like" is a form buried three taps deep in Profile
 * that nobody is ever invited to fill in — which makes the whole feature
 * invisible unless someone goes looking for it.
 */
export function PromptCard({ userId, promptId }: PromptCardProps) {
  const { dict, locale } = useI18n()
  const router = useRouter()

  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const prompt = getPrompt(promptId)
  if (!prompt || dismissed) return null

  const save = async (answer: string) => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('picks').insert({
        user_id: userId,
        category: prompt.id,
        value: answer,
        interest_tag: prompt.interest,
        is_current: true,
      })
      if (error) throw error

      setDismissed(true)
      router.refresh()
    } catch (err) {
      console.error('Failed to save answer:', err)
      setSaving(false)
    }
  }

  const trimmed = value.trim()

  return (
    <div
      className="relative mx-5 mb-4 rounded-card border-card p-5 backdrop-blur-card"
      style={{
        background:
          'linear-gradient(150deg, hsl(var(--marigold) / 0.2), hsl(var(--coral) / 0.1))',
        borderColor: 'hsl(var(--marigold) / 0.36)',
        boxShadow:
          '0 14px 40px -16px hsl(var(--marigold) / calc(0.8 * var(--glow))), inset 0 1px 0 rgb(255 235 210 / 0.14)',
      }}
    >
      <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-marigold">
        {dict.picks.yourTurn}
      </div>

      <div className="mt-2 flex items-start gap-2.5">
        <span className="text-xl" aria-hidden>
          {interestEmoji(prompt.interest)}
        </span>
        <h2 className="font-display text-[21px] font-bold leading-tight tracking-tight text-ink">
          {promptLabel(prompt, locale)}
        </h2>
      </div>

      <p className="mt-1.5 text-[12.5px] font-medium text-ink-soft">
        {dict.picks.promptCardHint}
      </p>

      <div className="mt-3.5">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={dict.picks.answerPlaceholder}
          disabled={saving}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && trimmed) save(trimmed)
          }}
          aria-label={promptLabel(prompt, locale)}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          onClick={() => save(trimmed)}
          disabled={saving || !trimmed}
          className="flex-1"
        >
          {saving ? dict.common.saving : dict.common.save}
        </Button>
        <button
          type="button"
          onClick={() => save(SKIPPED)}
          disabled={saving}
          className="whitespace-nowrap rounded-full px-3.5 py-2.5 text-[12px] font-extrabold text-ink-faint transition-colors hover:bg-paper-2 hover:text-ink disabled:opacity-50"
        >
          {dict.picks.skipThis}
        </button>
      </div>
    </div>
  )
}
