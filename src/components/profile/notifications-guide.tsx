'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnablePushCard } from '@/components/notifications/enable-push-card'
import { InstallSteps } from '@/components/notifications/install-instructions'
import { useInstallState } from '@/lib/pwa'
import { Bell, Smartphone, Info, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotificationsGuide() {
  const [showPWAGuide, setShowPWAGuide] = useState(false)
  const installState = useInstallState()

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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-purple-600" />
          <CardTitle>Notifications</CardTitle>
        </div>
        <CardDescription>Stay updated with family activity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable Push Notifications — renders install steps instead on iOS
            when the app is still running in a browser tab. */}
        <EnablePushCard variant="inline" />

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">For best results</p>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>Allow notifications when prompted</li>
                <li>
                  Install Family Pulse to your home screen — required on iPhone
                  and iPad, recommended everywhere else
                </li>
                <li>
                  Once installed, notifications arrive even when the app is closed
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* PWA Guide - Collapsible, auto-opened when not yet installed */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowPWAGuide(!showPWAGuide)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {isInstalled ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Smartphone className="w-5 h-5 text-purple-600" />
              )}
              <span className="text-sm font-medium text-gray-900">
                {isInstalled ? 'Installed as an app' : 'Install as App (Recommended)'}
              </span>
            </div>
            {showPWAGuide ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {showPWAGuide && (
            <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
              {isInstalled ? (
                <p className="text-sm text-gray-700">
                  You&apos;re running the installed app, so notifications can be
                  delivered even when it&apos;s closed. Nothing else to do here.
                </p>
              ) : (
                <>
                  <p className="text-sm text-gray-700">
                    Installing Family Pulse as an app gives you:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside ml-2">
                    <li>A home screen icon for quick access</li>
                    <li>Full-screen experience (no browser UI)</li>
                    <li>Reliable notifications even when the browser is closed</li>
                    <li>Faster loading</li>
                  </ul>
                </>
              )}

              <InstallSteps platform="ios" />
              <InstallSteps platform="android" />
              <InstallSteps platform="desktop" />

              <div className="bg-purple-50 border border-purple-200 rounded p-3 mt-3 space-y-2">
                <p className="text-xs text-purple-900">
                  <span className="font-semibold">iPhone / iPad:</span> notifications
                  only work from the installed app. Turning them on in a Safari tab
                  will not work, no matter what the tab says.
                </p>
                <p className="text-xs text-purple-900">
                  <span className="font-semibold">Heads up:</span> the installed app
                  has its own separate login, so you&apos;ll be asked to sign in once
                  more the first time you open it. Your account and data are unchanged.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Manage Settings Link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (window.location.href = '/settings/notifications')}
          className="w-full text-sm text-gray-600 hover:text-gray-900"
        >
          Manage notification preferences →
        </Button>
      </CardContent>
    </Card>
  )
}
