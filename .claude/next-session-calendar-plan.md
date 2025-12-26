# Calendar View - Implementation Plan

**Goal:** Add month calendar view to feed page with toggle between list/calendar, allowing users to click days to add activities with pre-filled dates.

---

## Feature Scope

**What we're building:**
- Month calendar grid showing family activities
- Toggle button in feed header (List ↔ Calendar)
- Feed view remains the default
- Click any day → open Add Activity with that date pre-filled
- Activities with `starts_at` dates show on calendar
- Activities without dates only show in feed view

**User answers:**
- ✅ Month view only (not week view)
- ✅ Toggle on feed page (feed is default)
- ✅ Click day to add activity with pre-filled date

---

## Architecture Overview

### Current Feed Structure
```
Feed Page (Server Component)
├── Fetches all activities with user data
├── FeedHeader (Client) - Family name, invite button
└── List of ActivityCards
```

### New Structure
```
Feed Page (Converted to Client Wrapper)
├── Fetches activities (server action or client fetch)
├── FeedHeader (Client) - Family name, invite, VIEW TOGGLE
└── Conditional rendering:
    ├── If view === 'feed': List of ActivityCards
    └── If view === 'calendar': CalendarView component
```

---

## Phase 1: Add Toggle to Feed Header

### 1.1 Update FeedHeader component

**File:** `src/app/(app)/feed/feed-header.tsx`

**Changes:**
- Add view state: `'feed' | 'calendar'`
- Add toggle button group (List icon vs Calendar icon)
- Pass view and setView to parent component via props
- Style: Use outlined button for inactive, filled for active

**UI Design:**
```
┌─────────────────────────────────────────┐
│ Family Pulse          [List] [Cal] [📤]│
│ Family Name                             │
└─────────────────────────────────────────┘
```

Icons:
- List view: `List` from lucide-react
- Calendar view: `Calendar` from lucide-react
- Keep Invite/Share button on the right

---

## Phase 2: Create Calendar View Component

### 2.1 Build month calendar component

**New file:** `src/components/calendar-view.tsx`

**Features:**
- Month grid (7 columns for days of week)
- Navigation: Previous/Next month buttons
- Current month/year display
- Today highlighting
- Activity dots/badges on days with events
- Click day → navigate to Add page with date param

**Data Structure:**
```typescript
interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  activities: ActivityWithUser[]
}
```

**Layout:**
```
┌─────────────────────────────────────────┐
│      ← December 2025 →                  │
├──────┬──────┬──────┬──────┬──────┬──────┤
│ Sun  │ Mon  │ Tue  │ Wed  │ Thu  │ Fri  │ Sat
├──────┼──────┼──────┼──────┼──────┼──────┤
│  1   │  2   │  3   │  4   │  5   │  6   │  7
│      │  •   │      │      │  ••  │      │
├──────┼──────┼──────┼──────┼──────┼──────┤
...
```

**Implementation Details:**
- Use `date-fns` for date manipulation:
  - `startOfMonth`, `endOfMonth`, `eachDayOfInterval`
  - `format`, `isToday`, `isSameMonth`
  - `addMonths`, `subMonths`
- Group activities by date (use `starts_at` field)
- Days with activities: Show blue dot(s) indicating count
- Mobile-friendly: Smaller text, touch-friendly day cells
- Click handler: `router.push(`/add?date=${format(date, 'yyyy-MM-dd')}`)

### 2.2 Activity grouping logic

```typescript
function groupActivitiesByDate(activities: ActivityWithUser[]) {
  const grouped = new Map<string, ActivityWithUser[]>()

  activities.forEach(activity => {
    if (!activity.starts_at) return
    const dateKey = format(new Date(activity.starts_at), 'yyyy-MM-dd')
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push(activity)
  })

  return grouped
}
```

---

## Phase 3: Update Feed Page

### 3.1 Convert feed page to support client-side view toggle

**File:** `src/app/(app)/feed/page.tsx`

**Option A: Client Wrapper Approach** (Recommended)
- Keep server component for initial data fetch
- Create `FeedContent` client component
- Pass data to client component
- Client component manages view state

**Option B: Full Client Component**
- Convert page to client component
- Fetch data with `useEffect` + Supabase client
- Manage view state in page component

**Recommended: Option A** (cleaner separation)

**New structure:**
```typescript
// page.tsx (Server Component)
export default async function FeedPage() {
  const activities = await fetchActivities() // server-side
  return <FeedContent initialActivities={activities} />
}

