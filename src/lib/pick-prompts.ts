import type { Locale } from '@/lib/i18n/config'
import { PRESET_INTERESTS } from '@/lib/interests'

/**
 * Picks are generated from the interests a person actually claimed, rather
 * than a fixed list shown to everyone. If you never said you hike, you are
 * never asked for your favourite hike — which is what makes "not everyone has
 * that" a non-problem instead of a row of blanks.
 *
 * `id` is what gets written to picks.category. That column is plain text with
 * no CHECK constraint (and migration 06 dropped its unique key), so this
 * needed no schema change.
 *
 * Wording rule: short, literal, no idioms. These are read by people who do not
 * all speak fluent English, and a clever prompt is a worse prompt.
 */
export interface PickPrompt {
  id: string
  interest: string
  label: Record<Locale, string>
}

export const PICK_PROMPTS: PickPrompt[] = [
  // music
  { id: 'music.song_now', interest: 'music', label: { en: 'Song you like right now', es: 'Canción que te gusta ahora' } },
  { id: 'music.concert', interest: 'music', label: { en: 'Best concert you went to', es: 'El mejor concierto al que has ido' } },

  // sports
  { id: 'sports.team', interest: 'sports', label: { en: 'Team you like', es: 'Equipo que te gusta' } },
  { id: 'sports.game', interest: 'sports', label: { en: 'Best game you played', es: 'El mejor partido que has jugado' } },

  // cooking
  { id: 'cooking.cook_best', interest: 'cooking', label: { en: 'Food you cook best', es: 'Comida que cocinas mejor' } },
  { id: 'cooking.eat', interest: 'cooking', label: { en: 'Food you like to eat', es: 'Comida que te gusta comer' } },
  { id: 'cooking.restaurant', interest: 'cooking', label: { en: 'Restaurant you like', es: 'Restaurante que te gusta' } },

  // reading
  { id: 'reading.recommend', interest: 'reading', label: { en: 'Book you tell people to read', es: 'Libro que recomiendas' } },

  // art
  { id: 'art.draw', interest: 'art', label: { en: 'What you like to draw', es: 'Lo que te gusta dibujar' } },

  // travel
  { id: 'travel.visited', interest: 'travel', label: { en: 'Best place you visited', es: 'El mejor lugar que has visitado' } },
  { id: 'travel.want', interest: 'travel', label: { en: 'Place you want to go', es: 'Lugar al que quieres ir' } },

  // gaming
  { id: 'gaming.now', interest: 'gaming', label: { en: 'Game you play now', es: 'Juego que juegas ahora' } },
  { id: 'gaming.most', interest: 'gaming', label: { en: 'Game you played the most', es: 'Juego que más has jugado' } },

  // fitness
  { id: 'fitness.move', interest: 'fitness', label: { en: 'How you like to exercise', es: 'Cómo te gusta hacer ejercicio' } },

  // photography
  { id: 'photography.subject', interest: 'photography', label: { en: 'What you like to photograph', es: 'Lo que te gusta fotografiar' } },

  // gardening
  { id: 'gardening.growing', interest: 'gardening', label: { en: 'What you are growing', es: 'Lo que estás sembrando' } },

  // movies
  { id: 'movies.rewatch', interest: 'movies', label: { en: 'Movie you can watch again', es: 'Película que ves una y otra vez' } },
  { id: 'movies.recent', interest: 'movies', label: { en: 'Good movie you saw recently', es: 'Buena película que viste hace poco' } },

  // pets
  { id: 'pets.funny', interest: 'pets', label: { en: 'Funny thing your pet does', es: 'Algo chistoso que hace tu mascota' } },

  // crafts
  { id: 'crafts.making', interest: 'crafts', label: { en: 'What you are making', es: 'Algo que estás haciendo a mano' } },

  // tech
  { id: 'tech.tool', interest: 'tech', label: { en: 'App or tool you like', es: 'App o herramienta que te gusta' } },

  // nature
  { id: 'nature.hike', interest: 'nature', label: { en: 'Best hike', es: 'La mejor caminata' } },
  { id: 'nature.place', interest: 'nature', label: { en: 'Best place outside', es: 'El mejor lugar al aire libre' } },
]

/**
 * The six original categories, mapped onto their closest new prompt.
 *
 * Existing rows keep their old value in the database; this resolves them at
 * read time so nobody's answers disappear. Saving rewrites them to the new id,
 * so the old ones drain away on their own without a data migration.
 */
export const LEGACY_PROMPT_ALIASES: Record<string, string> = {
  song: 'music.song_now',
  movie: 'movies.rewatch',
  book: 'reading.recommend',
  food: 'cooking.eat',
  restaurant: 'cooking.restaurant',
  place: 'travel.visited',
}

/** A value meaning "this prompt doesn't apply to me" — an answer, not a blank. */
export const SKIPPED = '__skipped__'

