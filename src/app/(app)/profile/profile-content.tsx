'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { InterestCardEditor } from '@/components/interest-card-editor'
import { PickEditor } from '@/components/pick-editor'
import { LogOut, Copy, Check, Edit2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Activity, InterestCard, UserPick } from '@/types/database'

interface ProfileContentProps {
  user: {
    id: string
    name: string
    email: string
    interests: string[]
    familyName: string
    inviteCode: string
  }
  recentActivities: Activity[]
  interestCards: InterestCard[]
  picks: UserPick[]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ProfileContent({ user, recentActivities, interestCards, picks }: ProfileContentProps) {
  const [copied, setCopied] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [isEditingInterests, setIsEditingInterests] = useState(false)
  const [isEditingPicks, setIsEditingPicks] = useState(false)
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

  const handleSaveComplete = () => {
    setIsEditingInterests(false)
    setIsEditingPicks(false)
    router.refresh()
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Profile Card */}
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

      {/* Interests Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Interests</CardTitle>
              <CardDescription>What you love to do</CardDescription>
            </div>
            {!isEditingInterests && interestCards.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingInterests(true)}
                className="gap-1"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingInterests || interestCards.length === 0 ? (
            <InterestCardEditor
              userId={user.id}
              existingCards={interestCards.map(card => ({
                category: card.category,
                description: card.description,
                is_custom: card.is_custom
              }))}
              onSave={handleSaveComplete}
            />
          ) : (
            <div className="space-y-2">
              {interestCards.map(card => (
                <div key={card.id} className="border-l-4 border-blue-500 pl-3 py-2">
                  <p className="font-medium">{card.category}</p>
                  <p className="text-sm text-gray-600">{card.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Picks Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Picks</CardTitle>
              <CardDescription>Your current favorites</CardDescription>
            </div>
            {!isEditingPicks && picks.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingPicks(true)}
                className="gap-1"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingPicks || picks.length === 0 ? (
            <PickEditor
              userId={user.id}
              existingPicks={picks.map(pick => ({
                category: pick.category,
                value: pick.value,
                interest_tag: pick.interest_tag
              }))}
              userInterests={interestCards.map(card => ({
                category: card.category,
                is_custom: card.is_custom
              }))}
              onSave={handleSaveComplete}
            />
          ) : (
            <div className="space-y-2">
              {picks.map(pick => (
                <div key={pick.id} className="border-l-4 border-purple-500 pl-3 py-2">
                  <p className="text-sm text-gray-500">{pick.category}</p>
                  <p className="font-medium">{pick.value}</p>
                  {pick.interest_tag && (
                    <p className="text-xs text-gray-400 mt-1">→ {pick.interest_tag}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activities Card */}
      {recentActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Your latest posts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="border-l-2 border-blue-200 pl-3 py-1"
                >
                  <p className="font-medium text-sm">{activity.title}</p>
                  {activity.description && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Family Card */}
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

      {/* Logout Button */}
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
