'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CreateFamilyPage() {
  const [familyName, setFamilyName] = useState('')
  const [userName, setUserName] = useState('')
  const [needsProfile, setNeedsProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        setNeedsProfile(true)
      }
    }

    checkProfile()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Try to create profile (ignore if already exists)
      const { error: profileError } = await supabase
        .from('users')
        .insert({ id: user.id, name: userName || 'User' })

      // Ignore duplicate key error (profile already exists)
      if (profileError && !profileError.message.includes('duplicate')) {
        throw profileError
      }

      // Create the family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({ name: familyName })
        .select()
        .single()

      if (familyError) throw familyError

      // Update user with family_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ family_id: family.id })
        .eq('id', user.id)

      if (updateError) throw updateError

      router.push('/feed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Your Family</CardTitle>
          <CardDescription>
            {needsProfile
              ? "Let's set up your profile and create your family."
              : "Give your family a name. You'll get an invite link to share."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {needsProfile && (
              <div className="space-y-2">
                <Label htmlFor="userName">Your Name</Label>
                <Input
                  id="userName"
                  type="text"
                  placeholder="What should we call you?"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  className="h-12 text-lg"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="familyName">Family Name</Label>
              <Input
                id="familyName"
                type="text"
                placeholder="The Smiths, Our Family, etc."
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
                className="h-12 text-lg"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={loading || (needsProfile && !userName.trim())}
            >
              {loading ? 'Creating...' : 'Create Family'}
            </Button>
          </form>
          <div className="mt-4 pt-4 border-t">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Log out and start over
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
