# Family Pulse - Development Learnings

This document captures important technical concepts and patterns discovered during development.

---

## 1. Row Level Security (RLS) in Databases

### What is RLS?

Row Level Security (RLS) is a PostgreSQL feature that allows you to control which rows users can access in database tables. Instead of granting blanket access to entire tables, RLS lets you define policies that determine which specific rows each user can see, insert, update, or delete.

### Why It's Critical for This App

In Family Pulse, RLS is **essential** because:

1. **Multi-tenant architecture**: Multiple families use the same database tables
2. **Data isolation**: Family A should never see Family B's data
3. **Security at the database level**: Even if application code has bugs, the database enforces access control
4. **Supabase requirement**: Without RLS, your tables are either completely public or completely private

### Example: How We Use RLS

```sql
-- Users can only see family members from their own family
create policy "Users can view family members"
  on users for select
  using (
    family_id = (select family_id from users where id = auth.uid())
  );

-- Users can only see activities from their family members
create policy "Users can view family activities"
  on activities for select
  using (
    user_id in (
      select id from users
      where family_id = (select family_id from users where id = auth.uid())
    )
  );
```

### What Happens Without RLS?

❌ **Without RLS**: A user could potentially query ALL users or ALL activities in the database
✅ **With RLS**: Users automatically only see data from their own family

### Research Topics

- PostgreSQL Row Level Security documentation
- Supabase RLS policies best practices
- Multi-tenant database architectures
- Performance implications of complex RLS policies

---

## 2. Supabase Auth vs Application User Tables

### The Two-Table Pattern

In Supabase applications, user data lives in **two separate places**:

#### `auth.users` (Managed by Supabase Auth)
- **Purpose**: Authentication credentials and metadata
- **Contains**: email, encrypted password, email confirmation status, OAuth tokens
- **Access**: Managed entirely by Supabase Auth service
- **You CANNOT**: Directly insert/update this table via normal SQL
- **Primary Key**: `id` (UUID)

#### `public.users` (Your Application Table)
- **Purpose**: Application-specific user data (profile info)
- **Contains**: name, avatar, family_id, location, occupation, bio, phone_number, etc.
- **Access**: You manage this via your app code
- **You CAN**: Insert, update, delete freely (with RLS policies)
- **Primary Key**: `id` (UUID) - **MUST match** `auth.users.id`

### Why This Separation Exists

1. **Security**: Authentication data is isolated from application data
2. **Flexibility**: You can customize your user profile structure without affecting auth
3. **Supabase Auth magic**: Email verification, password resets, OAuth - all handled automatically
4. **Clean separation**: Auth concerns vs. application concerns

### The Link Between Them

The connection happens via the **UUID**:

```typescript
// When a user signs up:
const { data: authData } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// authData.user.id is the UUID

// Then create their profile:
await supabase.from('users').insert({
  id: authData.user.id,  // ← Link to auth.users
  name: 'John Doe',
  family_id: familyId
})
```

### Common Pattern: `auth.uid()`

In SQL and RLS policies, `auth.uid()` returns the currently authenticated user's ID:

```sql
-- Get current user's profile
SELECT * FROM users WHERE id = auth.uid();

-- RLS policy using auth.uid()
create policy "Users can update own profile"
  on users for update
  using (id = auth.uid())
  with check (id = auth.uid());
```

### Why We Removed Email from `public.users`

Initially, you might think: "Why not store email in both tables?"

**Problems with duplicating email:**
1. **Data duplication**: Email exists in `auth.users`, no need to duplicate
2. **Sync issues**: If user changes email via Supabase Auth, your table is out of sync
3. **Single source of truth**: `auth.users` should be the only place for auth data

**How to access email when needed:**
```typescript
// Get auth user (includes email)
const { data: { user } } = await supabase.auth.getUser()
console.log(user.email) // ✅ From auth.users

// Get profile data
const { data: profile } = await supabase
  .from('users')
  .select('name, location, occupation')
  .eq('id', user.id)
  .single()
```

### The Bug We Hit

```sql
-- ❌ This failed because `users` table has no email column:
INSERT INTO users (id, name, email, family_id, ...)
VALUES (uuid, 'Test User', 'test@example.com', ...)

-- ✅ Correct approach:
INSERT INTO users (id, name, family_id, ...)
VALUES (uuid, 'Test User', ...)
-- Email is already in auth.users from signup
```

