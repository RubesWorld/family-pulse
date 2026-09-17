'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { History, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSkipped } from '@/lib/pick-prompts'
import { PickSticker } from '@/components/ui/pick-sticker'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface PickHistoryDialogProps {
  userId: string
  /** Stored picks.category value — a prompt id, or a legacy category. */
  category: string
  currentValue: string
  /** Already resolved and localised by the caller. */
  label: string
  historyLabel?: string
}

interface PickHistory {
  id: string
  value: string
  interest_tag: string | null
  archived_at: string | null
  created_at: string
}

export function PickHistoryDialog({
  userId,
  category,
  currentValue,
  label,
}: PickHistoryDialogProps) {
  const [history, setHistory] = useState<PickHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('picks')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .eq('is_current', false)
        .order('archived_at', { ascending: false })

      if (error) throw error
      setHistory((data || []).filter((row) => !isSkipped(row.value)))
    } catch (err) {
      console.error('Failed to fetch pick history:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, category])

  useEffect(() => {
    if (open) fetchHistory()
  }, [open, fetchHistory])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-[11.5px]">
          <History className="h-3 w-3" />
          See history
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <PickSticker category={category} size="sm" />
            {label}
          </DialogTitle>
          <DialogDescription>
            How this has changed over time
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {/* current */}
          <div className="rounded-panel border-[1.5px] border-coral/40 bg-coral/[0.12] p-4">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-coral">
              Now
            </div>
            <p className="mt-1 font-display text-[18px] font-bold text-ink">
              {currentValue}
            </p>
          </div>

          {loading ? (
            <p className="py-8 text-center text-[13px] font-semibold text-ink-soft">
              Loading history…
            </p>
          ) : history.length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-3xl">🌱</div>
              <p className="mt-2.5 text-[13.5px] font-bold text-ink">
                No previous picks
              </p>
              <p className="mt-1 text-[12px] font-medium text-ink-soft">
                This is your first one.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="h-px flex-1 bg-edge" />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-ink-faint">
                  Before
                </span>
                <span className="h-px flex-1 bg-edge" />
              </div>

              <div className="space-y-2.5">
                {history.map((pick, index) => {
                  const nextPick =
                    index === 0 ? currentValue : history[index - 1]?.value
                  const timestamp = pick.archived_at || pick.created_at

                  return (
                    <div
                      key={pick.id}
                      className="rounded-panel border border-edge bg-paper-2 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-[13.5px]">
                        <span className="font-semibold text-ink-faint line-through">
                          {pick.value}
                        </span>
                        <ArrowRight className="h-3 w-3 flex-none text-marigold" />
                        <span className="font-extrabold text-ink">
                          {nextPick}
                        </span>
                      </div>

                      {pick.interest_tag && (
                        <span className="mt-2 inline-block rounded-full border border-sage/30 bg-sage/[0.16] px-2.5 py-0.5 text-[10.5px] font-extrabold text-sage">
                          {pick.interest_tag}
                        </span>
                      )}

                      <p className="mt-2 text-[11px] font-bold text-ink-faint">
                        Changed{' '}
                        {formatDistanceToNow(new Date(timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
