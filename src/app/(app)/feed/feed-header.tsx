'use client'

import { useState } from 'react'
import { Share2, Check, List, Calendar, Activity, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FeedFilter = 'all' | 'activities' | 'picks'

interface FeedHeaderProps {
  familyName: string
  inviteCode: string
  view: 'feed' | 'calendar'
  onViewChange: (view: 'feed' | 'calendar') => void
  filter: FeedFilter
  onFilterChange: (filter: FeedFilter) => void
}

const FILTERS: { id: FeedFilter; label: string; icon?: typeof Activity }[] = [
  { id: 'all', label: 'All' },
  { id: 'activities', label: 'Activities', icon: Activity },
  { id: 'picks', label: 'Picks', icon: Heart },
]

export function FeedHeader({
  familyName,
  inviteCode,
  view,
  onViewChange,
  filter,
  onFilterChange,
}: FeedHeaderProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    const inviteUrl = `${window.location.origin}/join/${inviteCode}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${familyName} on Family Pulse`,
          text: `Join our family on Family Pulse to see what everyone is up to!`,
          url: inviteUrl,
        })
      } catch {
        // User cancelled or share failed, fall back to copy
        copyToClipboard(inviteUrl)
      }
    } else {
      copyToClipboard(inviteUrl)
    }
  }

  return (
    <header className="relative px-5 pb-1 pt-14">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-marigold/90">
        Family Pulse
      </div>

      <h1 className="mt-1 font-display text-[30px] font-black leading-[1.06] tracking-tight text-ink">
        {familyName}
      </h1>

      {/* hand-drawn swash under the family name */}
      <svg
        aria-hidden
        viewBox="0 0 132 9"
        fill="none"
        className="mt-0.5 block h-2 w-32 text-marigold"
        style={{ filter: 'drop-shadow(0 0 8px hsl(var(--marigold) / var(--glow)))' }}
      >
        <path
          d="M2 6.2c22-4.4 44-5.2 66-3.1 21 2 42 2.4 63-.6"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>

      <button
        type="button"
        onClick={handleShare}
        className="absolute right-5 top-[3.4rem] inline-flex items-center gap-1.5 rounded-full border-card border-edge bg-card px-3.5 py-2 text-[13px] font-extrabold text-ink backdrop-blur-card transition-transform active:scale-95"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Copied!
          </>
        ) : (
          <>
            <Share2 className="h-3.5 w-3.5" />
            Invite
          </>
        )}
      </button>

      {/* view switch */}
      <div className="mt-4 flex gap-2">
        {(['feed', 'calendar'] as const).map((v) => {
          const active = view === v
          const Icon = v === 'feed' ? List : Calendar
          return (
            <button
              key={v}
              type="button"
              onClick={() => onViewChange(v)}
              aria-pressed={active}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-[13.5px] font-extrabold capitalize transition-all',
                active
                  ? 'bg-gradient-to-br from-coral to-marigold text-on-ink shadow-[0_6px_22px_-5px_hsl(var(--coral)/calc(0.85*var(--glow)))]'
                  : 'border-card border-edge bg-card text-ink-soft backdrop-blur-card'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {v}
            </button>
          )
        })}
      </div>

      {/* filters, feed view only */}
      {view === 'feed' && (
        <div className="mt-2.5 flex gap-1.5">
          {FILTERS.map(({ id, label, icon: Icon }) => {
            const active = filter === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onFilterChange(id)}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-extrabold transition-all',
                  active
                    ? 'border-[1.5px] border-solid border-marigold bg-marigold/[0.18] text-marigold'
                    : 'border-[1.5px] border-dashed border-edge text-ink-soft'
                )}
                style={
                  active
                    ? {
                        boxShadow:
                          '0 5px 20px -5px hsl(var(--marigold) / calc(0.75 * var(--glow)))',
                      }
                    : undefined
                }
              >
                {Icon ? <Icon className="h-3 w-3" /> : null}
                {label}
              </button>
            )
          })}
        </div>
      )}
    </header>
  )
}
