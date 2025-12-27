'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Check, List, Calendar, Activity, Heart } from 'lucide-react'

export type FeedFilter = 'all' | 'activities' | 'picks'

interface FeedHeaderProps {
  familyName: string
  inviteCode: string
  view: 'feed' | 'calendar'
  onViewChange: (view: 'feed' | 'calendar') => void
  filter: FeedFilter
  onFilterChange: (filter: FeedFilter) => void
}

export function FeedHeader({ familyName, inviteCode, view, onViewChange, filter, onFilterChange }: FeedHeaderProps) {
  const [copied, setCopied] = useState(false)

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

  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{familyName}</h1>
          <p className="text-sm text-gray-500">Family Pulse</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Invite
            </>
          )}
        </Button>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={view === 'feed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewChange('feed')}
          className="flex-1 gap-2"
        >
          <List className="w-4 h-4" />
          Feed
        </Button>
        <Button
          variant={view === 'calendar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewChange('calendar')}
          className="flex-1 gap-2"
        >
          <Calendar className="w-4 h-4" />
          Calendar
        </Button>
      </div>

      {/* Feed Filter (only show when in feed view) */}
      {view === 'feed' && (
        <div className="flex gap-2 mt-2">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('all')}
            className="flex-1"
          >
            All
          </Button>
          <Button
            variant={filter === 'activities' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('activities')}
            className="flex-1 gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" />
            Activities
          </Button>
          <Button
            variant={filter === 'picks' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFilterChange('picks')}
            className="flex-1 gap-1.5"
          >
            <Heart className="w-3.5 h-3.5" />
            Picks
          </Button>
        </div>
      )}
    </header>
  )
}
