import { Skeleton } from '@/components/ui/skeleton'

// Container matches feed-content.tsx ("max-w-lg mx-auto" + inner "p-4 space-y-6")
// so the real content lands where the skeleton was.
export default function FeedLoading() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="p-4 space-y-6">
        {/* header: family name + share button */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-9 rounded-panel" />
        </div>

        {/* view / filter toggles */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-16 rounded-full" />
        </div>

        {/* two day groups of activity cards */}
        {[0, 1].map((group) => (
          <div key={group} className="space-y-3">
            <Skeleton className="h-4 w-24" />
            {[0, 1].map((card) => (
              <div
                key={card}
                className="rounded-card border-card border-edge bg-card p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
