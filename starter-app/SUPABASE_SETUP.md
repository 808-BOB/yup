# Supabase Setup for Yup.RSVP

## 🚨 **URGENT: Environment Variables Required**

The app is currently using mock data because Supabase environment variables are missing.

## 1. Create Environment File

**Create a file named `.env.local`** in `starter-app/apps/web/` (NOT in the root):

```bash
# File location: starter-app/apps/web/.env.local

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 2. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click "Settings" → "API"
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## 3. Database Setup

Run the SQL from `tables.sql` in your Supabase SQL Editor to create the required tables:

- `users` (linked to auth.users)
- `events` 
- `invitations`
- `responses`

## 4. Test the Configuration

1. Restart the dev server: `npm run dev`
2. Visit: `http://localhost:3000/api/env-check`
3. Should show all variables as "Set"
4. Create a test event at `/events/create`

## 5. Troubleshooting

**If still seeing "supabaseUrl is required":**
- Make sure `.env.local` is in `starter-app/apps/web/` folder
- Restart the dev server completely
- Check file has no extra spaces or quotes

**Current Status:**
- ✅ App works with mock data (fallback)
- ⚠️ Will switch to Supabase once env vars are set
- 🎯 Events created will persist to your database

## 6. Required Supabase Packages

Already installed:
- `@supabase/supabase-js`

## 7. Test the Integration

1. Start the dev server: `npm run dev`
2. Navigate to `/events/create`
3. Create a test event
4. Check if it appears in `/my-events`

The event should now save to your Supabase database instead of mock data. 