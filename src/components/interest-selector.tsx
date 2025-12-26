'use client'

import { PRESET_INTERESTS } from '@/lib/interests'
import { Check } from 'lucide-react'

interface InterestSelectorProps {
  selectedInterests: string[]
  onToggle: (interestId: string) => void
}

export function InterestSelector({ selectedInterests, onToggle }: InterestSelectorProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {PRESET_INTERESTS.map((interest) => {
        const isSelected = selectedInterests.includes(interest.id)

        return (
          <button
            key={interest.id}
            type="button"
            onClick={() => onToggle(interest.id)}
            className={`
              relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
              ${isSelected
                ? 'bg-blue-50 border-blue-500 shadow-sm'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            {isSelected && (
              <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            <span className="text-2xl mb-1">{interest.emoji}</span>
            <span className={`text-xs font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
              {interest.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
