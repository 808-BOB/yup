# Plan Restrictions Implementation

This document outlines all the plan-based restrictions that are enforced throughout the Yup.RSVP application.

## Plan Tiers

### Free Plan ($0/forever)
**✅ Included Features:**
- Create up to 3 events
- Basic event customization
- Email invitations
- Guest RSVP tracking
- Standard event pages
- Limited analytics

**❌ Restricted Features:**
- Custom branding
- Priority support
- Unlimited events
- Advanced analytics
- Custom domain
- White-label events

### Pro Plan ($9.99/month)
**✅ All Free features plus:**
- Priority support
- Unlimited events
- Advanced analytics

**❌ Still restricted:**
- Custom domain
- Custom branding
- White-label events

### Premium Plan ($29.99/month)
**✅ All Pro features plus:**
- Custom domain
- Custom branding
- White-label events

## Implementation Details

### 1. Event Creation Limits
**Location:** `starter-app/apps/web/app/api/events/route.ts`

- **Free users:** Limited to 3 events maximum
- **Pro/Premium users:** Unlimited events
- **Error handling:** Returns 403 with upgrade prompt when limit reached
- **Frontend handling:** Redirects to upgrade page with clear messaging

### 2. Analytics Restrictions
**Location:** `starter-app/apps/web/app/events/[slug]/responses/page.tsx`

#### Limited Analytics (Free Plan):
- Basic response counts (going/not going/maybe)
- Only first 5 responses shown
- No email addresses displayed
- No response timeline data
- No acceptance rate calculations

#### Advanced Analytics (Pro/Premium Plans):
- Full response counts and statistics
- All responses displayed
- Email addresses shown
- Response timeline and trends
- Acceptance rate calculations
- Response dates and timestamps
- Advanced metrics and insights

### 3. Branding Restrictions
**Location:** `starter-app/apps/web/app/branding/page.tsx`

- **Free/Pro users:** Redirected to upgrade page
- **Premium users only:** Full access to branding customization
  - Custom logo upload
  - Brand color customization
  - Custom RSVP text
  - Theme personalization

### 4. User Interface Restrictions

#### My Events Page
**Location:** `starter-app/apps/web/app/my-events/page.tsx`

- Plan status indicator showing current plan and limits
- Event count vs limit display (e.g., "2/3 events" for free users)
- Upgrade prompts for free users
- Disabled "Create Event" button when limit reached
- Visual warnings when approaching or at limit

#### Event Creation
**Location:** `starter-app/apps/web/app/events/create/page.tsx`

- Error handling for event limit reached
- Automatic redirect to upgrade page with informative message
- Clear explanation of plan limitations

#### Admin Page
**Location:** `starter-app/apps/web/app/admin/page.tsx`

- Plan status display
- Quick upgrade functionality
- System metrics (for admin users)

### 5. Plan Detection Logic
**Location:** Multiple files

User plan is detected through:
```typescript
const isPremium = Boolean(user?.is_premium ?? user?.user_metadata?.is_premium);
const isPro = Boolean(user?.is_pro ?? user?.user_metadata?.is_pro);
const isFree = !isPremium && !isPro;
```

Plans are checked from:
- Database `users.is_premium` field
- Database `users.is_pro` field
- User metadata for backward compatibility

### 6. Upgrade Flow Integration

#### Stripe Integration
**Location:** `starter-app/apps/web/app/api/stripe/`

- Webhook automatically updates user plan status
- Pro plan sets `is_pro: true`
- Premium plan sets `is_premium: true`
- Subscription cancellation resets to free plan

#### Upgrade Page
**Location:** `starter-app/apps/web/app/upgrade/page.tsx`

- Current plan detection and display
- Feature comparison with restrictions clearly marked
- Stripe checkout integration
- Plan-specific upgrade buttons

## Testing Plan Restrictions

### Free Plan Limits
1. Create 3 events as a free user
2. Attempt to create a 4th event - should be blocked
3. Verify redirect to upgrade page with clear messaging
4. Check My Events page shows "3/3 events" with upgrade prompt

### Analytics Restrictions
1. Create event responses as free user
2. Verify limited analytics (only 5 responses shown)
3. Upgrade to Pro and verify advanced analytics appear
4. Check that email addresses and timeline data are shown

### Branding Restrictions
1. Access `/branding` as free user - should redirect to upgrade
2. Access `/branding` as Pro user - should redirect to upgrade
3. Access `/branding` as Premium user - should show full interface

## Database Schema

Required fields in `users` table:
```sql
- is_premium: boolean (default false)
- is_pro: boolean (default false)
- brand_primary_color: text
- brand_secondary_color: text
- brand_tertiary_color: text
- logo_url: text
- custom_yup_text: text
- custom_nope_text: text
- custom_maybe_text: text
```

## Error Messages

### Event Limit Reached
```json
{
  "error": "Event limit reached",
  "details": "Free accounts are limited to 3 events. Upgrade to Pro or Premium for unlimited events.",
  "currentCount": 3,
  "limit": 3,
  "upgradeRequired": true
}
```

### Branding Access Denied
- Automatic redirect to `/upgrade` with premium requirement message

### Analytics Limitations
- Visual indicators showing "Limited Analytics" for free users
- Upgrade prompts throughout analytics interface

## Key Files Modified

1. **API Routes:**
   - `apps/web/app/api/events/route.ts` - Event creation limits
   - `apps/web/app/api/stripe/webhook/route.ts` - Plan updates

2. **Frontend Pages:**
   - `apps/web/app/events/create/page.tsx` - Creation limits UI
   - `apps/web/app/events/[slug]/responses/page.tsx` - Analytics restrictions
   - `apps/web/app/my-events/page.tsx` - Plan status display
   - `apps/web/app/branding/page.tsx` - Premium-only access
   - `apps/web/app/upgrade/page.tsx` - Plan comparison

3. **Context/Utils:**
   - `packages/contexts/BrandingContext.tsx` - Premium checking
   - `packages/types/index.ts` - Type definitions

All restrictions are now fully implemented and aligned with the advertised plan features on the upgrade page. 