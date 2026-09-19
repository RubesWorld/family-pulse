'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { Dictionary } from '@/lib/i18n'
import { useI18n } from '@/components/i18n-provider'



function Optional({ dict }: { dict: Dictionary }) {
  return (
    <span className="font-bold text-ink-faint"> · {dict.add.optional}</span>
  )
}

export default function AddActivityPage() {
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState(dateParam ? `${dateParam}T12:00` : '')
  const [locationName, setLocationName] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { dict } = useI18n()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          title,
          description: description || null,
          starts_at: startsAt ? new Date(startsAt).toISOString() : null,
          location_name: locationName || null,
          notes: notes || null,
        })

      if (insertError) throw insertError

      router.push('/feed')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <header className="relative px-5 pb-2 pt-screen">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-marigold/90">
              {dict.add.eyebrow}
            </div>
            <h1 className="mt-1 font-display text-[27px] font-black leading-[1.06] tracking-tight text-ink">
              {dict.add.titleLine1}
              <br />
              {dict.add.titleLine2}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-7 text-[12.5px] font-extrabold text-ink-faint transition-colors hover:text-ink"
          >
            {dict.common.cancel}
          </button>
        </div>

        <svg
          aria-hidden
          viewBox="0 0 132 9"
          fill="none"
          className="mt-0.5 block h-2 w-32 text-marigold"
          style={{
            filter: 'drop-shadow(0 0 8px hsl(var(--marigold) / var(--glow)))',
          }}
        >
          <path
            d="M2 6.2c22-4.4 44-5.2 66-3.1 21 2 42 2.4 63-.6"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </header>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4 px-5">
        <div>
          <Label htmlFor="title">{dict.add.thing}</Label>
          <Input
            id="title"
            type="text"
            placeholder={dict.add.thingPlaceholder}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <Label htmlFor="description">
            {dict.add.tellMore}
            <Optional dict={dict} />
          </Label>
          <Textarea
            id="description"
            placeholder={dict.add.tellMorePlaceholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="startsAt">
            {dict.add.when}
            <Optional dict={dict} />
          </Label>
          <Input
            id="startsAt"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="location">
            {dict.add.where}
            <Optional dict={dict} />
          </Label>
          <Input
            id="location"
            type="text"
            placeholder={dict.add.wherePlaceholder}
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="notes">
            {dict.add.noteForFamily}
            <Optional dict={dict} />
          </Label>
          <Textarea
            id="notes"
            placeholder={dict.add.notePlaceholder}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="min-h-[72px]"
          />
        </div>

        {error && (
          <p className="rounded-field border border-destructive/40 bg-destructive/10 p-3 text-[13px] font-bold text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading || !title.trim()}
        >
          {loading ? dict.add.posting : dict.add.share}
        </Button>
      </form>
    </div>
  )
}
