import { Skeleton } from '@/components/ui/skeleton'

// Container matches connect-content.tsx ("max-w-4xl mx-auto p-4 pb-24").
export default function ConnectLoading() {
  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <Skeleton className="h-8 w-40 mb-6" />

      {/* this week's question card */}
      <div className="rounded-card border-card border-edge bg-card p-5 space-y-4 mb-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-6 w-2/3" />
        <div className="flex items-center gap-3 pt-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* answers */}
      <div className="space-y-3 mb-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-card border-card border-edge bg-card p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>

      {/* past questions */}
      <Skeleton className="h-5 w-36 mb-3" />
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-panel" />
        ))}
      </div>
    </div>
  )
}