### Key Takeaways

1. **Auth data** (email, password) → `auth.users` (managed by Supabase)
2. **Profile data** (name, bio, phone) → `public.users` (managed by you)
3. **Link them** via matching UUIDs (`auth.users.id` = `public.users.id`)
4. **Access email** via `supabase.auth.getUser()`, not from your tables
5. **RLS policies** use `auth.uid()` to identify the current user

### Foreign Key Constraint: `users_id_fkey`

Our database has a foreign key constraint linking `public.users.id` to `auth.users.id`:

```sql
-- This constraint exists in our schema:
ALTER TABLE users
  ADD CONSTRAINT users_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id);
```

**What this means:**
- You CANNOT insert into `public.users` with a random UUID
- The UUID must ALREADY exist in `auth.users` first
- Users must sign up via Supabase Auth before you can add their profile

**Why this is good:**
- Ensures data integrity - no orphaned profiles
- Every profile is guaranteed to have a valid auth account
- Prevents accidental data corruption

**Implications for testing:**
- Can't create test data with fake user IDs
- Must create real auth accounts first, then add profile data
- See `test-family-simple.sql` and `add-test-member.sql` for workarounds

### Research Topics

- Supabase Auth documentation
- Database normalization and single source of truth
- OAuth vs email/password authentication
- Supabase Auth triggers (auto-create profile on signup)
- JWT tokens and how Supabase Auth works under the hood
- Foreign key constraints and referential integrity

---

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Deep Dive](https://supabase.com/docs/guides/auth)
- [PostgreSQL RLS Official Docs](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Multi-tenant Database Design Patterns](https://www.citusdata.com/blog/2016/10/03/designing-your-saas-database-for-high-scalability/)

---

## 3. Service Workers and Push Notifications

### What are Service Workers?

A Service Worker is a JavaScript file that runs in the background, separate from your web page. It acts as a proxy between your web app and the network, enabling features like:

1. **Push notifications** - Receive and display notifications even when the app isn't open
2. **Offline functionality** - Cache resources for offline access
3. **Background sync** - Sync data when connectivity is restored

### Key Characteristics

- **Separate thread**: Runs independently from the main JavaScript thread
- **No DOM access**: Cannot directly manipulate the page
- **Event-driven**: Responds to events (push, fetch, sync)
- **HTTPS required**: Only works on secure origins (localhost is OK for development)
- **Scope-based**: Controls pages within its registered scope

### Service Worker Lifecycle

```javascript
// 1. REGISTRATION - From your main app
navigator.serviceWorker.register('/sw.js', {
  scope: '/',
  updateViaCache: 'none',
})

// 2. INSTALLATION - In sw.js
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed')
  self.skipWaiting() // Activate immediately
})

// 3. ACTIVATION - In sw.js
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated')
  event.waitUntil(clients.claim()) // Take control of all pages
})

// 4. FUNCTIONAL - Now handling events
self.addEventListener('push', (event) => {
  // Handle push notifications
})
```

### Web Push Notifications Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │─────▶│ Push Service │◀─────│ Your Server │
│  (Client)   │      │   (Google,   │      │   (API)     │
│             │      │   Mozilla)   │      │             │
└─────────────┘      └──────────────┘      └─────────────┘
      │                                            ▲
      │                                            │
      │ 1. Subscribe                               │
      │ 2. Get subscription object                 │
      │ 3. Send subscription to server ───────────┘
      │ 4. Server sends push via Push Service
      │ 5. Browser receives push
      │ 6. Service worker shows notification
      └──────────────────────────────────────────────
```

### VAPID Keys (Voluntary Application Server Identification)

#### What are VAPID Keys?

VAPID keys are a pair of cryptographic keys (public and private) that identify your application to push services. They prove that push notifications are coming from your authorized server.

#### Why We Need Them

1. **Authentication**: Proves you own the application sending notifications
2. **Security**: Prevents unauthorized parties from sending notifications to your users
3. **Identification**: Push services can contact you if there are issues
4. **Standard**: Required by modern push notification services (FCM, Mozilla Push)

#### The Two Keys

```bash
# PUBLIC KEY (NEXT_PUBLIC_VAPID_PUBLIC_KEY)
# - Shared with browsers during subscription
# - Safe to expose in client-side code
# - Used to encrypt subscription data
BI9UEdk_AQyvwAt1qPsFcx6UDclw3pdZaAB4qTvDj7Fwn4-JAJBqAESdSKXvMvYMtP_iIuAgzmhXAx91ekoqxaU

# PRIVATE KEY (VAPID_PRIVATE_KEY)
# - NEVER expose to client
# - Kept secret on server
# - Used to sign push messages
vR4etrJCaypxqDLN3rTYZGviuVNiiQaBMUu7f2RJhZo
```

#### Generating VAPID Keys

```bash
# Method 1: Using web-push library
npx web-push generate-vapid-keys

# Method 2: Using openssl
openssl ecparam -genkey -name prime256v1 -out private_key.pem
openssl ec -in private_key.pem -pubout -out public_key.pem
```

### How Push Notifications Work in Our App

#### Step 1: User Enables Notifications

```typescript
// Client-side: src/lib/push.ts
export async function enablePushNotifications(): Promise<boolean> {
  // 1. Register service worker
  const registration = await navigator.serviceWorker.register('/sw.js')

  // 2. Request browser permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  // 3. Subscribe to push with VAPID public key
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  })

  // 4. Save subscription to database
  await saveSubscriptionToServer(subscription)
  return true
}
```

#### Step 2: Server Sends Notification

```typescript
// Server-side: src/lib/send-push.ts
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:noreply@familypulse.app',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

