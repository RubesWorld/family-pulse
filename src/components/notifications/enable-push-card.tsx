'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/i18n-provider'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import {
  enablePushNotifications,
  disablePushNotifications,
  isPushSupported,
  getCurrentSubscription,
} from '@/lib/push'
import { useInstallState } from '@/lib/pwa'
import { IosInstallPrompt } from '@/components/notifications/install-instructions'

interface EnablePushCardProps {
  variant?: 'card' | 'inline'
}

export function EnablePushCard({ variant = 'card' }: EnablePushCardProps) {
  const { dict } = useI18n()
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [ready, setReady] = useState(false)
  const installState = useInstallState()

  useEffect(() => {
    const checkStatus = async () => {
      const supported = isPushSupported()
      setIsSupported(supported)

      if (supported) {
        setPermission(Notification.permission)
      }

      // Mark ready before awaiting the subscription lookup below.
      // getCurrentSubscription() waits on navigator.serviceWorker.ready, which
      // never resolves until a worker has been registered — i.e. exactly the
      // first-run case. Gating render on it would leave this card blank.
      setReady(true)

      if (supported) {
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

  // None of this is knowable on the server. Render nothing until the client
  // has resolved it, rather than flashing a state that's about to change.
  if (!ready || installState === null) {
    return null
  }

  // On iOS, push can't be subscribed to from a browser tab at all. Show the
  // install path instead of an Enable button that would fail with a generic
  // error and leave the user with no idea why.
  if (installState === 'ios-browser') {
    return <IosInstallPrompt />
  }

  if (!isSupported) {
    return (
      <div className="rounded-panel border border-edge bg-paper-2 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-card">
            <BellOff className="h-5 w-5 text-ink-faint" />
          </div>
          <div className="flex-1">
            <p className="text-[13.5px] font-extrabold text-ink">
              {dict.notify.notSupported}
            </p>
            <p className="mt-1 text-[12px] font-medium text-ink-soft">
              {dict.notify.notSupportedHint}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="rounded-panel border border-destructive/40 bg-destructive/10 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-destructive/15">
            <BellOff className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-[13.5px] font-extrabold text-ink">
              {dict.notify.blocked}
            </p>
            <p className="mt-1 text-[12px] font-medium text-ink-soft">
              {dict.notify.blockedHint}
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
          <div className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${
            isSubscribed ? 'bg-sage/20' : 'bg-marigold/20'
          }`}>
            <Bell className={`h-5 w-5 ${isSubscribed ? 'text-sage' : 'text-marigold'}`} />
          </div>
          <div>
            <p className="text-[13.5px] font-extrabold text-ink">
              {dict.notify.pushTitle}
            </p>
            <p className="text-[12px] font-medium text-ink-soft">
              {isSubscribed ? dict.notify.pushOn : dict.notify.pushOffHint}
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
              {isSubscribed ? dict.notify.disabling : dict.notify.enabling}
            </>
          ) : (
            <>
              {isSubscribed ? dict.notify.disable : dict.notify.enable}
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className={`rounded-panel border p-4 ${
      isSubscribed
        ? 'border-sage/40 bg-sage/[0.12]'
        : 'border-marigold/40 bg-marigold/[0.12]'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-12 w-12 flex-none place-items-center rounded-xl ${
          isSubscribed ? 'bg-sage/20' : 'bg-marigold/20'
        }`}>
          <Bell className={`h-6 w-6 ${isSubscribed ? 'text-sage' : 'text-marigold'}`} />
        </div>
        <div className="flex-1">
          <p className="text-[13.5px] font-extrabold text-ink">
            {isSubscribed ? dict.notify.enabledTitle : dict.notify.disabledTitle}
          </p>
          <p className="mt-1 text-[12px] font-medium leading-relaxed text-ink-soft">
            {isSubscribed ? dict.notify.enabledHint : dict.notify.disabledHint}
          </p>

          {error && (
            <p className="mt-2 text-[12px] font-bold text-destructive">{error}</p>
          )}

          <div className="mt-3">
            <Button
              onClick={isSubscribed ? handleDisable : handleEnable}
              disabled={isLoading}
              variant={isSubscribed ? 'outline' : 'default'}
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSubscribed ? dict.notify.disabling : dict.notify.enabling}
                </>
              ) : (
                <>
                  {isSubscribed ? (
                    <>
                      <BellOff className="w-4 h-4 mr-2" />
                      {dict.notify.disable}
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 mr-2" />
                      {dict.notify.enable}
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