// feed-content.tsx (Client Component)
'use client'
export function FeedContent({ initialActivities }) {
  const [view, setView] = useState<'feed' | 'calendar'>('feed')

  return (
    <>
      <FeedHeader view={view} onViewChange={setView} ... />
      {view === 'feed' ? (
        <ActivityList activities={initialActivities} />
      ) : (
        <CalendarView activities={initialActivities} />
      )}
    </>
  )
}
```

---

## Phase 4: Update Add Activity Page

### 4.1 Support pre-filled date from URL params

**File:** `src/app/(app)/add/page.tsx`

**Changes:**
- Read `date` param from URL: `useSearchParams().get('date')`
- If date param exists, pre-fill `startsAt` field
- Convert `yyyy-MM-dd` to `datetime-local` input format

**Example flow:**
1. User clicks Dec 25 on calendar
2. Navigates to `/add?date=2025-12-25`
3. Form loads with date field pre-filled to Dec 25, 12:00 PM
4. User adds title, description, submits
5. Redirects back to feed (calendar view shows new activity)

---

## Phase 5: Polish & UX

### 5.1 Calendar day popover (optional enhancement)

When clicking a day with existing activities:
- Show popover with list of activities
- "Add New" button at bottom
- Quick view without leaving calendar

### 5.2 Empty states
- Calendar with no activities: "No activities scheduled. Click a day to add one!"
- Feed with no activities: Existing empty state

### 5.3 Activity count badge
- In feed header, show count: "5 scheduled activities" when in calendar view
- Visual indicator of how many events are planned

---

## Files to Create/Modify

**New files:**
1. `src/components/calendar-view.tsx` - Month calendar component
2. `src/app/(app)/feed/feed-content.tsx` - Client wrapper for feed

**Modified files:**
1. `src/app/(app)/feed/feed-header.tsx` - Add view toggle buttons
2. `src/app/(app)/feed/page.tsx` - Use new FeedContent wrapper
3. `src/app/(app)/add/page.tsx` - Support date URL param

---

## Implementation Order

1. **Calendar View Component** → Build month grid with navigation
2. **Activity Grouping** → Logic to organize activities by date
3. **Feed Header Toggle** → Add view switcher buttons
4. **Feed Content Wrapper** → Client component to manage view state
5. **Update Feed Page** → Integrate wrapper and conditional rendering
6. **Add Page Enhancement** → Support pre-filled date from URL
7. **Polish** → Empty states, loading states, responsive design

**Estimated time:** 60-75 minutes

---

## Technical Decisions

**Calendar Library vs Custom:**
- **Decision:** Build custom month view
- **Reasoning:** Simple month grid, full control over styling, no extra dependencies, smaller bundle

**Date Library:**
- **Use:** date-fns (already installed)
- **Functions needed:** `startOfMonth`, `endOfMonth`, `eachDayOfInterval`, `format`, `isToday`, `isSameMonth`, `addMonths`, `subMonths`

**View State Management:**
- **Location:** Feed content component (client-side)
- **Persistence:** None (resets to feed on page load) - can add localStorage later if needed

**Activity Filtering:**
- Calendar only shows activities with `starts_at` set
- Feed shows all activities (with or without dates)

---

## HOW TO IMPLEMENT IN NEXT SESSION

### Option 1: All at once (60-75 min, minimal check-ins)
Tell Claude: "Build the calendar feature from the plan file"
- I'll implement all 7 phases sequentially
- Only check in if something unexpected happens
- You can review at the end

### Option 2: Phase by phase (15-20 min each)
Approve each phase before moving to next:
1. "Build phase 1: calendar view component"
2. "Build phase 2: feed header toggle"
3. "Build phase 3: feed content wrapper"
4. etc.

### Option 3: Use agents (fire and forget)
Tell Claude: "Use agents to build calendar in parallel"
- I'll spin up multiple agents to work simultaneously
- Faster but requires more coordination
- Good if you want it done while you sleep

**Recommendation:** Start with Option 1 - it's the most straightforward and you can always pause if needed.
