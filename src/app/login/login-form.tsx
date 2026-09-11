'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FamilyOrbs, Swash } from '@/components/auth-shell'

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('invite')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) throw signUpError

        if (data.user) {
          // Create user profile
          const { error: profileError } = await supabase
            .from('users')
            .insert({ id: data.user.id, name })

          if (profileError) throw profileError

          if (inviteCode) {
            router.push(`/join/${inviteCode}`)
          } else {
            router.push('/create-family')
          }
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('family_id')
            .eq('id', user.id)
            .single()

          if (profile?.family_id) {
            router.push('/feed')
          } else if (inviteCode) {
            router.push(`/join/${inviteCode}`)
          } else {
            router.push('/create-family')
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <FamilyOrbs />

      <h1 className="font-display text-[40px] font-black leading-[0.95] tracking-tight text-ink">
        Family
        <br />
        Pulse
      </h1>
      <Swash />
      <p className="mt-3 max-w-[26ch] text-[14px] font-semibold leading-relaxed text-ink-soft">
        See what everyone&apos;s up to — without the group chat.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-3.5">
        {isSignUp && (
          <div>
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              type="text"
              placeholder="What should we call you?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={isSignUp}
              autoComplete="name"
            />
          </div>
        )}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
        </div>

        {error && (
          <p className="rounded-field border border-destructive/40 bg-destructive/10 p-3 text-[13px] font-bold text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Log in'}
        </Button>
      </form>

      <p className="mt-5 text-center text-[12.5px] font-bold text-ink-soft">
        {isSignUp ? 'Already have an account?' : 'New here?'}{' '}
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(null)
          }}
          className="font-extrabold text-coral hover:underline"
        >
          {isSignUp ? 'Log in' : 'Create an account'}
        </button>
      </p>
    </div>
  )
}
