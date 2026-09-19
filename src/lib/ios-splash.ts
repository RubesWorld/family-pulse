/**
 * iOS launch images (`apple-touch-startup-image`).
 *
 * Without one of these, launching from the Home Screen icon shows a blank
 * screen until first paint — and because layout.tsx sets the status bar to
 * `black-translucent`, that blank is the browser default white rather than the
 * app's paper colour. So the flash is bright, on every cold launch.
 *
 * Two things make this tedious rather than hard:
 *
 * 1. iOS only uses a startup image whose pixel dimensions match the device
 *    screen *exactly*. There is no scaling and no nearest-size fallback — a
 *    missing entry silently means no splash at all. Hence one entry per
 *    distinct screen geometry, keyed by geometry rather than by model, since
 *    many models share one.
 * 2. `next/font`'s Metadata API has no field for this link type, so the tags
 *    are rendered by hand in the <head> of src/app/layout.tsx.
 *
 * The images themselves are icon-512.png centred on the theme paper colour.
 * They are committed, not built — regenerate with ImageMagick after changing
 * the icon or a paper colour, sizing the icon to 42% of the screen's short
 * edge and never upscaling past the source's 512px:
 *
 *   magick -size ${w}x${h} xc:$bg \
 *     \( public/icon-512.png -resize ${icon}x${icon} \) \
 *     -gravity center -composite -strip \
 *     public/splash/splash-${w}x${h}-${theme}.png
 *
 * Keep them truecolor: palette-quantising the flat background is tempting for
 * file size but visibly dithers the icon's gradient.
 */

/** Paper colours these are generated against — kept in sync with the viewport themeColor in src/app/layout.tsx. */
export const SPLASH_BACKGROUND = {
  dark: '#17110C',
  light: '#FDF6EC',
} as const

interface SplashTarget {
  /** Logical CSS width in portrait. */
  width: number
  /** Logical CSS height in portrait. */
  height: number
  /** devicePixelRatio — the only thing separating some same-size devices. */
  ratio: number
  /** Models with this exact geometry, for whoever has to extend this list. */
  devices: string
}

/**
 * Every iPhone geometry Apple still ships or supports a current iOS on.
 *
 * Note the 414x896 pair: iPhone XR/11 and iPhone XS Max/11 Pro Max are the
 * same logical size and are told apart only by ratio, which is why the media
 * queries below always include -webkit-device-pixel-ratio.
 *
 * iPad is deliberately absent — nobody in this family uses one, and each added
 * geometry is four more files in the repo.
 */
const SPLASH_TARGETS: readonly SplashTarget[] = [
  { width: 375, height: 667, ratio: 2, devices: 'iPhone SE (2nd/3rd gen), 8, 7, 6s' },
  { width: 414, height: 736, ratio: 3, devices: 'iPhone 8 Plus, 7 Plus, 6s Plus' },
  { width: 375, height: 812, ratio: 3, devices: 'iPhone X, XS, 11 Pro' },
  { width: 414, height: 896, ratio: 2, devices: 'iPhone XR, 11' },
  { width: 414, height: 896, ratio: 3, devices: 'iPhone XS Max, 11 Pro Max' },
  { width: 360, height: 780, ratio: 3, devices: 'iPhone 12 mini, 13 mini' },
  { width: 390, height: 844, ratio: 3, devices: 'iPhone 12, 12 Pro, 13, 13 Pro, 14, 16e' },
  { width: 428, height: 926, ratio: 3, devices: 'iPhone 12 Pro Max, 13 Pro Max, 14 Plus' },
  { width: 393, height: 852, ratio: 3, devices: 'iPhone 14 Pro, 15, 15 Pro, 16' },
  { width: 430, height: 932, ratio: 3, devices: 'iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus' },
  { width: 402, height: 874, ratio: 3, devices: 'iPhone 16 Pro, 17, 17 Pro' },
  { width: 440, height: 956, ratio: 3, devices: 'iPhone 16 Pro Max, 17 Pro Max' },
  { width: 420, height: 912, ratio: 3, devices: 'iPhone Air' },
]

export interface SplashLink {
  /** Value for the link's media attribute. */
  media: string
  /** Path under public/splash/. */
  href: string
}

/**
 * One link per geometry x orientation x theme.
 *
 * device-width/device-height stay at their portrait values in both
 * orientations — Safari reports them unrotated, so `orientation` is what
 * actually selects between the two images.
 */
export function splashLinks(): SplashLink[] {
  const links: SplashLink[] = []

  for (const { width, height, ratio } of SPLASH_TARGETS) {
    const screen = `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio})`
    const portrait = `${width * ratio}x${height * ratio}`
    const landscape = `${height * ratio}x${width * ratio}`

    for (const theme of ['dark', 'light'] as const) {
      const scheme = `(prefers-color-scheme: ${theme})`
      links.push({
        media: `${scheme} and ${screen} and (orientation: portrait)`,
        href: `/splash/splash-${portrait}-${theme}.png`,
      })
      links.push({
        media: `${scheme} and ${screen} and (orientation: landscape)`,
        href: `/splash/splash-${landscape}-${theme}.png`,
      })
    }
  }

  return links
}
