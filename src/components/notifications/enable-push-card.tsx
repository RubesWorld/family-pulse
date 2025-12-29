'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import {
  enablePushNotifications,
  disablePushNotifications,
  isPushSupported,
  getCurrentSubscription,
} from '@/lib/push'

interface EnablePushCardProps {
  variant?: 'card' | 'inline'
}

export function EnablePushCard({ variant = 'card' }: EnablePushCardProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    const checkStatus = async () => {
      const supported = isPushSupported()
      setIsSupported(supported)

      if (supported) {
        const currentPermission = Notification.permission
        setPermission(currentPermission)

        const subscription = await getCurrentSubscription()
        setIsSubscribed(!!subscription)
      }
    }

    checkStatus()
  }, [])

  const handleEnable = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const success = await enablePushNotifications()

      if (success) {
        setIsSubscribed(true)
        setPermission('granted')
      } else {
        setError('Failed to enable push notifications')
      }
    } catch (err) {
      console.error('Error enabling push notifications:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisable = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const success = await disablePushNotifications()

      if (success) {
        setIsSubscribed(false)
      } else {
        setError('Failed to disable push notifications')
      }
    } catch (err) {
      console.error('Error disabling push notifications:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <BellOff className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Push notifications not supported
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Your browser doesn't support push notifications
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <BellOff className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">
              Notifications blocked
            </p>
            <p className="text-xs text-red-700 mt-1">
              You've blocked notifications. Please enable them in your browser settings.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isSubscribed
              ? 'bg-green-100'
              : 'bg-gradient-to-br from-purple-100 to-pink-100'
          }`}>
            <Bell className={`w-5 h-5 ${isSubscribed ? 'text-green-600' : 'text-purple-600'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Push Notifications
            </p>
            <p className="text-xs text-gray-500">
              {isSubscribed ? 'Enabled' : 'Get notified of important updates'}
            </p>
          </div>
        </div>
        <Button
          onClick={isSubscribed ? handleDisable : handleEnable}
          disabled={isLoading}
          variant={isSubscribed ? 'outline' : 'default'}
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isSubscribed ? 'Disabling...' : 'Enabling...'}
            </>
          ) : (
            <>
              {isSubscribed ? 'Disable' : 'Enable'}
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className={`rounded-lg p-4 border ${
      isSubscribed
        ? 'bg-green-50 border-green-200'
        : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isSubscribed
            ? 'bg-green-100'
            : 'bg-gradient-to-br from-purple-100 to-pink-100'
        }`}>
          <Bell className={`w-6 h-6 ${isSubscribed ? 'text-green-600' : 'text-purple-600'}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {isSubscribed ? 'Push Notifications Enabled' : 'Enable Push Notifications'}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {isSubscribed
              ? 'You\'ll receive notifications for important family updates'
              : 'Stay updated when it\'s your turn to ask a question, when family members answer, and more'
            }
          </p>

          {error && (
            <p className="text-xs text-red-600 mt-2">{error}</p>
          )}

          <div className="mt-3">
            <Button
              onClick={isSubscribed ? handleDisable : handleEnable}
              disabled={isLoading}
              variant={isSubscribed ? 'outline' : 'default'}
              size="sm"
              className={isSubscribed ? '' : 'bg-purple-600 hover:bg-purple-700'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSubscribed ? 'Disabling...' : 'Enabling...'}
                </>
              ) : (
                <>
                  {isSubscribed ? (
                    <>
                      <BellOff className="w-4 h-4 mr-2" />
                      Disable Notifications
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 mr-2" />
                      Enable Notifications
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