export async function sendPushNotification({ userId, title, body }) {
  // 1. Get user's push subscription from database
  const subscription = await getSubscription(userId)

  // 2. Prepare notification payload
  const payload = JSON.stringify({ title, body, url: '/connect' })

  // 3. Send via web-push (uses VAPID private key to sign)
  await webpush.sendNotification(subscription, payload)
}
```

#### Step 3: Service Worker Receives Push

```javascript
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data.json()

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})
```

#### Step 4: User Clicks Notification

```javascript
// public/sw.js
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/connect'

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window or open new one
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
```

### Push Subscription Object

When a user subscribes, the browser creates a subscription object:

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/abc123...",
  "keys": {
    "p256dh": "BKj3...encryption key...",
    "auth": "xyz789...authentication secret..."
  }
}
```

**We store this in the database:**
- `endpoint`: Unique URL for this device/browser
- `p256dh`: Public key for encrypting messages to this device
- `auth`: Authentication secret for this subscription

### Security Considerations

1. **HTTPS Only**: Service Workers only work on HTTPS (except localhost)
2. **Private Key Security**: VAPID private key must NEVER be exposed to client
3. **Subscription Validation**: Verify subscriptions before sending
4. **Failed Subscription Handling**: Remove invalid subscriptions (410 Gone)
5. **User Consent**: Always request permission, never force notifications

### Common Pitfalls

❌ **Service worker not updating**
```javascript
// Force update on install
self.addEventListener('install', (event) => {
  self.skipWaiting() // ✅ Activate immediately
})
```

❌ **VAPID keys exposed**
```typescript
// ❌ NEVER do this:
const VAPID_PRIVATE_KEY = 'abc123' // In client code

// ✅ Only in server code:
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
```

❌ **Subscription not saved**
```typescript
// After subscribing, MUST save to database
const subscription = await registration.pushManager.subscribe(...)
await saveSubscriptionToServer(subscription) // ✅ Don't forget!
```

### Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Workers | ✅ | ✅ | ✅ | ✅ |
| Push API | ✅ | ✅ | ⚠️ Limited | ✅ |
| VAPID | ✅ | ✅ | ⚠️ 16.4+ | ✅ |

**Safari Note**: iOS Safari requires PWA installation (Add to Home Screen) before push works.

### Testing Service Workers

```bash
# Chrome DevTools
1. Open DevTools → Application tab
2. Click "Service Workers" section
3. See status: installed, activated, running
4. Use "Update" to test updates
5. Use "Unregister" to remove

# Firefox DevTools
1. Open DevTools → Application tab (storage icon)
2. Click "Service Workers"
3. View registration details
```

### Debugging Push Notifications

```javascript
// In service worker (sw.js)
self.addEventListener('push', (event) => {
  console.log('Push received:', event) // Check browser console

  // Check if data exists
  if (!event.data) {
    console.log('Push event but no data')
    return
  }

  try {
    const data = event.data.json()
    console.log('Push data:', data)
    // ... show notification
  } catch (error) {
    console.error('Error parsing push data:', error)
  }
})
```

