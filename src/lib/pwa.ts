'use client'

import { useEffect, useState } from 'react'

/**
 * How the app is currently being viewed.
 *
 * This matters because iOS only delivers web push to apps added to the Home
 * Screen. In a Safari tab the push APIs may look available, but subscribing
 * won't work — so those users need install instructions, not an Enable button
 * that is guaranteed to fail.
 */
export type InstallState =
  | 'standalone' // launched from the Home Screen — push can work
  | 'ios-browser' // iOS browser tab — must install before push will work
  | 'browser' // everything else — push works directly from the browser

/** True when running as an installed app rather than a browser tab. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false

  // iOS exposes a non-standard navigator.standalone rather than display-mode.
  const nav = window.navigator as Navigator & { standalone?: boolean }
  if (nav.standalone === true) return true

  return window.matchMedia('(display-mode: standalone)').matches
}

/** True on iPhone, iPod, and iPad — including iPadOS, which reports as a Mac. */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false

  const ua = window.navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return true

  // iPadOS 13+ claims to be a Macintosh; touch points give it away.
  return /Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1
}

export function getInstallState(): InstallState {
  if (isStandalone()) return 'standalone'
  return isIOS() ? 'ios-browser' : 'browser'
}

/**
 * Install state, resolved after mount.
 *
 * Returns null on the first render — none of this is knowable on the server,
 * and rendering a guess would cause a hydration mismatch.
 */
export function useInstallState(): InstallState | null {
  const [state, setState] = useState<InstallState | null>(null)

  useEffect(() => {
    setState(getInstallState())
  }, [])

  return state
}
