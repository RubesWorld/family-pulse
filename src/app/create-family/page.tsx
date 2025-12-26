'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CreateFamilyPage() {
  const [familyName, setFamilyName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

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
            Give your family a name. You&apos;ll get an invite link to share.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Family'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
