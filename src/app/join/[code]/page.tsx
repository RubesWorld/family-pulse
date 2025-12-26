'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Family } from '@/types/database'

export default function JoinFamilyPage() {
  const [family, setFamily] = useState<Family | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const router = useRouter()
  const params = useParams()
  const code = params.code as string

  useEffect(() => {
    const fetchFamily = async () => {
      const supabase = createClient()

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/login?invite=${code}`)
        return
      }

      // Check if user already has a family
      const { data: profile } = await supabase
        .from('users')
        .select('family_id')
        .eq('id', user.id)
        .single()

      if (profile?.family_id) {
        router.push('/feed')
        return
      }

      // Fetch the family by invite code
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('invite_code', code)
        .single()

      if (familyError || !familyData) {
        setError('Invalid invite link. Please check with your family member.')
        setLoading(false)
        return
      }

      setFamily(familyData)
      setLoading(false)
    }

    fetchFamily()
  }, [code, router])

  const handleJoin = async () => {
    if (!family) return
    setJoining(true)

    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: updateError } = await supabase
        .from('users')
        .update({ family_id: family.id })
        .eq('id', user.id)

      if (updateError) throw updateError

      router.push('/feed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">Oops!</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/create-family')}
              className="w-full h-12 text-lg"
            >
              Create Your Own Family
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join Family</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join <strong>{family?.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleJoin}
            className="w-full h-12 text-lg"
            disabled={joining}
          >
            {joining ? 'Joining...' : `Join ${family?.name}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
