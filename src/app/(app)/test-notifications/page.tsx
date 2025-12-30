'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EnablePushCard } from '@/components/notifications/enable-push-card'
import { Loader2, Send } from 'lucide-react'

export default function TestNotificationsPage() {
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(
    null
  )

  const handleSendTest = async () => {
    setIsSending(true)
    setResult(null)

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message || 'Test notification sent!' })
      } else {
        setResult({ success: false, error: data.error || 'Failed to send notification' })
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      setResult({ success: false, error: 'Network error' })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-20">
      <div className="max-w-2xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Test Push Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enable and test push notifications during development
          </p>
        </div>

        <div className="space-y-6">
          {/* Enable Push Card */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Step 1: Enable Push Notifications</h2>
            <EnablePushCard variant="card" />
          </div>

          {/* Send Test Notification */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Step 2: Send Test Notification
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Click the button below to send a test notification to yourself. Make sure you&apos;ve enabled
              push notifications first.
            </p>

            <Button
              onClick={handleSendTest}
              disabled={isSending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Notification
                </>
              )}
            </Button>

            {result && (
              <div
                className={`mt-4 p-3 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {result.success ? '✓ ' + result.message : '✗ ' + result.error}
                </p>
              </div>
            )}
          </div>

          {/* Debugging Info */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Debugging Information</h2>
            <div className="space-y-2 text-xs font-mono">
              <div>
                <span className="text-gray-500">Push Supported:</span>{' '}
                <span className="text-gray-900">
                  {typeof window !== 'undefined' &&
                  'serviceWorker' in navigator &&
                  'PushManager' in window
                    ? '✓ Yes'
                    : '✗ No'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Notification Permission:</span>{' '}
                <span className="text-gray-900">
                  {typeof window !== 'undefined' && 'Notification' in window
                    ? Notification.permission
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Service Worker:</span>{' '}
                <span className="text-gray-900">
                  {typeof window !== 'undefined' && 'serviceWorker' in navigator
                    ? navigator.serviceWorker.controller
                      ? '✓ Active'
                      : '⚠ Not Active'
                    : '✗ Not Supported'}
                </span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h2 className="text-sm font-semibold text-blue-900 mb-3">Testing Instructions</h2>
            <ol className="text-xs text-blue-800 space-y-2 list-decimal list-inside">
              <li>Make sure you&apos;ve run the notification migration in your database</li>
              <li>Click &quot;Enable Notifications&quot; above to grant browser permission</li>
              <li>Check that the service worker is active (debugging info above)</li>
              <li>Click &quot;Send Test Notification&quot; to trigger a test push</li>
              <li>You should see a notification appear on your device</li>
              <li>Try testing on both desktop and mobile browsers</li>
              <li>
                Check the browser console and network tab for any errors
              </li>
            </ol>
          </div>

          {/* Environment Variables */}
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
            <h2 className="text-sm font-semibold text-yellow-900 mb-3">
              Required Environment Variables
            </h2>
            <div className="text-xs text-yellow-800 space-y-1 font-mono">
              <div>✓ NEXT_PUBLIC_VAPID_PUBLIC_KEY</div>
              <div>✓ VAPID_PRIVATE_KEY</div>
              <div>⚠ SUPABASE_SERVICE_ROLE_KEY (update in .env.local)</div>
              <div>⚠ INTERNAL_API_SECRET (update in .env.local)</div>
              <div>⚠ CRON_SECRET (update in .env.local)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
