'use client'

import { useState } from 'react'
import { PRESET_INTERESTS } from '@/lib/interests'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, X } from 'lucide-react'

interface InterestCardEditorProps {
  userId: string
  existingCards: Array<{
    category: string
    description: string
    is_custom: boolean
    tags: string[]
  }>
  onSave: () => void
}

export function InterestCardEditor({ userId, existingCards, onSave }: InterestCardEditorProps) {
  const [cards, setCards] = useState(existingCards)
  const [showAddPreset, setShowAddPreset] = useState(false)
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({}) // Track tag input for each card
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get preset interests not yet added
  const availablePresets = PRESET_INTERESTS.filter(
    preset => !cards.some(card => card.category === preset.id)
  )

  const handleUpdateDescription = (category: string, description: string) => {
    setCards(prev => prev.map(card =>
      card.category === category ? { ...card, description } : card
    ))
  }

  const handleAddTag = (category: string) => {
    const tagInput = tagInputs[category]?.trim()
    if (!tagInput) return

    setCards(prev => prev.map(card =>
      card.category === category
        ? { ...card, tags: [...card.tags, tagInput] }
        : card
    ))
    setTagInputs(prev => ({ ...prev, [category]: '' }))
  }

  const handleRemoveTag = (category: string, tagToRemove: string) => {
    setCards(prev => prev.map(card =>
      card.category === category
        ? { ...card, tags: card.tags.filter(tag => tag !== tagToRemove) }
        : card
    ))
  }

  const handleAddPreset = (presetId: string) => {
    const preset = PRESET_INTERESTS.find(p => p.id === presetId)
    if (!preset) return

    setCards(prev => [...prev, {
      category: presetId,
      description: '',
      is_custom: false,
      tags: []
    }])
    setShowAddPreset(false)
  }

  const handleAddCustom = () => {
    if (!customName.trim()) return

    setCards(prev => [...prev, {
      category: customName.trim(),
      description: '',
      is_custom: true,
      tags: []
    }])
    setCustomName('')
    setShowAddCustom(false)
  }

  const handleRemove = (category: string) => {
    setCards(prev => prev.filter(card => card.category !== category))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const supabase = (await import('@/lib/supabase/client')).createClient()

      // Delete existing cards
      const { error: deleteError } = await supabase
        .from('interest_cards')
        .delete()
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      // Insert new cards
      if (cards.length > 0) {
        const { error: insertError } = await supabase
          .from('interest_cards')
          .insert(
            cards.map(card => ({
              user_id: userId,
              category: card.category,
              is_custom: card.is_custom,
              description: card.description,
              tags: card.tags
            }))
          )

        if (insertError) throw insertError
      }

      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save interests')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Existing cards */}
      <div className="space-y-3">
        {cards.map((card) => {
          const preset = PRESET_INTERESTS.find(p => p.id === card.category)
          const emoji = preset?.emoji || '⭐'
          const label = preset?.label || card.category
          const placeholder = preset?.placeholder || 'Describe this interest...'

          return (
            <Card key={card.category}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{emoji}</span>
                    <h4 className="font-bold">{label}</h4>
                    {card.is_custom && (
                      <Badge variant="outline" className="text-xs">Custom</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(card.category)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  placeholder={placeholder}
                  value={card.description}
                  onChange={(e) => handleUpdateDescription(card.category, e.target.value)}
                  className="min-h-[80px] mb-3"
                />

                {/* Tags section */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600">
                    Specifics (e.g., Claude, Gemini, AI)
                  </label>

                  {/* Display existing tags */}
                  {card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {card.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(card.category, tag)}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Add tag input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInputs[card.category] || ''}
                      onChange={(e) => setTagInputs(prev => ({ ...prev, [card.category]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag(card.category)
                        }
                      }}
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTag(card.category)}
                      disabled={!tagInputs[card.category]?.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add buttons */}
      <div className="flex gap-2">
        {availablePresets.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowAddPreset(!showAddPreset)}
            className="flex-1 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Interest
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => setShowAddCustom(!showAddCustom)}
          className="flex-1 gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Custom
        </Button>
      </div>

      {/* Add preset interest selector */}
      {showAddPreset && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Choose an interest:</p>
            <div className="flex flex-wrap gap-2">
              {availablePresets.map(preset => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPreset(preset.id)}
                  className="gap-1.5"
                >
                  <span>{preset.emoji}</span>
                  <span>{preset.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add custom interest input */}
      {showAddCustom && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-medium">Create custom interest:</p>
            <Input
              placeholder="e.g., Baking, Astronomy, Yoga..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
            />
            <Button onClick={handleAddCustom} size="sm" className="w-full">
              Add Custom Interest
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Save button */}
      <Button onClick={handleSave} className="w-full" size="lg" disabled={saving}>
        {saving ? 'Saving...' : 'Save Interests'}
      </Button>
    </div>
  )
}
