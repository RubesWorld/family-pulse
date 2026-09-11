export const THEME_STORAGE_KEY = 'fp-theme'

export type Theme = 'night' | 'day'
export type ThemePreference = Theme | 'system'

/**
 * Runs blocking in <head> before first paint.
 *
 * Night is the product default: when the user has expressed no
 * preference at all we stay on night rather than following the
 * system, so the app looks the way it was designed out of the box.
 * Only an explicit 'system' choice defers to the OS.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var p=localStorage.getItem('${THEME_STORAGE_KEY}');
var t=p==='day'||p==='night'?p:(p==='system'?(window.matchMedia('(prefers-color-scheme: light)').matches?'day':'night'):'night');
document.documentElement.setAttribute('data-theme',t);
}catch(e){document.documentElement.setAttribute('data-theme','night')}})()`

/** Resolve a stored preference to the theme that should be applied. */
export function resolveTheme(pref: ThemePreference): Theme {
  if (pref === 'system') {
    if (typeof window === 'undefined') return 'night'
    return window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'day'
      : 'night'
  }
  return pref
}
