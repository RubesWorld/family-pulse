'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Check } from 'lucide-react'

interface FeedHeaderProps {
  familyName: string
  inviteCode: string
}

export function FeedHeader({ familyName, inviteCode }: FeedHeaderProps) {
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
      <div className="flex items-center justify-between">
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
    </header>
  )
}
