'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X } from 'lucide-react'

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
    <div className="max-w-lg mx-auto p-4">
      <div className="flex justify-end mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Share What You&apos;re Up To</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">What are you doing?</Label>
              <Input
                id="title"
                type="text"
                placeholder="Taking a sewing class, Going to a concert..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Tell us more (optional)</Label>
              <Textarea
                id="description"
                placeholder="What's it about? Why are you doing it?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startsAt">When? (optional)</Label>
              <Input
                id="startsAt"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Where? (optional)</Label>
              <Input
                id="location"
                type="text"
                placeholder="Downtown, Mom's house, The park..."
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes for family (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Call me if you want to join! Or: I'll be busy during this time."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-base"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={loading || !title.trim()}
            >
              {loading ? 'Posting...' : 'Share with Family'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
