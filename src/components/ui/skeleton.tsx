import { cn } from '@/lib/utils'

/**
 * Placeholder block for loading states.
 *
 * Paints immediately on navigation via each route's loading.tsx, so tapping a
 * tab shows structure right away instead of leaving the previous screen frozen
 * while the server resolves auth and queries.
 *
 * Uses the `paper-2` token so the placeholder sits correctly against warm
 * paper in both themes. (This was `bg-paper-2` to match the pre-redesign
 * pages; those literal gray utilities are gone.)
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-md bg-paper-2', className)}
      {...props}
    />
  )
}