### Our Implementation: Tiered Notification System

We built a smart notification system with three tiers:

**Tier 1 - Critical** (Always on)
- Your turn to choose question
- Pending question reminders

**Tier 2 - Engagement** (Default on)
- Last to answer
- Weekly digest

**Tier 3 - Optional** (Default off)
- New activities
- New answers
- New picks

**Plus quiet hours** (9pm-9am default) to prevent spam!

### Troubleshooting: Expired Push Subscriptions

Push subscriptions can expire or become invalid when:
- Service worker is unregistered
- Browser cache is cleared
- User tests on multiple browsers/devices
- FCM/browser service invalidates the subscription

**Symptoms:**
- Error: `WebPushError: Received unexpected response code` with `statusCode: 410`
- Message: `push subscription has unsubscribed or expired`
- Notification doesn't appear even though code succeeds

**How Our System Handles This:**

The `send-push.ts` automatically handles expired subscriptions:

```typescript
catch (error) {
  // If subscription is invalid (410 Gone or 404 Not Found), mark as inactive
  if (error.statusCode === 410 || error.statusCode === 404) {
    await supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .eq('id', subscription.id)
  }
}
```

**Manual Cleanup (When Testing):**

If you're getting 410 errors during testing and notifications aren't appearing, clean up old subscriptions:

```sql
-- 1. Check your current subscriptions
SELECT id, endpoint, is_active, created_at
FROM push_subscriptions
WHERE user_id = auth.uid();

-- 2. Mark ALL your subscriptions as inactive
UPDATE push_subscriptions
SET is_active = false
WHERE user_id = auth.uid();

-- 3. Verify they're all inactive
SELECT id, endpoint, is_active, created_at
FROM push_subscriptions
WHERE user_id = auth.uid();
```

Then in your app:
1. Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
2. Click "Enable Notifications" to create a fresh subscription
3. Test again - should work now!

**Why This Happens During Development:**

During testing, you might:
- Unregister service workers manually in DevTools
- Clear browser cache/storage
- Test in multiple browsers
- Restart dev server (service worker endpoint changes)

Each creates a new subscription in the database, but browser only keeps the latest one valid. Old subscriptions become "orphaned" and return 410 errors.

**Production Consideration:**

In production, this is less common because:
- Service workers stay registered
- Users don't clear cache as often
- Automatic cleanup happens via the 410 handler

However, you should periodically clean up very old inactive subscriptions:

```sql
-- Delete subscriptions inactive for more than 30 days (run as cron job)
DELETE FROM push_subscriptions
WHERE is_active = false
  AND last_used_at < NOW() - INTERVAL '30 days';
```

### Key Takeaways

1. **Service Workers** run in background, separate from main thread
2. **VAPID keys** authenticate your server to push services
3. **Public key** goes to client, **private key** stays on server
4. **Subscription object** must be saved to database
5. **HTTPS required** for production (localhost OK for dev)
6. **User permission** is required before any notifications
7. **Handle failures** gracefully (expired subscriptions, denied permission)
8. **410 errors** mean subscription expired - auto-deactivate and create new one

### Research Topics

- Service Worker API documentation
- Web Push Protocol (RFC 8030)
- Push API specification
- Progressive Web Apps (PWA)
- Background Sync API
- Notification API
- Cache API for offline functionality
- Workbox library for advanced service worker patterns

---

## 4. Environment Variables and Secrets Management

### What are Environment Variables?

Environment variables are configuration values stored outside your code that can change between environments (development, staging, production). They're essential for:

1. **Security**: Keeping secrets out of your codebase
2. **Flexibility**: Different values for dev vs production
3. **Collaboration**: Each developer can have their own values
4. **Safety**: Secrets never get committed to git

### Types of Environment Variables

#### Public Variables (NEXT_PUBLIC_*)

```bash
# These CAN be exposed to the browser
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BI9UEdk_AQyvwAt1qPsFcx6UDclw3pdZaAB4qTvDj7Fwn4...
```

