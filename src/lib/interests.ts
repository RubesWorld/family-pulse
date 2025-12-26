export interface Interest {
  id: string
  label: string
  emoji: string
  color: string
}

export const PRESET_INTERESTS: Interest[] = [
  { id: 'music', label: 'Music', emoji: '🎵', color: 'blue' },
  { id: 'sports', label: 'Sports', emoji: '⚽', color: 'green' },
  { id: 'cooking', label: 'Cooking', emoji: '🍳', color: 'orange' },
  { id: 'reading', label: 'Reading', emoji: '📚', color: 'purple' },
  { id: 'art', label: 'Art', emoji: '🎨', color: 'pink' },
  { id: 'travel', label: 'Travel', emoji: '✈️', color: 'cyan' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮', color: 'violet' },
  { id: 'fitness', label: 'Fitness', emoji: '💪', color: 'red' },
  { id: 'photography', label: 'Photography', emoji: '📷', color: 'slate' },
  { id: 'gardening', label: 'Gardening', emoji: '🌱', color: 'emerald' },
  { id: 'movies', label: 'Movies', emoji: '🎬', color: 'amber' },
  { id: 'pets', label: 'Pets', emoji: '🐾', color: 'yellow' },
  { id: 'crafts', label: 'Crafts', emoji: '✂️', color: 'rose' },
  { id: 'tech', label: 'Tech', emoji: '💻', color: 'indigo' },
  { id: 'nature', label: 'Nature', emoji: '🌲', color: 'lime' },
]

export function getInterestById(id: string): Interest | undefined {
  return PRESET_INTERESTS.find(interest => interest.id === id)
}
