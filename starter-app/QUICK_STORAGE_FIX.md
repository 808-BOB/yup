# Quick Storage Fix - Supabase Dashboard Method

## Step 1: Create the Bucket (SQL)
Run this simple SQL in your Supabase SQL Editor:

```sql
-- Create the brand-logos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-logos',
  'brand-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
```

## Step 2: Add RLS Policies (Dashboard)

1. **Go to**: Supabase Dashboard → **Authentication** → **Policies**
2. **Find**: `storage` schema → `objects` table
3. **Click**: "New Policy"
4. **Add these 4 policies**:

### Policy 1: Upload Permission
- **Policy Name**: `Users can upload brand logos`
- **Allowed Operation**: `INSERT`
- **Target Roles**: `authenticated`
- **USING Expression**: (leave empty)
- **WITH CHECK Expression**:
  ```sql
  bucket_id = 'brand-logos' AND (storage.foldername(name))[1] = auth.uid()::text
  ```

### Policy 2: View Permission
- **Policy Name**: `Users can view brand logos`
- **Allowed Operation**: `SELECT`
- **Target Roles**: `authenticated`
- **USING Expression**:
  ```sql
  bucket_id = 'brand-logos' AND (storage.foldername(name))[1] = auth.uid()::text
  ```

### Policy 3: Update Permission
- **Policy Name**: `Users can update brand logos`
- **Allowed Operation**: `UPDATE`
- **Target Roles**: `authenticated`
- **USING Expression**:
  ```sql
  bucket_id = 'brand-logos' AND (storage.foldername(name))[1] = auth.uid()::text
  ```

### Policy 4: Delete Permission
- **Policy Name**: `Users can delete brand logos`
- **Allowed Operation**: `DELETE`
- **Target Roles**: `authenticated`
- **USING Expression**:
  ```sql
  bucket_id = 'brand-logos' AND (storage.foldername(name))[1] = auth.uid()::text
  ```

### Policy 5: Public View (Optional)
- **Policy Name**: `Public can view brand logos`
- **Allowed Operation**: `SELECT`
- **Target Roles**: `public`
- **USING Expression**:
  ```sql
  bucket_id = 'brand-logos'
  ```

## Step 3: Test
1. Go to your branding page
2. Click "Test Storage" button
3. Check console for detailed results
4. Try uploading a logo

## Alternative: Skip RLS for Now
If you want to test quickly, you can temporarily disable RLS:

1. Go to **Authentication** → **Policies**
2. Find `storage.objects` table
3. Click the **RLS toggle** to disable it (NOT recommended for production)

This will allow all operations without restrictions, but **re-enable it** once you've added the proper policies.
