'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, Copy, Check } from 'lucide-react'

interface ProfileContentProps {
  user: {
    name: string
    email: string
    familyName: string
    inviteCode: string
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ProfileContent({ user }: ProfileContentProps) {
  const [copied, setCopied] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const copyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/join/${user.inviteCode}`
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
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

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xl font-medium">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Family</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">{user.familyName}</p>
            <p className="text-sm text-gray-500">Your family group</p>
          </div>
          <Button
            variant="outline"
            onClick={copyInviteLink}
            className="w-full gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Link Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Invite Link
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <LogOut className="w-4 h-4" />
        {loggingOut ? 'Logging out...' : 'Log Out'}
      </Button>
    </div>
  )
}
