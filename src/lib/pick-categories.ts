import {
  Film,
  UtensilsCrossed,
  Music,
  BookOpen,
  MapPin,
  Coffee
} from 'lucide-react'

export const PICK_CATEGORIES = [
  {
    id: 'movie',
    label: 'Favorite Movie',
    icon: Film,
    color: 'from-purple-500 to-pink-500',
    suggestedInterests: ['movies', 'entertainment']
  },
  {
    id: 'food',
    label: 'Favorite Food',
    icon: UtensilsCrossed,
    color: 'from-orange-500 to-red-500',
    suggestedInterests: ['cooking', 'food']
  },
  {
    id: 'song',
    label: 'Favorite Song',
    icon: Music,
    color: 'from-blue-500 to-purple-500',
    suggestedInterests: ['music']
  },
  {
    id: 'book',
    label: 'Favorite Book',
    icon: BookOpen,
    color: 'from-green-500 to-teal-500',
    suggestedInterests: ['books', 'reading']
  },
  {
    id: 'place',
    label: 'Favorite Place',
    icon: MapPin,
    color: 'from-indigo-500 to-blue-500',
    suggestedInterests: ['travel', 'outdoors']
  },
  {
    id: 'restaurant',
    label: 'Favorite Restaurant',
    icon: Coffee,
    color: 'from-yellow-500 to-orange-500',
    suggestedInterests: ['food', 'dining']
  },
] as const

export type PickCategoryId = typeof PICK_CATEGORIES[number]['id']
