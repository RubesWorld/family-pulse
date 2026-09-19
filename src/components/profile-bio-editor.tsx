'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { familyKeys } from '@/lib/queries/family'
import { profileKeys, updateProfileBio } from '@/lib/queries/profile'
import { useSession } from '@/lib/supabase/session-context'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { MapPin, Briefcase, Calendar, FileText, Phone } from 'lucide-react'

interface ProfileBioEditorProps {
  userId: string
  initialData: {
    location: string | null
    occupation: string | null
    birthday: string | null
    bio: string | null
    phone_number: string | null
  }
  /** Called once the save has landed *and* the cache reflects it. */
  onSaved: () => void
}

export function ProfileBioEditor({ userId, initialData, onSaved }: ProfileBioEditorProps) {
  const { supabase } = useSession()
  const queryClient = useQueryClient()
  const [location, setLocation] = useState(initialData.location || '')
  const [occupation, setOccupation] = useState(initialData.occupation || '')
  const [birthday, setBirthday] = useState(initialData.birthday || '')
  const [bio, setBio] = useState(initialData.bio || '')
  const [phoneNumber, setPhoneNumber] = useState(initialData.phone_number || '')

  const save = useMutation({
    mutationFn: () =>
      updateProfileBio(supabase, userId, {
        location: location.trim() || null,
        occupation: occupation.trim() || null,
        birthday: birthday || null,
        bio: bio.trim() || null,
        phone_number: phoneNumber.trim() || null,
      }),
    onSuccess: async () => {
      // These fields are on the `users` row, so they are read twice: as the
      // caller's own profile, and as one entry in the family member list the
      // Family tab renders. Invalidating by prefix reaches both without this
      // component knowing either screen exists.
      //
      // Awaited, so the editor stays in its saving state until the refetch has
      // landed. Closing first would collapse the section back onto the values
      // still sitting in the cache.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.all }),
        queryClient.invalidateQueries({ queryKey: familyKeys.all }),
      ])
      onSaved()
    },
  })

  const saving = save.isPending
  const error = save.error
    ? save.error instanceof Error
      ? save.error.message
      : 'Failed to save profile'
    : null

  return (
    <div className="space-y-4">
      {/* Location */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-extrabold text-ink-soft">
          <MapPin className="h-3.5 w-3.5" />
          Location
        </label>
        <Input
          placeholder="e.g., San Francisco, CA"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      {/* Occupation */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-extrabold text-ink-soft">
          <Briefcase className="h-3.5 w-3.5" />
          Occupation
        </label>
        <Input
          placeholder="e.g., Software Engineer"
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
        />
      </div>

      {/* Birthday */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-extrabold text-ink-soft">
          <Calendar className="h-3.5 w-3.5" />
          Birthday
        </label>
        <Input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
        />
      </div>

      {/* Phone Number */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-extrabold text-ink-soft">
          <Phone className="h-3.5 w-3.5" />
          Phone Number
        </label>
        <Input
          type="tel"
          placeholder="e.g., (555) 123-4567"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <p className="text-[11.5px] font-semibold text-ink-faint">
          Family members can use this to text you from the app
        </p>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-extrabold text-ink-soft">
          <FileText className="h-3.5 w-3.5" />
          Bio
        </label>
        <Textarea
          placeholder="Tell your family a bit about yourself..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-field border border-destructive/40 bg-destructive/10 p-3">
          <p className="text-[13px] font-bold text-destructive">{error}</p>
        </div>
      )}

      {/* Save button */}
      <Button
        onClick={() => save.mutate()}
        className="w-full"
        size="lg"
        disabled={saving}
      >
        {saving ? 'Saving…' : 'Save profile'}
      </Button>
    </div>
  )
}
