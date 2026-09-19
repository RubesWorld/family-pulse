import { FamilyContent } from './family-content'

/**
 * A shell. Every read this screen needs now runs in the browser against the
 * React Query cache — see `family-content.tsx`.
 *
 * The route itself stays a server route, so middleware still gates it and the
 * `(app)` layout still redirects an unauthenticated or family-less user before
 * anything renders. What moved is the data, not the gate.
 */
export default function FamilyPage() {
  return <FamilyContent />
}
