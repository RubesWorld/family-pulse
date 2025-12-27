'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, InterestCard, UserPick } from '@/types/database'
import { InterestCard as InterestCardComponent } from '@/components/interest-card'
import { PickCard } from '@/components/pick-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, MapPin, Briefcase, Calendar, FileText, MessageCircle } from 'lucide-react'
import { openSMS } from '@/lib/sms'

interface MemberDetailViewProps {
  member: User
  onBack: () => void
}

export function MemberDetailView({ member, onBack }: MemberDetailViewProps) {
  const [interests, setInterests] = useState<InterestCard[]>([])
  const [picks, setPicks] = useState<UserPick[]>([])
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      // Fetch interests
      const { data: interestData } = await supabase
        .from('interest_cards')
        .select('*')
        .eq('user_id', member.id)

      // Fetch picks
      const { data: pickData } = await supabase
        .from('picks')
        .select('*')
        .eq('user_id', member.id)

      setInterests(interestData || [])
      setPicks(pickData || [])
      setLoading(false)
    }

    fetchData()
  }, [member.id])

  const filteredPicks = selectedInterest
    ? picks.filter(p => p.interest_tag === selectedInterest)
    : picks

  const hasBioInfo = member.location || member.occupation || member.birthday || member.bio

  const handleTextClick = () => {
    if (!member.phone_number) return
    const message = `Hey ${member.name}!`
    openSMS(member.phone_number, message)
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Family
      </Button>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden shadow-md">
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {member.name[0]}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold">{member.name}</h1>
        </div>
        {member.phone_number && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleTextClick}
            className="gap-1.5"
          >
            <MessageCircle className="w-4 h-4" />
            Text
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          {/* User header skeleton */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200" />
            <div className="h-8 w-32 bg-gray-200 rounded" />
          </div>

          {/* Bio skeleton */}
          <div className="h-40 bg-gray-200 rounded-lg" />

          {/* Interests skeleton */}
          <div className="space-y-3">
            <div className="h-6 w-24 bg-gray-200 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Picks skeleton */}
          <div className="space-y-3">
            <div className="h-6 w-20 bg-gray-200 rounded" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Bio Section */}
          {hasBioInfo && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>About {member.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {member.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                        <p className="font-medium text-gray-900">{member.location}</p>
                      </div>
                    </div>
                  )}

                  {member.occupation && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Occupation</p>
                        <p className="font-medium text-gray-900">{member.occupation}</p>
                      </div>
                    </div>
                  )}

                  {member.birthday && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-pink-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Birthday</p>
                        <p className="font-medium text-gray-900">
                          {new Date(member.birthday).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {member.bio && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Bio</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{member.bio}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interests Section */}
          {interests.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3">Interests</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {interests.map(interest => (
                  <InterestCardComponent
                    key={interest.id}
                    interest={{ ...interest, users: { name: member.name, avatar_url: member.avatar_url } }}
                    onClick={() => setSelectedInterest(
                      selectedInterest === interest.category ? null : interest.category
                    )}
                    isSelected={selectedInterest === interest.category}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Picks Section */}
          {filteredPicks.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">
                {selectedInterest ? 'Related Picks' : 'Picks'}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {filteredPicks.map(pick => (
                  <PickCard
                    key={pick.id}
                    pick={{ ...pick, users: { name: member.name, avatar_url: member.avatar_url } }}
                    onInterestClick={(tag) => setSelectedInterest(tag)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty States */}
          {interests.length === 0 && picks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No interests or picks yet</p>
              <p className="text-sm mt-1">
                {member.name} hasn&apos;t shared their favorites yet
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
