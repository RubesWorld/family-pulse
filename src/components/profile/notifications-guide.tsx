'use client'

import { useEffect, useState } from 'react'
import { EnablePushCard } from '@/components/notifications/enable-push-card'
import { InstallSteps } from '@/components/notifications/install-instructions'
import { useInstallState } from '@/lib/pwa'
import { Smartphone, Info, ChevronDown, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/i18n-provider'
import { cn } from '@/lib/utils'

export function NotificationsGuide() {
  const [showPWAGuide, setShowPWAGuide] = useState(false)
  const installState = useInstallState()
  const { dict } = useI18n()

  // Open the install section by default for anyone not already running the
  // installed app. On iOS it isn't optional — push doesn't work without it —
  // and leaving it collapsed hides that from the people who most need it.
  useEffect(() => {
    if (installState && installState !== 'standalone') {
      setShowPWAGuide(true)
    }
  }, [installState])

  const isInstalled = installState === 'standalone'

  return (
    <div className="space-y-3.5">
      {/* Enable Push Notifications — renders install steps instead on iOS
          when the app is still running in a browser tab. */}
      <EnablePushCard variant="inline" />

      <div className="rounded-panel border border-denim/30 bg-denim/[0.12] p-3">
        <div className="flex items-start gap-2.5">
          <Info className="mt-0.5 h-4 w-4 flex-none text-denim" />
          <div>
            <p className="text-[13px] font-extrabold text-ink">
              {dict.notify.bestResults}
            </p>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-[12px] font-medium text-ink-soft">
              <li>{dict.notify.tipAllow}</li>
              <li>{dict.notify.tipInstall}</li>
              <li>{dict.notify.tipClosed}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* PWA Guide - Collapsible, auto-opened when not yet installed */}
      <div className="overflow-hidden rounded-panel border border-edge">
        <button
          type="button"
          onClick={() => setShowPWAGuide(!showPWAGuide)}
          aria-expanded={showPWAGuide}
          className="flex w-full items-center justify-between gap-2 p-3 text-left transition-colors hover:bg-paper-2"
        >
          <span className="flex items-center gap-2">
            {isInstalled ? (
              <CheckCircle2 className="h-4 w-4 flex-none text-sage" />
            ) : (
              <Smartphone className="h-4 w-4 flex-none text-marigold" />
            )}
            <span className="text-[13px] font-extrabold text-ink">
              {isInstalled ? dict.notify.installedAsApp : dict.notify.installPrompt}
            </span>
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 flex-none text-ink-faint transition-transform',
              showPWAGuide && 'rotate-180'
            )}
          />
        </button>

        {showPWAGuide && (
          <div className="space-y-3.5 border-t border-edge bg-paper-2 p-4">
            {isInstalled ? (
              <p className="text-[13px] font-medium leading-relaxed text-ink-soft">
{dict.notify.installedHint}
              </p>
            ) : (
              <>
                <p className="text-[13px] font-medium text-ink-soft">
                  {dict.notify.installBenefits}
                </p>
                <ul className="ml-1 list-inside list-disc space-y-1 text-[13px] font-medium text-ink-soft">
                  <li>{dict.notify.benefitIcon}</li>
                  <li>{dict.notify.benefitFullscreen}</li>
                  <li>{dict.notify.benefitReliable}</li>
                  <li>{dict.notify.benefitFaster}</li>
                </ul>
              </>
            )}

            <InstallSteps platform="ios" />
            <InstallSteps platform="android" />
            <InstallSteps platform="desktop" />

            <div className="space-y-2 rounded-panel border border-marigold/30 bg-marigold/[0.12] p-3">
              <p className="text-[12px] font-medium leading-relaxed text-ink-soft">
{dict.notify.iosWarning}
              </p>
              <p className="text-[12px] font-medium leading-relaxed text-ink-soft">
{dict.notify.iosLoginWarning}
              </p>
            </div>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => (window.location.href = '/settings/notifications')}
        className="w-full"
      >
        {dict.notify.managePreferences} →
      </Button>
    </div>
  )
}
