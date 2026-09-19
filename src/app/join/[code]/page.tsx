'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { AuthShell, Swash } from '@/components/auth-shell'
import { useI18n } from '@/components/i18n-provider'
import { t } from '@/lib/i18n'
import { Family } from '@/types/database'

export default function JoinFamilyPage() {
  const [family, setFamily] = useState<Family | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const router = useRouter()
  const params = useParams()
  const code = params.code as string
  const { dict } = useI18n()

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
      <AuthShell>
        <div className="h-48 w-full animate-pulse rounded-card bg-paper-2" />
      </AuthShell>
    )
  }

  if (error) {
    return (
      <AuthShell>
        <div className="text-4xl">🤔</div>
        <h1 className="mt-4 font-display text-[32px] font-black leading-tight tracking-tight text-ink">
          {dict.auth.linkBroken}
        </h1>
        <Swash className="w-28" />
        <p className="mt-3 text-[14px] font-semibold leading-relaxed text-ink-soft">
          {error}
        </p>
        <Button
          onClick={() => router.push('/create-family')}
          size="lg"
          className="mt-7 w-full"
        >
          {dict.auth.createOwn}
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="text-4xl">👋</div>
      <h1 className="mt-4 font-display text-[32px] font-black leading-tight tracking-tight text-ink">
        {dict.auth.invitedTo}
        <br />
        {family?.name}
      </h1>
      <Swash className="w-32" />
      <p className="mt-3 text-[14px] font-semibold leading-relaxed text-ink-soft">
        {dict.auth.joinHint}
      </p>

      <Button
        onClick={handleJoin}
        size="lg"
        className="mt-7 w-full"
        disabled={joining}
      >
        {joining
          ? dict.auth.joining
          : t(dict.auth.join, { name: family?.name ?? '' })}
      </Button>
    </AuthShell>
  )
}
