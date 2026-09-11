'use client'

import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  title: string
  emoji?: string
  /** Shown in the closed header so the page stays scannable unexpanded. */
  summary?: string
  defaultOpen?: boolean
  /** Forces open regardless of local state — used while a section is being edited. */
  forceOpen?: boolean
  action?: React.ReactNode
  children: React.ReactNode
}

export function CollapsibleSection({
  title,
  emoji,
  summary,
  defaultOpen = false,
  forceOpen = false,
  action,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()
  const isOpen = forceOpen || open

  return (
    <section className="overflow-hidden rounded-card border-card border-edge bg-card shadow-card backdrop-blur-card">
      <div className="flex items-center gap-2 pr-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="flex flex-1 items-center gap-3 p-4 text-left"
        >
          {emoji && (
            <span
              className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-paper-2 text-base"
              aria-hidden
            >
              {emoji}
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span className="block font-display text-[17px] font-bold leading-tight text-ink">
              {title}
            </span>
            {summary && (
              <span className="mt-0.5 block truncate text-[12px] font-bold text-ink-faint">
                {summary}
              </span>
            )}
          </span>

          <ChevronDown
            className={cn(
              'h-4 w-4 flex-none text-ink-faint transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {isOpen && action}
      </div>

      {isOpen && (
        <div id={contentId} className="border-t border-edge p-4">
          {children}
        </div>
      )}
    </section>
  )
}
