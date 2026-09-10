import { Skeleton } from '@/components/ui/skeleton'

// Container matches family-content.tsx ("max-w-4xl mx-auto p-4 pb-24").
export default function FamilyLoading() {
  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <Skeleton className="h-8 w-48 mb-6" />

      <section className="mb-8">
        <Skeleton className="h-5 w-36 mb-3" />
        {/* same grid as the member cards: 2 cols on mobile, 3 from md */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col items-center gap-3"
            >
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-white p-4 flex items-center gap-3"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
