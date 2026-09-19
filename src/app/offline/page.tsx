import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Offline — Family Pulse',
}

// Precached by the service worker at install time and served for any
// navigation that fails, so it has to be genuinely static: no session, no
// family data, no client JS. It is excluded from the middleware matcher for
// the same reason — the install-time fetch carries no credentials and would
// otherwise be redirected to /login and cached under this URL.
export const dynamic = 'force-static'

// The one thing this page cannot assume is the app's CSS chunk. That chunk is
// hashed by the build, so the worker cannot precache it by name; it only lands
// in the cache once a real page load has gone through the worker. Until then
// Tailwind's tokens resolve to nothing, and an offline page that renders as
// black-on-white is the same defect as the launch flash. So the paper colours
// are inline, keyed off the data-theme the root layout's script has already
// set pre-paint. Everything else is allowed to degrade.
const PAPER_FALLBACK = `
[data-theme='night'] .offline-paper { background:#17110C; color:#F6EADA }
[data-theme='day'] .offline-paper { background:#FDF6EC; color:#5C4433 }
`

export default function OfflinePage() {
  return (
    <main className="offline-paper grid min-h-screen place-items-center px-8">
      <style dangerouslySetInnerHTML={{ __html: PAPER_FALLBACK }} />
      <div className="max-w-xs text-center">
        <p className="font-display text-[22px] font-black leading-tight">
          No connection
        </p>
        <p className="mt-2 text-[13.5px] font-medium leading-relaxed opacity-75">
          Family Pulse needs a network to load what everyone&apos;s been up to.
          Your family&apos;s updates will be here when you&apos;re back online.
        </p>
        {/* A plain anchor, not a reload button: it needs no client JS, and
            while still offline it simply lands back here. */}
        <a
          href="/feed"
          className="mt-6 inline-flex items-center justify-center rounded-full border border-current px-5 py-2.5 text-[13.5px] font-extrabold"
        >
          Try again
        </a>
      </div>
    </main>
  )
}
