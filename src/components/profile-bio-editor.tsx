'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { MapPin, Briefcase, Calendar, FileText, Phone } from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'

interface ProfileBioEditorProps {
  userId: string
  initialData: {
    location: string | null
    occupation: string | null
    birthday: string | null
    bio: string | null
    phone_number: string | null
  }
  onSave: () => void
}

export function ProfileBioEditor({ userId, initialData, onSave }: ProfileBioEditorProps) {
  const [location, setLocation] = useState(initialData.location || '')
  const [occupation, setOccupation] = useState(initialData.occupation || '')
  const [birthday, setBirthday] = useState(initialData.birthday || '')
  const [bio, setBio] = useState(initialData.bio || '')
  const [phoneNumber, setPhoneNumber] = useState(initialData.phone_number || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { dict } = useI18n()

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const supabase = (await import('@/lib/supabase/client')).createClient()

      const { error: updateError } = await supabase
        .from('users')
        .update({
          location: location.trim() || null,
          occupation: occupation.trim() || null,
          birthday: birthday || null,
          bio: bio.trim() || null,
          phone_number: phoneNumber.trim() || null,
        })
        .eq('id', userId)

      if (updateError) throw updateError

      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Location */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-extrabold text-ink-soft">
          <MapPin className="h-3.5 w-3.5" />
          {dict.bio.location}
        </label>
        <Input
          placeholder={dict.bio.locationPlaceholder}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      {/* Occupation */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-extrabold text-ink-soft">
          <Briefcase className="h-3.5 w-3.5" />
          {dict.bio.occupation}
        </label>
        <Input
          placeholder={dict.bio.occupationPlaceholder}
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
        />
      </div>

      {/* Birthday */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-extrabold text-ink-soft">
          <Calendar className="h-3.5 w-3.5" />
          {dict.bio.birthday}
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
          {dict.bio.phone}
        </label>
        <Input
          type="tel"
          placeholder={dict.bio.phonePlaceholder}
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <p className="text-[11.5px] font-semibold text-ink-faint">
          {dict.bio.phoneHint}
        </p>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-extrabold text-ink-soft">
          <FileText className="h-3.5 w-3.5" />
          {dict.bio.bio}
        </label>
        <Textarea
          placeholder={dict.bio.bioPlaceholder}
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
      <Button onClick={handleSave} className="w-full" size="lg" disabled={saving}>
        {saving ? dict.common.saving : dict.bio.saveProfile}
      </Button>
    </div>
  )
}
