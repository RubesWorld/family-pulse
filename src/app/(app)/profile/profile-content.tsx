'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { InterestSelector } from '@/components/interest-selector'
import { FloatingElements } from '@/components/floating-elements'
import { LogOut, Copy, Check, Edit2, Save, X } from 'lucide-react'
import { getInterestById } from '@/lib/interests'
import { formatDistanceToNow } from 'date-fns'
import type { Activity } from '@/types/database'

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
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ProfileContent({ user, recentActivities }: ProfileContentProps) {
  const [copied, setCopied] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [isEditingInterests, setIsEditingInterests] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user.interests)
  const [isSaving, setIsSaving] = useState(false)
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

  const handleToggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    )
  }

  const handleSaveInterests = async () => {
    setIsSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('users')
        .update({ interests: selectedInterests })
        .eq('id', user.id)

      if (error) throw error

      setIsEditingInterests(false)
      router.refresh()
    } catch (error) {
      console.error('Failed to save interests:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setSelectedInterests(user.interests)
    setIsEditingInterests(false)
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
      <Card className="relative overflow-hidden">
        <FloatingElements interests={user.interests} />
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Interests</CardTitle>
              <CardDescription>What you love to do</CardDescription>
            </div>
            {!isEditingInterests && (
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
        <CardContent className="relative z-10">
          {isEditingInterests ? (
            <div className="space-y-4">
              <InterestSelector
                selectedInterests={selectedInterests}
                onToggle={handleToggleInterest}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveInterests}
                  disabled={isSaving}
                  className="flex-1 gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {user.interests.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Add interests to personalize your profile
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interestId) => {
                    const interest = getInterestById(interestId)
                    if (!interest) return null
                    return (
                      <Badge
                        key={interest.id}
                        variant="secondary"
                        className="text-sm px-3 py-1.5 gap-1.5"
                      >
                        <span>{interest.emoji}</span>
                        <span>{interest.label}</span>
                      </Badge>
                    )
                  })}
                </div>
              )}
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
