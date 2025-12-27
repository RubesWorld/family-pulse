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

*Last updated: 2025-12-26*
