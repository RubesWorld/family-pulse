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
import { PRESET_INTERESTS } from '@/lib/interests'
import { PICK_CATEGORIES } from '@/lib/pick-categories'
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
            <div className="grid grid-cols-1 gap-3">
              {interestCards.map(card => {
                const preset = PRESET_INTERESTS.find((p) => p.id === card.category)
                const emoji = preset?.emoji || '⭐'
                const label = preset?.label || card.category

                return (
                  <div
                    key={card.id}
                    className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-bl-full" />
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-sm">
                        <span className="text-2xl">{emoji}</span>
                      </div>
                      <p className="font-bold text-gray-900 text-lg">{label}</p>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed pl-15">{card.description}</p>
                  </div>
                )
              })}
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
            <div className="grid grid-cols-1 gap-3">
              {picks.map(pick => {
                const category = PICK_CATEGORIES.find((c) => c.id === pick.category)
                const Icon = category?.icon
                const label = category?.label || pick.category

                return (
                  <div
                    key={pick.id}
                    className={`relative overflow-hidden rounded-lg p-4 border-2 shadow-sm hover:shadow-md transition-all bg-gradient-to-br ${category?.color || 'from-gray-400 to-gray-500'}`}
                  >
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full blur-2xl" />
                    </div>
                    <div className="relative flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {Icon && (
                          <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">{label}</span>
                      </div>
                    </div>
                    <p className="font-bold text-white text-lg mb-2 relative">{pick.value}</p>
                    {pick.interest_tag && (
                      <div className="inline-block px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white font-medium">
                        → {pick.interest_tag}
                      </div>
                    )}
                  </div>
                )
              })}
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
