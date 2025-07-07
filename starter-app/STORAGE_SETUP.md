# Storage Setup Guide for Yup.RSVP Branding

## Quick Setup (Recommended)

The easiest way to set up the storage bucket is through the Supabase Dashboard:

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your Yup.RSVP project

### Step 2: Create Storage Bucket
1. Click on **Storage** in the left sidebar
2. Click the **"Create bucket"** button
3. Fill in the bucket details:
   - **Bucket name**: `brand-logos`
   - **Public bucket**: ✅ **Enable this**
   - **File size limit**: `5` MB
   - **Allowed MIME types**: Add these one by one:
     - `image/jpeg`
     - `image/png`
     - `image/webp`
     - `image/svg+xml`
     - `image/gif`
4. Click **"Create bucket"**

### Step 3: Verify Setup
1. The bucket should appear in your Storage list
2. Try uploading a logo through the branding page
3. If it works, you're all set! 🎉

## Alternative Setup Methods

### Method 1: API Endpoint (Requires Service Role Key)
```bash
# Make sure you have SUPABASE_SERVICE_ROLE_KEY in your environment
curl -X POST http://localhost:3000/api/storage/setup-brand-logos
```

### Method 2: SQL Script
Run the `setup-brand-logos-bucket.sql` script in your Supabase SQL Editor.

## Troubleshooting

### "Upload failed" Error
- **Check bucket exists**: Go to Storage in Supabase Dashboard
- **Verify bucket is public**: Edit bucket settings and ensure "Public bucket" is enabled
- **Check file size**: Make sure your image is under 5MB
- **Check file type**: Only JPEG, PNG, WebP, SVG, and GIF are allowed

### "Authentication required" Error
- Make sure you're logged in to the app
- Try refreshing the page and logging in again

### "Storage service not available" Error
- Check your Supabase project is active
- Verify your environment variables are correct
- Check Supabase status page for any outages

## Environment Variables Required

Make sure these are set in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_PROJECT_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional, for API setup)
```

## Testing

You can test the storage setup by:
1. Going to `/branding` page
2. Trying to upload a logo
3. Check the browser console for any errors
4. Visit `/api/storage/setup-brand-logos` to check bucket status
