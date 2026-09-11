/**
 * Every family member owns exactly one accent colour, and it follows
 * them across every screen — avatar bloom, chips, member card. Because
 * the colour comes from a hash of their immutable user id, it never
 * shifts when people join, leave, or get reordered.
 */

export const PERSON_ACCENTS = [
  'coral',
  'denim',
  'plum',
  'marigold',
  'sage',
] as const

export type PersonAccent = (typeof PERSON_ACCENTS)[number]

/** FNV-1a. Small, stable, and no dependency. */
function hash(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function personAccent(userId: string | null | undefined): PersonAccent {
  if (!userId) return 'coral'
  return PERSON_ACCENTS[hash(userId) % PERSON_ACCENTS.length]
}

/**
 * Tailwind can't build class names at runtime, so the full set has to
 * appear literally somewhere in the source for the JIT to emit them.
 */
const ACCENT_TEXT: Record<PersonAccent, string> = {
  coral: 'text-coral',
  denim: 'text-denim',
  plum: 'text-plum',
  marigold: 'text-marigold',
  sage: 'text-sage',
}

const ACCENT_BG: Record<PersonAccent, string> = {
  coral: 'bg-coral',
  denim: 'bg-denim',
  plum: 'bg-plum',
  marigold: 'bg-marigold',
  sage: 'bg-sage',
}

const ACCENT_VAR: Record<PersonAccent, string> = {
  coral: 'var(--coral)',
  denim: 'var(--denim)',
  plum: 'var(--plum)',
  marigold: 'var(--marigold)',
  sage: 'var(--sage)',
}

export function accentTextClass(accent: PersonAccent) {
  return ACCENT_TEXT[accent]
}

export function accentBgClass(accent: PersonAccent) {
  return ACCENT_BG[accent]
}

/** Raw `H S% L%` triple, for inline colour-mix and box-shadow work. */
export function accentVar(accent: PersonAccent) {
  return ACCENT_VAR[accent]
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
