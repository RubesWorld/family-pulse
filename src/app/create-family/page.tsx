'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell, Swash } from '@/components/auth-shell'

/**
 * The RPC refuses with SQLSTATEs rather than prose; map the ones it raises and
 * never show an unrecognised database error to a family member.
 */
function createFamilyErrorMessage(err: unknown): string {
  const code = (err as { code?: string } | null)?.code

  switch (code) {
    case '23505':
      return "You're already in a family."
    case '22023':
      return 'Please give your family a name.'
    case '28000':
      return 'Please log in again to create your family.'
    default:
      return "Something went wrong creating your family. Please try again."
  }
}

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
      // One transactional RPC, replacing three separate statements: insert the
      // profile, insert the family, then point the profile at it. Those were
      // not atomic — a failure after the second left a family with nobody in
      // it and the user in no family at all, with no way to retry into a good
      // state. The function also creates the profile row if signup did not,
      // which is the case `needsProfile` covers.
      const { error: createError } = await supabase
        .rpc('create_family_with_owner', {
          p_family_name: familyName,
          p_user_name: userName.trim() || null,
        })

      if (createError) throw createError

      router.push('/feed')
    } catch (err) {
      setError(createFamilyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="font-display text-[34px] font-black leading-[1.05] tracking-tight text-ink">
        Start your
        <br />
        family
      </h1>
      <Swash className="w-28" />
      <p className="mt-3 max-w-[30ch] text-[14px] font-semibold leading-relaxed text-ink-soft">
        {needsProfile
          ? "Let's set up your profile and create your family."
          : "Give it a name. You'll get an invite link to share."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-3.5">
        {needsProfile && (
          <div>
            <Label htmlFor="userName">Your name</Label>
            <Input
              id="userName"
              type="text"
              placeholder="What should we call you?"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
        )}

        <div>
          <Label htmlFor="familyName">Family name</Label>
          <Input
            id="familyName"
            type="text"
            placeholder="The Smiths, Our Crew, etc."
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            required
            autoFocus
          />
        </div>

        {error && (
          <p className="rounded-field border border-destructive/40 bg-destructive/10 p-3 text-[13px] font-bold text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading || (needsProfile && !userName.trim())}
        >
          {loading ? 'Creating…' : 'Create family'}
        </Button>
      </form>

      <div className="mt-6 border-t border-edge pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full text-[12.5px] font-bold text-ink-faint transition-colors hover:text-ink"
        >
          Log out and start over
        </button>
      </div>
    </AuthShell>
  )
}
