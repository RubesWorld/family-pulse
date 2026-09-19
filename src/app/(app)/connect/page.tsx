import { ConnectContent } from './connect-content'

/**
 * A shell. All four reads this screen needs now run in the browser against the
 * React Query cache — see `connect-content.tsx`.
 *
 * The route stays a server route, so middleware still gates it and the `(app)`
 * layout still redirects an unauthenticated or family-less user before anything
 * renders. What moved is the data, not the gate.
 */
export default function ConnectPage() {
  return <ConnectContent />
}