const BY_ID = new Map(PICK_PROMPTS.map((p) => [p.id, p]))

export function resolvePromptId(stored: string): string {
  return LEGACY_PROMPT_ALIASES[stored] ?? stored
}

export function getPrompt(storedId: string): PickPrompt | undefined {
  return BY_ID.get(resolvePromptId(storedId))
}

export function promptLabel(prompt: PickPrompt, locale: Locale): string {
  return prompt.label[locale] ?? prompt.label.en
}

export function interestEmoji(interestId: string): string {
  return PRESET_INTERESTS.find((i) => i.id === interestId)?.emoji ?? '⭐'
}

export function promptsForInterest(interestId: string): PickPrompt[] {
  return PICK_PROMPTS.filter((p) => p.interest === interestId)
}

/**
 * Which prompts a person should see: everything generated by the interests
 * they claimed, plus anything they have already answered — so a pick never
 * vanishes because someone later removed the interest behind it.
 */
export function promptsForUser(
  interestIds: string[],
  answeredStoredIds: string[] = []
): PickPrompt[] {
  const claimed = new Set(interestIds)
  const answered = new Set(answeredStoredIds.map(resolvePromptId))

  return PICK_PROMPTS.filter(
    (p) => claimed.has(p.interest) || answered.has(p.id)
  )
}

/** Groups prompts under their interest, preserving PRESET_INTERESTS order. */
export function groupPromptsByInterest(prompts: PickPrompt[]) {
  return PRESET_INTERESTS.map((interest) => ({
    interest,
    prompts: prompts.filter((p) => p.interest === interest.id),
  })).filter((group) => group.prompts.length > 0)
}

/**
 * Sticker gradients, now keyed by interest rather than by the old six
 * categories. Each roughly follows the colour already declared on the
 * interest in PRESET_INTERESTS.
 */
const INTEREST_GRADIENTS: Record<string, string> = {
  music: 'linear-gradient(140deg, #6FA8FF, #B07CFF)',
  sports: 'linear-gradient(140deg, #5FD3A0, #42C0C0)',
  cooking: 'linear-gradient(140deg, #FFA85C, #FF6E5C)',
  reading: 'linear-gradient(140deg, #C77DEB, #FF77A9)',
  art: 'linear-gradient(140deg, #FF8FB8, #FF6E9C)',
  travel: 'linear-gradient(140deg, #5ED2E8, #4F8FE0)',
  gaming: 'linear-gradient(140deg, #A88CFF, #C77DEB)',
  fitness: 'linear-gradient(140deg, #FF7A7A, #FF5C8A)',
  photography: 'linear-gradient(140deg, #9AA6B8, #6C7FE0)',
  gardening: 'linear-gradient(140deg, #7DD99A, #4FBF87)',
  movies: 'linear-gradient(140deg, #FFC86B, #FF9B4D)',
  pets: 'linear-gradient(140deg, #FFD36B, #FFA85C)',
  crafts: 'linear-gradient(140deg, #FF9CC0, #E87DB4)',
  tech: 'linear-gradient(140deg, #7C9CFF, #6C7FE0)',
  nature: 'linear-gradient(140deg, #8FD97A, #4FBF87)',
}

const FALLBACK_GRADIENT = 'linear-gradient(140deg, #FFA85C, #FF6E5C)'

export function promptGradient(storedId: string): string {
  const prompt = getPrompt(storedId)
  if (!prompt) return FALLBACK_GRADIENT
  return INTEREST_GRADIENTS[prompt.interest] ?? FALLBACK_GRADIENT
}

export function promptEmoji(storedId: string): string {
  const prompt = getPrompt(storedId)
  return prompt ? interestEmoji(prompt.interest) : '⭐'
}

/** True when the person explicitly said this one is not for them. */
export function isSkipped(value: string | null | undefined): boolean {
  return value === SKIPPED
}

/**
 * Chooses which unanswered prompt to surface in someone's feed.
 *
 * Rotates by day so it isn't the same question forever, but is stable within a
 * day — picking at random would change on every render and, worse, differ
 * between the server and the client.
 *
 * Skipped prompts count as answered. Saying "not for me" should retire the
 * question, not put it back in the queue tomorrow.
 */
export function chooseOpenPrompt(
  interestIds: string[],
  answered: Array<{ category: string; value: string }>,
  today: Date
): PickPrompt | null {
  const done = new Set(
    answered
      .filter((p) => p.value && p.value.trim().length > 0)
      .map((p) => resolvePromptId(p.category))
  )

  const open = promptsForUser(interestIds).filter((p) => !done.has(p.id))
  if (open.length === 0) return null

  const startOfYear = Date.UTC(today.getUTCFullYear(), 0, 0)
  const dayOfYear = Math.floor(
    (Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) -
      startOfYear) /
      86_400_000
  )

  return open[dayOfYear % open.length]
}
