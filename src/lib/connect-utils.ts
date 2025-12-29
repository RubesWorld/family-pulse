import { User } from '@/types/database'

/**
 * Get current week number in YYYYWW format (e.g., 202501)
 * Week starts on Sunday
 */
export function getCurrentWeekNumber(): number {
  const date = new Date()
  const weekStart = getCurrentWeekStart(date)

  const year = weekStart.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const daysSinceStartOfYear = Math.floor(
    (weekStart.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  )
  const weekNumber = Math.ceil((daysSinceStartOfYear + startOfYear.getDay() + 1) / 7)

  return parseInt(`${year}${weekNumber.toString().padStart(2, '0')}`)
}

/**
 * Get the start of the current week (Sunday at 00:00)
 */
export function getCurrentWeekStart(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sunday, 1 = Monday, etc.
  const diff = day // Days since Sunday

  const weekStart = new Date(d)
  weekStart.setDate(d.getDate() - diff)
  weekStart.setHours(0, 0, 0, 0)

  return weekStart
}

/**
 * Format a date as "Month Day, Year" (e.g., "December 29, 2025")
 */
export function formatWeekDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Get the next user to ask a question using round-robin logic
 * Users are sorted alphabetically by ID, and the next asker is selected
 */
export function getNextQuestionAsker(
  familyMembers: User[],
  lastAskedUserId?: string | null
): User | null {
  if (familyMembers.length === 0) return null

  // Sort users alphabetically by ID for consistent ordering
  const sortedMembers = [...familyMembers].sort((a, b) => a.id.localeCompare(b.id))

  // If no one has asked yet, return first member
  if (!lastAskedUserId) {
    return sortedMembers[0]
  }

  // Find the index of the last asker
  const lastAskerIndex = sortedMembers.findIndex(user => user.id === lastAskedUserId)

  // If last asker not found or was last in list, return first member
  if (lastAskerIndex === -1 || lastAskerIndex === sortedMembers.length - 1) {
    return sortedMembers[0]
  }

  // Return next member in the rotation
  return sortedMembers[lastAskerIndex + 1]
}

/**
 * Calculate time ago from a date
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return formatWeekDisplay(d)
}
