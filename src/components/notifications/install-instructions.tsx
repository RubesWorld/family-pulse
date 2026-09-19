'use client'

import { useI18n } from '@/components/i18n-provider'

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
  const { dict } = useI18n()
  const { steps } = STEPS[platform]
  const label = {
    ios: dict.notify.iosLabel,
    android: dict.notify.androidLabel,
    desktop: dict.notify.desktopLabel,
  }[platform]

  return (
    <div className="space-y-2">
      <p className="text-[10.5px] font-extrabold uppercase tracking-[0.11em] text-ink-faint">
        {label}
      </p>
      <ol className="ml-1 list-inside list-decimal space-y-1.5 text-[12.5px] font-medium text-ink-soft">
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
  const { dict } = useI18n()

  return (
    <div className="rounded-panel border border-marigold/40 bg-marigold/[0.12] p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-marigold/20">
          <Smartphone className="h-5 w-5 text-marigold" />
        </div>
        <div className="flex-1">
          <p className="text-[13.5px] font-extrabold text-ink">
            {dict.notify.addFirst}
          </p>
          <p className="mt-1 text-[12px] font-medium leading-relaxed text-ink-soft">
{dict.notify.addFirstHint}
          </p>

          <div className="mt-3 rounded-panel border border-edge bg-card p-3">
            <InstallSteps platform="ios" />
          </div>

          <p className="mt-3 text-[12px] font-medium leading-relaxed text-ink-soft">
{dict.notify.alreadyAdded}
          </p>
        </div>
      </div>
    </div>
  )
}
