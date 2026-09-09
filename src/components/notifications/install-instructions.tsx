'use client'

import { Smartphone } from 'lucide-react'

export type InstallPlatform = 'ios' | 'android' | 'desktop'

const STEPS: Record<InstallPlatform, { label: string; steps: string[] }> = {
  ios: {
    label: 'iPhone / iPad (Safari)',
    steps: [
      'Tap the Share button — the square with an arrow pointing up',
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" in the top right',
      'Open Family Pulse from your Home Screen',
      'Sign in again — the installed app has its own separate login',
      'Enable notifications from your Profile',
    ],
  },
  android: {
    label: 'Android (Chrome)',
    steps: [
      'Tap the menu (three dots) in the top right',
      'Tap "Install app" or "Add to Home screen"',
      'Tap "Install"',
      'Open Family Pulse from your home screen',
      'Enable notifications when prompted',
    ],
  },
  desktop: {
    label: 'Desktop (Chrome / Edge)',
    steps: [
      'Look for the install icon in the address bar',
      'Click "Install"',
      'The app opens in its own window',
      'Enable notifications when prompted',
    ],
  },
}

/** The ordered install steps for one platform. */
export function InstallSteps({ platform }: { platform: InstallPlatform }) {
  const { label, steps } = STEPS[platform]

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
        {label}
      </p>
      <ol className="text-xs text-gray-700 space-y-1.5 list-decimal list-inside ml-2">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  )
}

/**
 * Shown to iOS users who are still in a browser tab.
 *
 * Replaces the Enable button rather than sitting next to it: on iOS, push
 * cannot be enabled from a tab at all, so offering the button would only
 * produce a failure with no explanation.
 */
export function IosInstallPrompt() {
  return (
    <div className="rounded-lg p-4 border border-amber-200 bg-amber-50">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900">
            Add Family Pulse to your Home Screen first
          </p>
          <p className="text-xs text-amber-800 mt-1">
            On iPhone and iPad, notifications only work once the app is installed.
            They can&apos;t be turned on from a Safari tab.
          </p>

          <div className="mt-3 rounded border border-amber-200 bg-white p-3">
            <InstallSteps platform="ios" />
          </div>

          <p className="text-xs text-amber-800 mt-3">
            Already added it? Make sure you opened Family Pulse from the Home Screen
            icon rather than from Safari.
          </p>
        </div>
      </div>
    </div>
  )
}
