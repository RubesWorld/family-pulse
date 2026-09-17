import { Skeleton } from '@/components/ui/skeleton'

// Container matches profile-content.tsx ("max-w-lg mx-auto p-4 space-y-4").
export default function ProfileLoading() {
  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* identity block */}
      <div className="rounded-card border-card border-edge bg-card p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* picks / interests / recent activity sections */}
      {[0, 1, 2].map((section) => (
        <div
          key={section}
          className="rounded-card border-card border-edge bg-card p-5 space-y-3"
        >
          <Skeleton className="h-5 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  )
}