- **Prefix**: `NEXT_PUBLIC_`
- **Access**: Available in both client and server code
- **Security**: Safe to expose (they'll be in browser bundles)
- **Use Case**: API URLs, public keys, feature flags

#### Private Variables (Server-Only)

```bash
# These are ONLY available on the server
VAPID_PRIVATE_KEY=vR4etrJCaypxqDLN3rTYZGviuVNiiQaBMUu7f2RJhZo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
INTERNAL_API_SECRET=c0d79fadd9ec72c4a90457b57e6c9bada0b9928a408388ec...
CRON_SECRET=2e3a0147637b475aa1a46a570a47b8bdd4715898a4145d6eb...
```

- **No prefix**: Standard environment variable
- **Access**: Only in server-side code (API routes, server components)
- **Security**: NEVER exposed to browser
- **Use Case**: Database credentials, API keys, secrets

### Generating Secrets

For secrets like `INTERNAL_API_SECRET` and `CRON_SECRET`, you generate random cryptographic values:

```bash
# Generate a 256-bit (32-byte) random hex string
openssl rand -hex 32

# Output: c0d79fadd9ec72c4a90457b57e6c9bada0b9928a408388ec470e25c24aca5c9d
```

**Why random secrets?**
- Unpredictable: Can't be guessed
- Unique: Different for each environment
- Cryptographically secure: Uses proper random generation

### Our Environment Variables

#### From Supabase Dashboard

```bash
# 1. Go to: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://jzeajqxgadhwwlifeday.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 2. Go to: Supabase Dashboard → Settings → API → Service Role Key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Generated by Us

```bash
# Using web-push library
npx web-push generate-vapid-keys

NEXT_PUBLIC_VAPID_PUBLIC_KEY=BI9UEdk_AQyvwAt1qPsFcx6UDclw3pdZaAB4qTvDj7Fwn4...
VAPID_PRIVATE_KEY=vR4etrJCaypxqDLN3rTYZGviuVNiiQaBMUu7f2RJhZo

# Using openssl for random secrets
INTERNAL_API_SECRET=$(openssl rand -hex 32)
CRON_SECRET=$(openssl rand -hex 32)
```

### File Structure

```
.env.local              # Local development (gitignored)
.env.example            # Template (committed to git)
.env.production         # Production values (never commit!)
```

**Important**: `.env.local` is in `.gitignore` - it NEVER gets committed!

### Purpose of Each Secret

#### SUPABASE_SERVICE_ROLE_KEY
- **What**: Full admin access to your Supabase database
- **Why**: Server-side operations that bypass RLS
- **Used in**: `src/lib/send-push.ts` to query all users for notifications
- **Security**: NEVER expose to client - has unrestricted database access

#### INTERNAL_API_SECRET
- **What**: Password for internal API endpoints
- **Why**: Prevents unauthorized calls to `/api/notifications/send`
- **Used in**: Protecting server-to-server API calls
- **Example**:
```typescript
// API endpoint checks this:
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

#### CRON_SECRET
- **What**: Password for scheduled job endpoints
- **Why**: Prevents unauthorized triggering of cron jobs
- **Used in**: `/api/cron/rotate-questions` endpoint
- **Example**:
```typescript
// Vercel Cron sends this header:
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

#### VAPID_PRIVATE_KEY
- **What**: Private key for signing web push notifications
- **Why**: Authenticates your server to push services
- **Used in**: `web-push` library to send notifications
- **Security**: Must stay secret - paired with public key

### Vercel Deployment

When deploying to Vercel, you must add all environment variables:

1. Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `your-actual-service-role-key`
   - Environment: Production, Preview, Development
3. Redeploy after adding variables

**Critical**: Environment variables are only loaded at build time. Changes require redeployment!

### Common Mistakes

❌ **Committing secrets to git**
```bash
# NEVER do this:
git add .env.local
```

❌ **Using NEXT_PUBLIC_ for secrets**
```bash
# ❌ This exposes your private key!
NEXT_PUBLIC_VAPID_PRIVATE_KEY=vR4etrJCaypxqDLN3rTYZGviuVNiiQaBMUu7f2RJhZo

# ✅ Correct:
VAPID_PRIVATE_KEY=vR4etrJCaypxqDLN3rTYZGviuVNiiQaBMUu7f2RJhZo
```

❌ **Accessing server-only vars in client code**
```typescript
// ❌ This will be undefined in the browser:
const secret = process.env.INTERNAL_API_SECRET

// ✅ Only use in API routes or server components
```

❌ **Forgetting to update Vercel**
```bash
# Add to .env.local ✓
# Add to Vercel ✗ (forgot!)
# Result: Works locally, fails in production
```

### Security Best Practices

1. **Never commit** `.env.local` or any file with real secrets
2. **Rotate secrets** if they're ever exposed
3. **Use different secrets** for each environment (dev, staging, prod)
4. **Minimum access**: Only grant necessary permissions
5. **Regular audits**: Review who has access to secrets
6. **Service accounts**: Use dedicated keys for services, not personal keys

### Checking Environment Variables

```typescript
// Server-side: API route or server component
export default function ServerComponent() {
  console.log('Server vars:', {
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasInternalSecret: !!process.env.INTERNAL_API_SECRET,
    // Never log the actual values!
  })
}

// Client-side: Only NEXT_PUBLIC_ vars available
export default function ClientComponent() {
  console.log('Public URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Private key:', process.env.VAPID_PRIVATE_KEY) // undefined!
}
```

### Key Takeaways

1. **NEXT_PUBLIC_*** = Safe to expose, available everywhere
2. **No prefix** = Server-only, never exposed to client
3. **Generate secrets** with `openssl rand -hex 32`
4. **Get from dashboard** for service credentials (Supabase, etc.)
5. **.env.local** is gitignored, never commit it
6. **Update Vercel** environment variables after local changes
7. **Rotate immediately** if a secret is ever exposed

### Research Topics

- Next.js environment variables documentation
- Twelve-Factor App methodology
- Secrets management best practices
- Environment variable security
- OpenSSL random number generation
- Cryptographic key management
- Vercel environment variables

---

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Deep Dive](https://supabase.com/docs/guides/auth)
- [PostgreSQL RLS Official Docs](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Multi-tenant Database Design Patterns](https://www.citusdata.com/blog/2016/10/03/designing-your-saas-database-for-high-scalability/)
- [Service Worker API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Web Push Protocol (RFC 8030)](https://datatracker.ietf.org/doc/html/rfc8030)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)
- [web-push npm library](https://github.com/web-push-libs/web-push)

---

## 5. Build-Time vs Runtime: Lazy Initialization Pattern

### The Problem: Module-Level Code During Builds

When deploying Next.js applications, you might encounter errors like:

```
Error: No key set vapidDetails.publicKey
    at c.setVapidDetails
    at 4798 (/vercel/path0/.next/server/app/api/cron/rotate-questions/route.js:1:4494)

> Build error occurred
Error: Failed to collect page data for /api/cron/rotate-questions
```

This happens because **Next.js analyzes all routes during build time**, even dynamic API routes and cron jobs.

### What Happens During Build

```typescript
// ❌ This runs during build (when environment variables might not exist)
import webpush from 'web-push'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!

webpush.setVapidDetails('mailto:app@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
//      ^^^^^^^^^^^^^^^^ FAILS at build time!

export async function sendNotification() {
  // Function code...
}
```

**The problem:**
1. Next.js imports your API route during build for static analysis
2. Module-level code executes immediately
3. `webpush.setVapidDetails()` runs before environment variables are available
4. Build fails with cryptic error messages

### Build-Time vs Runtime

| Phase | When | Environment Variables | Purpose |
|-------|------|----------------------|---------|
| **Build Time** | During `next build` | Limited/None | Static analysis, type checking, optimization |
| **Runtime** | When request hits server | All available | Actual request handling |

**Key insight**: Module-level code (outside functions) runs at **build time**, not runtime!

### The Solution: Lazy Initialization

Move initialization into functions that only run when actually called:

```typescript
// ✅ Lazy initialization - only runs at runtime
import webpush from 'web-push'

let vapidInitialized = false

function initializeVapid() {
  if (vapidInitialized) return

  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!
  const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:noreply@example.com'

  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  vapidInitialized = true
}

export async function sendNotification() {
  initializeVapid() // ✅ Called at runtime, when env vars exist
  // Function code...
}
```

### Pattern: Lazy Database Clients

The same pattern applies to database connections:

```typescript
// ❌ Module-level initialization (runs at build time)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,    // Might not exist at build time
  process.env.SUPABASE_SERVICE_ROLE_KEY!     // Might not exist at build time
)

// ✅ Lazy initialization (runs at runtime)
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function sendNotification() {
  const supabase = getSupabaseClient() // ✅ Created at runtime
  // Use supabase...
}
```

### Our Implementation

**Before (fails in production builds):**

```typescript
// src/lib/send-push.ts
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!

webpush.setVapidDetails('mailto:app@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function sendPushNotification({ userId, title, body }) {
  // Uses supabase and webpush...
}
```

**After (works in all environments):**

```typescript
// src/lib/send-push.ts
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

let vapidInitialized = false

function initializeVapid() {
  if (vapidInitialized) return

  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!
  const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:noreply@example.com'

  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  vapidInitialized = true
}

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function sendPushNotification({ userId, title, body }) {
  initializeVapid()                    // ✅ Initialize at runtime
  const supabase = getSupabaseClient() // ✅ Create at runtime
  // Uses supabase and webpush...
}
```

### When to Use Lazy Initialization

✅ **Use lazy initialization when:**
- Accessing environment variables (especially server-only)
- Initializing third-party services (database, push, email)
- Setting up connections or clients
- Calling functions with side effects
- Module is imported by API routes or cron jobs

❌ **Don't need lazy initialization for:**
- Importing pure functions or constants
- Type definitions and interfaces
- Simple variable declarations
- Client-side code (not analyzed at build time)

### Other Things That Run at Build Time

```typescript
// ❌ All of these run during build:

const db = initializeDatabase()           // Database connection
const cache = new Redis(process.env.REDIS_URL)  // Redis connection
fs.readFileSync('/path/to/file')         // File system operations
console.log('Module loaded!')            // Console output (in build logs)
sendAnalyticsEvent('module_loaded')      // External API calls

// ✅ Move them into functions:
function getDb() { return initializeDatabase() }
function getCache() { return new Redis(process.env.REDIS_URL) }
function loadData() { return fs.readFileSync('/path/to/file') }
```

### Debugging Build-Time Errors

**Symptoms:**
- ✅ Works locally with `npm run dev`
- ❌ Fails in `npm run build` or Vercel deployment
- Error mentions "during build" or "collecting page data"
- Error traces back to API route or cron job import

**How to debug:**

1. **Check if module-level code exists:**
```typescript
// Look for code OUTSIDE functions at top of file
```

2. **Run build locally:**
```bash
npm run build
# Will reproduce the same error as Vercel
```

3. **Check environment variables:**
```typescript
// Add debugging in the function that fails:
console.log('Has env var:', !!process.env.SOME_VAR)
```

4. **Move to lazy initialization:**
```typescript
// Wrap in a function, call when actually needed
```

### TypeScript Type Issues in Builds

Sometimes TypeScript errors only appear in production builds:

```
Type error: Type 'Uint8Array<ArrayBufferLike>' is not assignable to type 'ArrayBuffer'
```

**Why?** Production builds use stricter TypeScript settings (`tsc --noEmit`).

**Solution:** Add type assertions or explicit types:

```typescript
// ❌ TypeScript infers loose type
const arr = new Uint8Array(rawData.length)

// ✅ Explicit ArrayBuffer type
const buffer = new ArrayBuffer(rawData.length)
const arr = new Uint8Array(buffer)

// ✅ Or use type assertion
const arr = new Uint8Array(rawData.length) as BufferSource
```

### Key Takeaways

1. **Module-level code** runs during build, not runtime
2. **Environment variables** might not exist at build time
3. **Lazy initialization** = wrap in functions, call when needed
4. **`if (initialized) return`** prevents double initialization
5. **Test builds locally** with `npm run build` before deploying
6. **Check build logs** for "collecting page data" errors
7. **API routes and cron jobs** are analyzed during build

### Best Practice Pattern

```typescript
// src/lib/your-service.ts

// 1. Import dependencies
import SomeService from 'some-service'

// 2. Track initialization state
let serviceInitialized = false
let serviceInstance: SomeService | null = null

// 3. Create lazy initializer
function getService() {
  if (serviceInitialized && serviceInstance) {
    return serviceInstance
  }

  // Initialize with environment variables
  serviceInstance = new SomeService({
    apiKey: process.env.SERVICE_API_KEY!,
    url: process.env.SERVICE_URL!
  })

  serviceInitialized = true
  return serviceInstance
}

// 4. Export functions that use the service
export async function doSomething() {
  const service = getService() // ✅ Initialized at runtime
  return await service.execute()
}
```

### Research Topics

- Next.js build process and static optimization
- Module-level side effects in JavaScript
- Singleton pattern and lazy initialization
- Environment variable injection in CI/CD
- TypeScript strict mode and type inference
- Build-time vs runtime in static site generators

---

*Last updated: 2025-12-29*
