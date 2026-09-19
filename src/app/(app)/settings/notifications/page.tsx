import { NotificationSettingsContent } from './notification-settings-content'

/**
 * No `force-dynamic`. It was here to stop Next caching a server read that also
 * *inserted* a default preferences row during render — a GET page that wrote,
 * on every visit. Both now live in `notification-settings-content.tsx`, the read
 * as a query and the insert as an explicit upsert mutation, so there is no
 * server-rendered per-user data left for it to protect.
 */
export default function NotificationSettingsPage() {
  return <NotificationSettingsContent />
}
