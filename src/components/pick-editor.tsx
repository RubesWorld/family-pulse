'use client'

import { useState, useEffect } from 'react'
import { PICK_CATEGORIES } from '@/lib/pick-categories'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

export function PickEditor({ userId, existingPicks, userInterests, onSave }: PickEditorProps) {
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

  const handleSave = async () => {
    const supabase = (await import('@/lib/supabase/client')).createClient()

    // Delete existing picks
    await supabase
      .from('picks')
      .delete()
      .eq('user_id', userId)

    // Insert new picks (only those with values)
    const picksToInsert = Object.entries(picks)
      .filter(([, pick]) => pick.value.trim())
      .map(([category, pick]) => ({
        user_id: userId,
        category,
        value: pick.value,
        interest_tag: pick.interest_tag
      }))

    if (picksToInsert.length > 0) {
      await supabase
        .from('picks')
        .insert(picksToInsert)
    }

    onSave()
  }

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
                  <p className="text-xs text-gray-500">Link to interest:</p>
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

      <Button onClick={handleSave} className="w-full" size="lg">
        Save Picks
      </Button>
    </div>
  )
}
