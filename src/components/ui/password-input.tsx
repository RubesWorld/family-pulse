'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface PasswordInputProps
  extends Omit<React.ComponentProps<'input'>, 'type'> {
  /**
   * Labels are props rather than dictionary lookups because the auth screens
   * render outside the (app) layout, where there is no I18nProvider — calling
   * useI18n() here would throw. Pass translations in once auth is localised.
   */
  showLabel?: string
  hideLabel?: string
}

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(function PasswordInput(
  { className, showLabel = 'Show password', hideLabel = 'Hide password', ...props },
  ref
) {
  const [visible, setVisible] = React.useState(false)
  const Icon = visible ? EyeOff : Eye

  return (
    <div className="relative">
      <Input
        {...props}
        ref={ref}
        type={visible ? 'text' : 'password'}
        // Room for the button so long passwords don't run underneath it.
        className={cn('pr-12', className)}
      />

      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        // Announce the action, not the state — a screen reader user needs to
        // know what pressing it does.
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        // Never a submit target, and skipped in tab order so the flow stays
        // email -> password -> submit.
        tabIndex={-1}
        className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-ink-faint transition-colors hover:bg-paper-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
      >
        <Icon className="h-[18px] w-[18px]" />
      </button>
    </div>
  )
})
