import { cn } from '@/lib/utils'

/**
 * Placeholder block for loading states.
 *
 * Paints immediately on navigation via each route's loading.tsx, so tapping a
 * tab shows structure right away instead of leaving the previous screen frozen
 * while the server resolves auth and queries.
 *
 * `bg-gray-200` rather than a token colour to match the existing pages, which
 * use literal gray utilities throughout.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-md bg-gray-200', className)}
      {...props}
    />
  )
}
