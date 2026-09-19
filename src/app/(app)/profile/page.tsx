import { ProfileContent } from './profile-content'

/**
 * A shell. The three reads this screen used to run on the server — own recent
 * activities, own interest cards, own current picks — now run in the browser
 * against the React Query cache, and the editors below invalidate that cache
 * instead of asking Next to re-render the route. See `profile-content.tsx`.
 *
 * The route stays a server route, so middleware still gates it and the `(app)`
 * layout still redirects an unauthenticated or family-less user before anything
 * renders. What moved is the data, not the gate.
 */
export default function ProfilePage() {
  return <ProfileContent />
}
