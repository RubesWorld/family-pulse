import {
  Film,
  UtensilsCrossed,
  Music,
  BookOpen,
  MapPin,
  Coffee,
} from 'lucide-react'

/**
 * Picks render as tilted stickers. Each category keeps its lucide icon
 * (still used in the pick editor) and gains an emoji plus an explicit
 * gradient, because the sticker needs a real colour pair to spill light
 * onto the paper underneath.
 */
export const PICK_CATEGORIES = [
  {
    id: 'movie',
    label: 'Favorite Movie',
    short: 'Movie',
    icon: Film,
    emoji: '🎬',
    color: 'from-purple-500 to-pink-500',
    gradient: 'linear-gradient(140deg, #C77DEB, #FF77A9)',
    suggestedInterests: ['movies', 'entertainment'],
  },
  {
    id: 'food',
    label: 'Favorite Food',
    short: 'Food',
    icon: UtensilsCrossed,
    emoji: '🍜',
    color: 'from-orange-500 to-red-500',
    gradient: 'linear-gradient(140deg, #FFA85C, #FF6E5C)',
    suggestedInterests: ['cooking', 'food'],
  },
  {
    id: 'song',
    label: 'Favorite Song',
    short: 'Song',
    icon: Music,
    emoji: '🎵',
    color: 'from-blue-500 to-purple-500',
    gradient: 'linear-gradient(140deg, #6FA8FF, #B07CFF)',
    suggestedInterests: ['music'],
  },
  {
    id: 'book',
    label: 'Favorite Book',
    short: 'Book',
    icon: BookOpen,
    emoji: '📚',
    color: 'from-green-500 to-teal-500',
    gradient: 'linear-gradient(140deg, #5FD3A0, #42C0C0)',
    suggestedInterests: ['books', 'reading'],
  },
  {
    id: 'place',
    label: 'Favorite Place',
    short: 'Place',
    icon: MapPin,
    emoji: '📍',
    color: 'from-indigo-500 to-blue-500',
    gradient: 'linear-gradient(140deg, #6C7FE0, #4F8FE0)',
    suggestedInterests: ['travel', 'outdoors'],
  },
  {
    id: 'restaurant',
    label: 'Favorite Restaurant',
    short: 'Restaurant',
    icon: Coffee,
    emoji: '☕',
    color: 'from-yellow-500 to-orange-500',
    gradient: 'linear-gradient(140deg, #F2C33C, #F0913C)',
    suggestedInterests: ['food', 'dining'],
  },
] as const

export type PickCategoryId = (typeof PICK_CATEGORIES)[number]['id']
export type PickCategory = (typeof PICK_CATEGORIES)[number]

export function getPickCategory(id: string): PickCategory | undefined {
  return PICK_CATEGORIES.find((c) => c.id === id)
}
