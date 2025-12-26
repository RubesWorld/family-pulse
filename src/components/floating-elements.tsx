'use client'

import { useMemo } from 'react'
import { getInterestById } from '@/lib/interests'

interface FloatingElementsProps {
  interests: string[]
}

interface FloatingElement {
  emoji: string
  top: string
  left: string
  delay: string
  duration: string
  size: string
}

export function FloatingElements({ interests }: FloatingElementsProps) {
  const elements = useMemo(() => {
    if (interests.length === 0) return []

    const floatingElements: FloatingElement[] = []
    const numElements = Math.min(interests.length * 2, 12) // 2 per interest, max 12

    for (let i = 0; i < numElements; i++) {
      const interestId = interests[i % interests.length]
      const interest = getInterestById(interestId)
      if (!interest) continue

      floatingElements.push({
        emoji: interest.emoji,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`,
        duration: `${15 + Math.random() * 10}s`,
        size: `${2 + Math.random() * 2}rem`,
      })
    }

    return floatingElements
  }, [interests])

  if (elements.length === 0) return null

  return (
    <>
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-20px) rotate(5deg);
          }
          66% {
            transform: translateY(10px) rotate(-5deg);
          }
        }
      `}</style>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {elements.map((element, index) => (
          <div
            key={index}
            className="absolute opacity-10"
            style={{
              top: element.top,
              left: element.left,
              fontSize: element.size,
              animation: `float ${element.duration} ease-in-out infinite`,
              animationDelay: element.delay,
            }}
          >
            {element.emoji}
          </div>
        ))}
      </div>
    </>
  )
}
