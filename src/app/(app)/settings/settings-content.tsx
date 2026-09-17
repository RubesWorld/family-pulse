'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bell, ChevronRight, Copy, Check, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { useI18n } from '@/components/i18n-provider'

interface SettingsContentProps {
  familyName: string
  inviteCode: string
}

/**
 * Everything that is a preference rather than something about you.
 *
 * These used to sit underneath your bio and interests in Profile, which made
 * that screen two unrelated things in one tab — a page about a person, and a
 * settings drawer.
 */
export function SettingsContent({
  familyName,
  inviteCode,
}: SettingsContentProps) {
  const { dict } = useI18n()
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const copyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/join/${inviteCode}`
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = inviteUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="px-5 pt-12">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="-ml-3"
        >
          <ArrowLeft className="h-4 w-4" />
          {dict.common.back}
        </Button>
      </div>

      <header className="px-5 pb-1 pt-3">
        <h1 className="font-display text-[30px] font-black leading-[1.06] tracking-tight text-ink">
          {dict.settings.title}
        </h1>
        <svg
          aria-hidden
          viewBox="0 0 132 9"
          fill="none"
          className="mt-0.5 block h-2 w-24 text-marigold"
          style={{
            filter: 'drop-shadow(0 0 8px hsl(var(--marigold) / var(--glow)))',
          }}
        >
          <path
            d="M2 6.2c22-4.4 44-5.2 66-3.1 21 2 42 2.4 63-.6"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </header>

      <div className="mt-5 flex flex-col gap-3 px-5">
        <section className="rounded-card border-card border-edge bg-card p-4 shadow-card backdrop-blur-card">
          <div className="mb-2.5 font-display text-[17px] font-bold text-ink">
            {dict.settings.appearance}
          </div>
          <ThemeToggle />

          <div className="mb-2.5 mt-4 font-display text-[17px] font-bold text-ink">
            {dict.settings.language}
          </div>
          <LanguageToggle />
        </section>

        <Link
          href="/settings/notifications"
          className="flex items-center gap-3 rounded-card border-card border-edge bg-card p-4 shadow-card backdrop-blur-card transition-transform active:scale-[0.99]"
        >
          <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-paper-2">
            <Bell className="h-4 w-4 text-marigold" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[17px] font-bold leading-tight text-ink">
              {dict.settings.notifications}
            </span>
            <span className="mt-0.5 block text-[12px] font-bold text-ink-faint">
              {dict.settings.notificationsHint}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 flex-none text-ink-faint" />
        </Link>

        <section className="rounded-card border-card border-edge bg-card p-4 shadow-card backdrop-blur-card">
          <div className="font-display text-[17px] font-bold text-ink">
            {familyName}
          </div>
          <p className="mt-0.5 text-[12px] font-bold text-ink-faint">
            {dict.settings.familyHint}
          </p>
          <Button variant="outline" onClick={copyInviteLink} className="mt-3 w-full">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                {dict.settings.inviteCopied}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                {dict.settings.copyInvite}
              </>
            )}
          </Button>
        </section>

        <Button
          variant="ghost"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? dict.settings.loggingOut : dict.settings.logOut}
        </Button>
      </div>
    </div>
  )
}
