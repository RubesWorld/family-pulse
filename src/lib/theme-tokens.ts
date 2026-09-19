import type { Theme } from './theme-script'
import type { PersonAccent } from './person-color'

/**
 * Resolved colour values for both themes.
 *
 * globals.css carries the same colours as CSS custom properties, and
 * that is what every `className` still styles through. This file exists
 * for the other half: anything built at runtime into an inline `style`
 * prop. A string like `hsl(var(--coral))` only means something to a
 * browser — React Native's style engine takes it verbatim, understands
 * no custom properties, and fails silently — so inline styles resolve
 * their colours here instead.
 *
 * The two representations must agree. Each token below names the CSS
 * variable it mirrors, and globals.css points back at this file.
 */

export interface ThemeTokens {
  /** Mirrors --coral / --denim / --plum / --marigold / --sage. */
  accents: Record<PersonAccent, string>
  /** Mirrors --paper. The ring that lifts an avatar off the page. */
  paper: string
  /**
   * Mirrors --glow. Bloom intensity multiplier: every glow in the app
   * scales off this one number, so it is the single dial for
   * "more/less neon". 1.0 was pushing into neon territory; 0.6 keeps
   * the light without the halos shouting, and day halves it again.
   */
  glow: number
}

export const THEME_TOKENS: Record<Theme, ThemeTokens> = {
  night: {
    accents: {
      coral: '#FF7A5C',
      denim: '#6CA4CB',
      plum: '#C888BA',
      marigold: '#FFB84D',
      sage: '#8BC196',
    },
    paper: '#18120C',
    glow: 0.6,
  },
  day: {
    accents: {
      coral: '#E8624A',
      denim: '#3E6A89',
      plum: '#8A5C81',
      marigold: '#EF982E',
      sage: '#6E9175',
    },
    paper: '#FCF6EE',
    glow: 0.3,
  },
}

function channels(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

/** Trim float noise — 0.9 * 0.6 is not exactly 0.54 in binary. */
function tidy(alpha: number): number {
  return Math.round(alpha * 1e4) / 1e4
}

/** `#RRGGBB` + alpha → the `rgba()` string CSS and RN both accept. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = channels(hex)
  return `rgba(${r}, ${g}, ${b}, ${tidy(alpha)})`
}

/**
 * The JS equivalent of `color-mix(in srgb, hex <weight>%, other)`.
 * srgb mixing is a plain lerp of the gamma-encoded channels.
 */
export function mixSrgb(hex: string, weight: number, other: string): string {
  const a = channels(hex)
  const b = channels(other)
  const [r, g, bl] = a.map((v, i) => Math.round(v * weight + b[i] * (1 - weight)))
  return `rgb(${r}, ${g}, ${bl})`
}
