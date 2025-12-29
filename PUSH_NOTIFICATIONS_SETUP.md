# Push Notifications Setup Guide

## Overview

The push notification system has been fully implemented with a tiered notification strategy. This guide will help you set up and test the system.

## Architecture

### Notification Tiers

1. **Tier 1 - Critical** (Always on by default)
   - `notify_your_turn`: When it's your turn to choose a weekly question
   - `notify_pending_reminder`: Reminder to choose a pending question

2. **Tier 2 - Engagement** (Default on)
   - `notify_last_to_answer`: When you're the last one who hasn't answered
   - `notify_weekly_digest`: Weekly summary of family activity

3. **Tier 3 - Optional** (Default off)
   - `notify_activities`: New family activities
   - `notify_answers`: New question answers
   - `notify_picks`: Updated picks

### Features

- **Quiet Hours**: Default 9pm-9am, prevents notification spam
- **Multi-device Support**: Works on desktop and mobile browsers
- **Subscription Management**: Users can enable/disable per device
- **Failed Subscription Handling**: Auto-deactivates invalid subscriptions
- **Notification Logging**: Tracks all sent notifications

## Setup Instructions

### 1. Database Migration

Run the notification migration to create the required tables:

```bash
# Connect to your Supabase project and run:
psql [your-connection-string] < supabase-migration-notifications.sql
```

This creates:
- `notification_preferences` - User notification settings
- `push_subscriptions` - Web push subscription data
- `notification_log` - Delivery tracking

### 2. Environment Variables

Update your `.env.local` file with the required secrets:

```bash
# VAPID Keys (already added)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BI9UEdk_AQyvwAt1qPsFcx6UDclw3pdZaAB4qTvDj7Fwn4-JAJBqAESdSKXvMvYMtP_iIuAgzmhXAx91ekoqxaU
VAPID_PRIVATE_KEY=vR4etrJCaypxqDLN3rTYZGviuVNiiQaBMUu7f2RJhZo

# Service Role Key - GET THIS FROM SUPABASE
# Go to: Settings > API > Service Role Key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key

# Generate random secrets for these:
INTERNAL_API_SECRET=$(openssl rand -hex 32)
CRON_SECRET=$(openssl rand -hex 32)
```

**Important**: Add these same environment variables to your Vercel project settings for production.

### 3. Vercel Configuration (Production)

Add these environment variables in Vercel:
1. Go to your project settings
2. Navigate to Environment Variables
3. Add all the variables from `.env.local`
4. Redeploy

## Testing

### Option 1: Test Page (Development)

Navigate to `/test-notifications` in your app to:
1. Enable push notifications
2. Send test notifications
3. View debugging information
4. Check system status

### Option 2: Manual Testing

1. **Enable Notifications**:
   - Go to Settings → Notifications
   - Click "Enable Notifications"
   - Grant browser permission

2. **Send Test Notification**:
   ```bash
   curl -X POST http://localhost:3000/api/notifications/test \
     -H "Cookie: your-session-cookie"
   ```

3. **Trigger via Cron**:
   ```bash
   curl http://localhost:3000/api/cron/rotate-questions \
     -H "Authorization: Bearer your-cron-secret"
   ```

## File Structure

### New Files Created

```
src/
├── lib/
│   ├── push.ts                           # Client-side push utilities
│   └── send-push.ts                      # Server-side push sending
├── components/
│   └── notifications/
│       └── enable-push-card.tsx          # Enable/disable UI component
├── app/
│   ├── (app)/
│   │   ├── settings/
│   │   │   └── notifications/
│   │   │       ├── page.tsx              # Settings server component
│   │   │       └── notification-settings-content.tsx  # Settings UI
│   │   └── test-notifications/
│   │       └── page.tsx                  # Test page for development
│   └── api/
│       ├── push/
│       │   ├── subscribe/route.ts        # Save subscriptions
│       │   └── unsubscribe/route.ts      # Remove subscriptions
│       └── notifications/
│           ├── send/route.ts             # Internal send endpoint
│           └── test/route.ts             # Test endpoint
└── public/
    └── sw.js                             # Service worker
```

### Modified Files

```
src/
├── types/database.ts                     # Added notification table types
└── app/api/cron/rotate-questions/route.ts  # Added notification sending
```

## How It Works

### Enabling Push Notifications

1. User clicks "Enable Notifications"
2. Browser prompts for permission
3. Service worker registers at `/sw.js`
4. Push subscription created with VAPID keys
5. Subscription saved to database via `/api/push/subscribe`
6. Default notification preferences created

### Sending Notifications

1. Event occurs (e.g., cron creates new question)
2. `sendPushNotification()` called with user ID and content
3. Checks user preferences and quiet hours
4. Gets active push subscriptions
5. Sends via web-push library
6. Logs to notification_log table
7. Handles failed subscriptions (marks inactive)

### Receiving Notifications

1. Service worker receives push event
2. Shows browser notification
3. User clicks notification
4. Opens app at specified URL
5. Focuses existing tab or opens new one

## Troubleshooting

### "Push notifications not supported"
- **Issue**: Browser doesn't support push API
- **Fix**: Test on Chrome, Firefox, or Edge (not Safari)

### "Notifications blocked"
- **Issue**: User denied permission
- **Fix**: Clear site settings and try again

### "No active subscriptions found"
- **Issue**: User hasn't enabled push
- **Fix**: Go to settings and enable notifications

### Service worker not activating
- **Issue**: Service worker registration failed
- **Fix**: Check browser console, verify `/sw.js` is accessible

### Notifications not sending
- **Issue**: Missing environment variables
- **Fix**: Verify all env vars are set correctly

## Browser Support

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome  | ✅      | ✅     |
| Firefox | ✅      | ✅     |
| Edge    | ✅      | ✅     |
| Safari  | ⚠️ Limited | ⚠️ Limited |
| Opera   | ✅      | ✅     |

**Note**: Safari has limited support for web push. iOS Safari requires adding to home screen (PWA) first.

## Next Steps

### Immediate
1. ✅ Run database migration
2. ✅ Update environment variables
3. ✅ Get Supabase service role key
4. ✅ Test on localhost using `/test-notifications`
5. ✅ Test on mobile device

### Future Enhancements
- Email notifications
- SMS notifications
- Notification scheduling
- Rich notifications with images
- Action buttons on notifications
- Notification grouping
- Push notification analytics

## Production Deployment

Before deploying to production:

1. ✅ Verify all environment variables are set in Vercel
2. ✅ Test notification migration on production database
3. ✅ Verify service worker is accessible at `/sw.js`
4. ✅ Test on multiple browsers and devices
5. ✅ Monitor notification delivery in `notification_log` table
6. ✅ Set up error monitoring for failed subscriptions

## Security Considerations

- VAPID keys are cryptographic keys - keep private key secret
- Service role key has full database access - never expose to client
- Internal API secret prevents unauthorized notification sending
- Cron secret prevents unauthorized cron triggers
- All endpoints verify authentication before processing

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify environment variables
3. Check service worker status in DevTools
4. Review notification_log table for delivery status
5. Test with `/test-notifications` page
