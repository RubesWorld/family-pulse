'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { pickKeys, savePicks } from '@/lib/queries/picks'
import { useSession } from '@/lib/supabase/session-context'
import { PICK_CATEGORIES } from '@/lib/pick-categories'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { UserPick } from '@/types/database'

interface PickEditorProps {
  userId: string
  /**
   * The caller's current picks, straight from the cache.
   *
   * These used to arrive stripped of their ids, so the save had to re-query the
   * same rows to find out what to archive — a round-trip to fetch data the
   * parent was already holding. Passing the rows themselves removes it.
   */
  existingPicks: readonly UserPick[]
  userInterests: Array<{
    category: string
    is_custom: boolean
  }>
  /** Called once the save has landed *and* the cache reflects it. */
  onSaved: () => void
}

export function PickEditor({ userId, existingPicks, userInterests, onSaved }: PickEditorProps) {
  const { supabase } = useSession()
  const queryClient = useQueryClient()
  const [picks, setPicks] = useState<Record<string, { value: string; interest_tag: string | null }>>({})

  useEffect(() => {
    // Initialize picks from existing data
    const initialPicks: Record<string, { value: string; interest_tag: string | null }> = {}
    PICK_CATEGORIES.forEach(cat => {
      const existing = existingPicks.find(p => p.category === cat.id)
      initialPicks[cat.id] = {
        value: existing?.value || '',
        interest_tag: existing?.interest_tag || null
      }
    })
    setPicks(initialPicks)
  }, [existingPicks])

  const handleUpdatePick = (category: string, value: string) => {
    setPicks(prev => ({
      ...prev,
      [category]: {
        value,
        interest_tag: prev[category]?.interest_tag || null
      }
    }))

    // Auto-suggest interest tag
    if (value) {
      const categoryData = PICK_CATEGORIES.find(c => c.id === category)
      if (categoryData?.suggestedInterests && categoryData.suggestedInterests.length > 0) {
        const matchingInterest = userInterests.find(ui =>
          (categoryData.suggestedInterests as readonly string[]).includes(ui.category)
        )
        if (matchingInterest) {
          setPicks(prev => ({
            ...prev,
            [category]: {
              ...prev[category],
              interest_tag: matchingInterest.category
            }
          }))
        }
      }
    }
  }

  const handleChangeInterestTag = (category: string, tag: string | null) => {
    setPicks(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        interest_tag: tag
      }
    }))
  }

  const save = useMutation({
    mutationFn: () =>
      // `existingPicks` is what the parent already has in cache, so the save no
      // longer opens with a read. The rest — which rows to archive, which to
      // insert, which only need a new tag — is worked out once in `planPickSave`
      // and applied in at most three statements, where the previous version
      // issued an archive and an insert per category in sequence.
      savePicks(
        supabase,
        userId,
        Object.entries(picks).map(([category, pick]) => ({
          category,
          value: pick.value,
          interest_tag: pick.interest_tag,
        })),
        existingPicks
      ),
    onSuccess: async () => {
      // Picks are on Profile, Family and the Feed, and the history dialog reads
      // the rows this just archived. One prefix covers all of them.
      await queryClient.invalidateQueries({ queryKey: pickKeys.all })
      onSaved()
    },
  })

  const saving = save.isPending
  const error = save.error
    ? save.error instanceof Error
      ? save.error.message
      : 'Failed to save picks'
    : null

  return (
    <div className="space-y-4">
      {PICK_CATEGORIES.map((category) => {
        const Icon = category.icon
        const currentPick = picks[category.id]

        return (
          <Card key={category.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-bold">{category.label}</h4>
              </div>

              <Input
                placeholder={`e.g., ${category.id === 'movie' ? 'Inception' : category.id === 'food' ? 'Pizza' : category.id === 'song' ? 'Bohemian Rhapsody' : category.id === 'book' ? 'Dune' : category.id === 'place' ? 'Japan' : 'Joe\'s Diner'}`}
                value={currentPick?.value || ''}
                onChange={(e) => handleUpdatePick(category.id, e.target.value)}
                className="mb-2"
              />

              {/* Interest tag selector */}
              {currentPick?.value && userInterests.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink-faint">Link to interest</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={currentPick.interest_tag === null ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleChangeInterestTag(category.id, null)}
                    >
                      None
                    </Badge>
                    {userInterests.map(interest => (
                      <Badge
                        key={interest.category}
                        variant={currentPick.interest_tag === interest.category ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleChangeInterestTag(category.id, interest.category)}
                      >
                        {interest.category}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Error message */}
      {error && (
        <div className="rounded-field border border-destructive/40 bg-destructive/10 p-3">
          <p className="text-[13px] font-bold text-destructive">{error}</p>
        </div>
      )}

      <Button
        onClick={() => save.mutate()}
        className="w-full"
        size="lg"
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Picks'}
      </Button>
    </div>
  )
}
