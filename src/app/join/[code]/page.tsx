'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { AuthShell, Swash } from '@/components/auth-shell'

/**
 * All an invitee is told about a family before joining.
 *
 * Deliberately not the full `Family` row: `family_by_invite_code` returns only
 * the id and name, and in particular never returns `invite_code` back out, so
 * the response carries nothing the caller did not already hold.
 */
type InvitedFamily = { id: string; name: string }

/**
 * Turn a join failure into something worth showing a person.
 *
 * The RPC signals its refusals with SQLSTATEs rather than prose, so the raw
 * message is Postgres-speak ("already a member of a family"). Map the three it
 * can raise, and never surface an unrecognised database error verbatim.
 */
function joinErrorMessage(err: unknown): string {
  const code = (err as { code?: string } | null)?.code

  switch (code) {
    case '23505':
      return "You're already in a family."
    case '22023':
      return 'Invalid invite link. Please check with your family member.'
    case '28000':
      return 'Please log in again to join.'
    default:
      return "Something went wrong joining. Please try that link again."
  }
}

export default function JoinFamilyPage() {
  const [family, setFamily] = useState<InvitedFamily | null>(null)
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

      // Resolve the family through the RPC rather than reading `families`.
      // The table is only readable for the family you already belong to, which
      // by definition is not this one yet. The function takes the code as an
      // argument, so it resolves one family without granting the ability to
      // list them — which is what `USING (true)` used to hand out along with
      // every invite code in the product.
      const { data: matches, error: familyError } = await supabase
        .rpc('family_by_invite_code', { p_code: code })

      const familyData = matches?.[0]

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
      // Joining is one RPC rather than a direct `users.family_id` write: the
      // UPDATE policy pins family_id to its existing value, so the function is
      // the only sanctioned way to change it. It re-checks the code server-side
      // and refuses if you already belong to a family.
      const { error: joinError } = await supabase
        .rpc('join_family_by_invite_code', { p_code: code })

      if (joinError) throw joinError

      router.push('/feed')
    } catch (err) {
      setError(joinErrorMessage(err))
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
          That link didn&apos;t work
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
          Create your own family
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="text-4xl">👋</div>
      <h1 className="mt-4 font-display text-[32px] font-black leading-tight tracking-tight text-ink">
        You&apos;re invited to
        <br />
        {family?.name}
      </h1>
      <Swash className="w-32" />
      <p className="mt-3 text-[14px] font-semibold leading-relaxed text-ink-soft">
        Join to see what everyone&apos;s up to and share what you&apos;re doing.
      </p>

      <Button
        onClick={handleJoin}
        size="lg"
        className="mt-7 w-full"
        disabled={joining}
      >
        {joining ? 'Joining…' : `Join ${family?.name}`}
      </Button>
    </AuthShell>
  )
}
