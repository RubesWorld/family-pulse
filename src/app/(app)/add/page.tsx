'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { activityKeys, createActivity } from '@/lib/queries/activities'
import { useSession } from '@/lib/supabase/session-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Swash } from '@/components/ui/swash'

function Optional() {
  return <span className="font-bold text-ink-faint"> · optional</span>
}

export default function AddActivityPage() {
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')

  const { supabase, user } = useSession()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState(dateParam ? `${dateParam}T12:00` : '')
  const [locationName, setLocationName] = useState('')
  const [notes, setNotes] = useState('')
  const router = useRouter()

  const post = useMutation({
    mutationFn: () => {
      // The session context already resolved this; the page used to ask
      // `auth.getUser()` for it on every submit.
      if (!user) throw new Error('Not authenticated')

      return createActivity(supabase, {
        user_id: user.id,
        title,
        description: description || null,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        location_name: locationName || null,
        notes: notes || null,
      })
    },
    onSuccess: async () => {
      // The feed and the profile's "recent activity" both read `activities`,
      // so one prefix covers both. Awaited before navigating: this replaces a
      // `router.refresh()` that fired after `router.push`, which meant the feed
      // rendered from the old server payload and then swapped.
      await queryClient.invalidateQueries({ queryKey: activityKeys.all })
      router.push('/feed')
    },
  })

  // Stays true through the navigation — the form should not become submittable
  // again while the feed is being routed to.
  const loading = post.isPending || post.isSuccess
  const error = post.error
    ? post.error instanceof Error
      ? post.error.message
      : 'An error occurred'
    : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post.mutate()
  }

  return (
    <div className="mx-auto max-w-lg">
      <header className="relative px-5 pb-2 pt-14">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-marigold/90">
              Share
            </div>
            <h1 className="mt-1 font-display text-[27px] font-black leading-[1.06] tracking-tight text-ink">
              What are you
              <br />
              up to?
            </h1>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-7 text-[12.5px] font-extrabold text-ink-faint transition-colors hover:text-ink"
          >
            Cancel
          </button>
        </div>

        <Swash profile="header" className="w-32" />
      </header>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4 px-5">
        <div>
          <Label htmlFor="title">The thing</Label>
          <Input
            id="title"
            type="text"
            placeholder="Taking a sewing class, going to a concert…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <Label htmlFor="description">
            Tell us more
            <Optional />
          </Label>
          <Textarea
            id="description"
            placeholder="What's it about? Why are you doing it?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="startsAt">
            When
            <Optional />
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
            Where
            <Optional />
          </Label>
          <Input
            id="location"
            type="text"
            placeholder="Downtown, Mom's house, the park…"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="notes">
            Note for family
            <Optional />
          </Label>
          <Textarea
            id="notes"
            placeholder="Call me if you want to join!"
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
          {loading ? 'Posting…' : 'Share with family'}
        </Button>
      </form>
    </div>
  )
}
