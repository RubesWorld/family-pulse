'use client'

import { useState } from 'react'
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
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <MapPin className="w-4 h-4" />
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
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Briefcase className="w-4 h-4" />
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
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Calendar className="w-4 h-4" />
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
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Phone className="w-4 h-4" />
          Phone Number
        </label>
        <Input
          type="tel"
          placeholder="e.g., (555) 123-4567"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <p className="text-xs text-gray-500">
          Family members can use this to text you from the app
        </p>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <FileText className="w-4 h-4" />
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
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Save button */}
      <Button onClick={handleSave} className="w-full" size="lg" disabled={saving}>
        {saving ? 'Saving...' : 'Save Profile'}
      </Button>
    </div>
  )
}
