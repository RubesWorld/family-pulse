import { FeedContent } from './feed-content'

/**
 * A shell. Both of the feed's reads, and the follow-up that annotates each pick
 * with the value it replaced, now run in the browser against the React Query
 * cache — see `feed-content.tsx`.
 *
 * This is the screen the "add activity" form returns to, and it is where the
 * `router.refresh()` that form used to fire was aimed. Posting now invalidates
 * `['activities']` instead, so the new row is in the cache before the
 * navigation lands rather than arriving with a second server render.
 */
export default function FeedPage() {
  return <FeedContent />
}
