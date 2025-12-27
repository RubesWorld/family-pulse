'use client'

import { InterestCardWithUser } from '@/types/database'
import { PRESET_INTERESTS } from '@/lib/interests'

interface InterestCardProps {
  interest: InterestCardWithUser
  onClick?: () => void
  isSelected?: boolean
}

// Pastel color schemes matching the example
const colorSchemes = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-900', tagBg: 'bg-blue-200/70', tagText: 'text-blue-800' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-900', tagBg: 'bg-orange-200/70', tagText: 'text-orange-800' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-900', tagBg: 'bg-purple-200/70', tagText: 'text-purple-800' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-900', tagBg: 'bg-emerald-200/70', tagText: 'text-emerald-800' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-900', tagBg: 'bg-pink-200/70', tagText: 'text-pink-800' },
  yellow: { bg: 'bg-amber-50', text: 'text-amber-900', tagBg: 'bg-amber-200/70', tagText: 'text-amber-800' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-900', tagBg: 'bg-teal-200/70', tagText: 'text-teal-800' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-900', tagBg: 'bg-indigo-200/70', tagText: 'text-indigo-800' },
}

// Map interest categories to color schemes
function getColorScheme(category: string): typeof colorSchemes.blue {
  const colorMap: Record<string, keyof typeof colorSchemes> = {
    music: 'blue',
    movies: 'purple',
    books: 'orange',
    sports: 'green',
    art: 'pink',
    cooking: 'orange',
    tech: 'indigo',
    travel: 'teal',
    fitness: 'green',
    gaming: 'purple',
    photography: 'pink',
    fashion: 'pink',
    design: 'purple',
  }

  const colorKey = colorMap[category.toLowerCase()] || 'blue'
  return colorSchemes[colorKey]
}

export function InterestCard({ interest, onClick, isSelected }: InterestCardProps) {
  const preset = PRESET_INTERESTS.find((p) => p.id === interest.category)
  const label = preset?.label || interest.category
  const colors = getColorScheme(interest.category)

  return (
    <div
      onClick={onClick}
      className={`
        relative group cursor-pointer overflow-hidden rounded-2xl p-5 transition-all duration-200
        ${colors.bg} ${colors.text}
        ${isSelected ? 'ring-4 ring-blue-500 scale-[1.02]' : 'hover:scale-[1.02] hover:shadow-lg'}
        border-2 border-black/5 shadow-md
      `}
    >
      {/* Content */}
      <div className="relative z-10">
        {/* Category Name */}
        <h3 className="text-xl font-bold mb-2">
          {label}
        </h3>

        {/* Description */}
        <p className="text-sm opacity-75 leading-relaxed mb-4">
          {interest.description}
        </p>

        {/* Tags */}
        {interest.tags && interest.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {interest.tags.map((tag, index) => (
              <span
                key={index}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium
                  ${colors.tagBg} ${colors.tagText}
                  border border-black/5
                `}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Explore button */}
        <button className="w-full flex items-center justify-between text-sm font-semibold group/btn hover:translate-x-1 transition-transform mt-auto">
          <span>Explore</span>
          <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  )
}
