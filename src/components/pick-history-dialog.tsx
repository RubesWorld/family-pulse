'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { History, ArrowRight, Badge as BadgeIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PICK_CATEGORIES } from '@/lib/pick-categories'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  category: string
  currentValue: string
}

interface PickHistory {
  id: string
  value: string
  interest_tag: string | null
  archived_at: string | null
  created_at: string
}

export function PickHistoryDialog({ userId, category, currentValue }: PickHistoryDialogProps) {
  const [history, setHistory] = useState<PickHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const categoryData = PICK_CATEGORIES.find(c => c.id === category)
  const Icon = categoryData?.icon
  const label = categoryData?.label || category

  useEffect(() => {
    if (open) {
      fetchHistory()
    }
  }, [open])

  const fetchHistory = async () => {
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
      setHistory(data || [])
    } catch (err) {
      console.error('Failed to fetch pick history:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-gray-600 hover:text-gray-900">
          <History className="w-3.5 h-3.5" />
          See history
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {Icon && (
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${categoryData?.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
            )}
            {label} History
          </DialogTitle>
          <DialogDescription>
            See how your favorite {label.toLowerCase()} has changed over time
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Current pick */}
          <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <BadgeIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-600 uppercase">Current</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{currentValue}</p>
              </div>
            </div>
          </div>

          {/* History */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium">No previous picks</p>
              <p className="text-xs mt-1">This is your first {label.toLowerCase()}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-500 uppercase font-medium">Previous Picks</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="space-y-3">
                {history.map((pick, index) => {
                  const nextPick = index === 0 ? currentValue : history[index - 1]?.value
                  const timestamp = pick.archived_at || pick.created_at

                  return (
                    <div
                      key={pick.id}
                      className="p-3 rounded-lg bg-gray-50 border border-gray-200"
                    >
                      <div className="flex items-center gap-2 mb-2 text-sm">
                        <span className="text-gray-500 line-through">{pick.value}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium text-gray-900">{nextPick}</span>
                      </div>

                      {pick.interest_tag && (
                        <Badge variant="secondary" className="text-xs mb-2">
                          {pick.interest_tag}
                        </Badge>
                      )}

                      <p className="text-xs text-gray-500">
                        Changed {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
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
