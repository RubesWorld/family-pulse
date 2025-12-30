'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnablePushCard } from '@/components/notifications/enable-push-card'
import { Bell, Smartphone, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotificationsGuide() {
  const [showPWAGuide, setShowPWAGuide] = useState(false)

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
        {/* Enable Push Notifications */}
        <EnablePushCard variant="inline" />

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">
                For best results
              </p>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>Allow notifications when prompted by your browser</li>
                <li>Keep this tab open or install as an app (see below)</li>
                <li>Notifications work even when the app isn&apos;t actively open</li>
              </ul>
            </div>
          </div>
        </div>

        {/* PWA Guide - Collapsible */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowPWAGuide(!showPWAGuide)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-900">
                Install as App (Recommended)
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
              <p className="text-sm text-gray-700">
                Installing Family Pulse as an app gives you:
              </p>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside ml-2">
                <li>A home screen icon for quick access</li>
                <li>Full-screen experience (no browser UI)</li>
                <li>Reliable notifications even when browser is closed</li>
                <li>Faster loading and offline support</li>
              </ul>

              {/* iPhone Instructions */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                  iPhone / iPad (Safari)
                </p>
                <ol className="text-xs text-gray-700 space-y-1.5 list-decimal list-inside ml-2">
                  <li>Tap the Share button (square with arrow pointing up)</li>
                  <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
                  <li>Tap &quot;Add&quot; in the top right</li>
                  <li>Open the app from your home screen</li>
                  <li>Enable notifications when prompted</li>
                </ol>
              </div>

              {/* Android Instructions */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                  Android (Chrome)
                </p>
                <ol className="text-xs text-gray-700 space-y-1.5 list-decimal list-inside ml-2">
                  <li>Tap the menu (three dots) in the top right</li>
                  <li>Tap &quot;Install app&quot; or &quot;Add to Home screen&quot;</li>
                  <li>Tap &quot;Install&quot;</li>
                  <li>Open the app from your home screen</li>
                  <li>Enable notifications when prompted</li>
                </ol>
              </div>

              {/* Desktop Instructions */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                  Desktop (Chrome / Edge)
                </p>
                <ol className="text-xs text-gray-700 space-y-1.5 list-decimal list-inside ml-2">
                  <li>Look for the install icon in the address bar (computer with arrow)</li>
                  <li>Click &quot;Install&quot;</li>
                  <li>The app will open in its own window</li>
                  <li>Enable notifications when prompted</li>
                </ol>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded p-3 mt-3">
                <p className="text-xs text-purple-900">
                  <span className="font-semibold">Note:</span> On iOS, notifications only work when installed as an app to the home screen. Browser notifications are not supported.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Manage Settings Link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/settings/notifications'}
          className="w-full text-sm text-gray-600 hover:text-gray-900"
        >
          Manage notification preferences →
        </Button>
      </CardContent>
    </Card>
  )
}
