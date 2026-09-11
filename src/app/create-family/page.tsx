'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell, Swash } from '@/components/auth-shell'

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
