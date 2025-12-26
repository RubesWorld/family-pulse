export interface Interest {
  id: string
  label: string
  emoji: string
  color: string
  placeholder: string
}

export const PRESET_INTERESTS: Interest[] = [
  { id: 'music', label: 'Music', emoji: '🎵', color: 'blue', placeholder: 'What role does music play in your life?' },
  { id: 'sports', label: 'Sports', emoji: '⚽', color: 'green', placeholder: 'What sports or activities keep you moving?' },
  { id: 'cooking', label: 'Cooking', emoji: '🍳', color: 'orange', placeholder: 'What do you love about cooking?' },
  { id: 'reading', label: 'Reading', emoji: '📚', color: 'purple', placeholder: 'What kinds of books capture your attention?' },
  { id: 'art', label: 'Art', emoji: '🎨', color: 'pink', placeholder: 'How does art inspire you?' },
  { id: 'travel', label: 'Travel', emoji: '✈️', color: 'cyan', placeholder: 'Where do you love to explore?' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮', color: 'violet', placeholder: 'What games are you into right now?' },
  { id: 'fitness', label: 'Fitness', emoji: '💪', color: 'red', placeholder: 'How do you stay active?' },
  { id: 'photography', label: 'Photography', emoji: '📷', color: 'slate', placeholder: 'What do you love to capture?' },
  { id: 'gardening', label: 'Gardening', emoji: '🌱', color: 'emerald', placeholder: 'What are you growing?' },
  { id: 'movies', label: 'Movies', emoji: '🎬', color: 'amber', placeholder: 'What kinds of films do you enjoy?' },
  { id: 'pets', label: 'Pets', emoji: '🐾', color: 'yellow', placeholder: 'Tell us about your furry friends!' },
  { id: 'crafts', label: 'Crafts', emoji: '✂️', color: 'rose', placeholder: 'What do you like to create?' },
  { id: 'tech', label: 'Tech', emoji: '💻', color: 'indigo', placeholder: 'What technology excites you?' },
  { id: 'nature', label: 'Nature', emoji: '🌲', color: 'lime', placeholder: 'How do you connect with nature?' },
]

export function getInterestById(id: string): Interest | undefined {
  return PRESET_INTERESTS.find(interest => interest.id === id)
}
