# Contact Management - Avatar Upload Setup Guide

## Overview

This guide walks you through setting up avatar image uploads for the Contact Management tool using Supabase Storage.

---

## Prerequisites

✅ Supabase project created
✅ Environment variables configured in `.env`:
```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

---

## Step 1: Create Storage Bucket

### Option A: Via Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **New bucket**
5. Configure the bucket:
   - **Name:** `avatars`
   - **Public bucket:** Toggle **ON** (allows public read access)
   - **File size limit:** `5 MB`
   - **Allowed MIME types:** `image/jpeg, image/png, image/gif, image/webp`
6. Click **Create bucket**

### Option B: Via SQL Editor

1. Go to **SQL Editor** in Supabase Dashboard
2. Run the SQL from `/docs/contact-management-avatar-storage-setup.sql`
3. Execute the bucket creation section

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;
```

---

## Step 2: Setup Row Level Security (RLS) Policies

Run these SQL commands in **SQL Editor**:

```sql
-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Authenticated users can update
CREATE POLICY "Authenticated users can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Authenticated users can delete
CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
```

---

## Step 3: Verify Setup

### Check Bucket Creation

Run this SQL to verify the bucket was created:

```sql
SELECT * FROM storage.buckets WHERE id = 'avatars';
```

You should see:
```
id      | name    | public | file_size_limit | allowed_mime_types
--------|---------|--------|-----------------|-------------------
avatars | avatars | true   | 5242880         | {image/jpeg, ...}
```

### Check Policies

Run this SQL to verify policies:

```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%avatar%';
```

You should see 4 policies:
- SELECT (public read)
- INSERT (authenticated upload)
- UPDATE (authenticated update)
- DELETE (authenticated delete)

---

## Step 4: Test Upload in Application

1. **Start your app:** `npm run start`
2. **Navigate to Contact Management**
3. **Click "Add Contact"**
4. **Scroll to Avatar section**
5. **Click "Choose Image"** button
6. **Select an image file** (JPG, PNG, GIF, WebP)
7. **Watch the upload progress**
8. **See the preview** appear
9. **Submit the form**
10. **Verify avatar appears** in the contact list

### Expected Console Logs

When uploading, you should see:
```
📤 [AvatarUpload] Starting upload: profile.jpg 123456 bytes
📤 [AvatarUpload] Uploading to: cloud/1700000000000-abc123.jpg
✅ [AvatarUpload] Upload successful: {path: "cloud/...", ...}
🔗 [AvatarUpload] Public URL: https://...supabase.co/storage/v1/object/public/avatars/cloud/...
✅ [AvatarUpload] Avatar URL saved to form
```

---

## Features Included

✅ **File Upload Button** - Clean UI with upload icon
✅ **Image Preview** - Shows preview before saving
✅ **Progress Indicator** - Loading spinner and progress bar
✅ **File Validation** - Type and size checking
✅ **Error Handling** - User-friendly error messages
✅ **Remove Avatar** - Button to remove uploaded image
✅ **Alternative URL Input** - Option to paste image URL instead
✅ **Recommended Resolution** - Shows "200x200 pixels" guidance

---

## File Naming Convention

Uploaded files are stored with this pattern:
```
{organization_slug}/{timestamp}-{random}.{extension}
```

Examples:
- `cloud/1700000000000-abc123.jpg`
- `acme/1700000000001-xyz789.png`

This ensures:
- ✅ No filename collisions
- ✅ Organization-based folders
- ✅ Chronological sorting possible
- ✅ Unique identifiers

---

## Security Considerations

### Current Setup (Public Bucket)

**✅ Pros:**
- Simple implementation
- Fast public access
- No signed URL generation needed
- Works with CDN caching

**⚠️ Cons:**
- Images are publicly accessible (anyone with URL can view)
- No per-user access control
- Suitable for profile pictures, not sensitive documents

### When to Use Private Bucket

Use a **private bucket** if:
- Avatar images contain sensitive information
- You need user-level access control
- Compliance requires authentication to view images

**Private bucket setup:**
```sql
-- Set public = false
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false);

-- Update SELECT policy to check permissions
CREATE POLICY "Users can view their own avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND auth.uid() = (storage.foldername(name))[1]::uuid
);
```

**Frontend changes for private bucket:**
```javascript
// Generate signed URL (expires after 1 hour)
const { data, error } = await supabase.storage
  .from('avatars')
  .createSignedUrl(fileName, 3600);

const signedUrl = data.signedUrl;
```

---

## File Size and Type Limits

### Current Limits

| Setting | Value |
|---------|-------|
| Max file size | 5 MB |
| Allowed types | JPEG, PNG, GIF, WebP, SVG |
| Recommended resolution | 200x200 pixels |

### Changing Limits

**Via SQL:**
```sql
UPDATE storage.buckets
SET file_size_limit = 10485760, -- 10MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png']
WHERE id = 'avatars';
```

**Via Dashboard:**
1. Go to Storage → Buckets
2. Click on `avatars` bucket
3. Click **Settings**
4. Update limits
5. Click **Save**

---

## Troubleshooting

### Issue: "Upload failed: new row violates row-level security policy"

**Cause:** User is not authenticated or RLS policies not set up correctly

**Fix:**
1. Verify user is logged in (check cookies)
2. Run the RLS policy SQL commands again
3. Check policies with: `SELECT * FROM pg_policies WHERE tablename = 'objects'`

---

### Issue: "Bucket not found"

**Cause:** Bucket doesn't exist or wrong name

**Fix:**
1. Verify bucket exists: `SELECT * FROM storage.buckets WHERE id = 'avatars'`
2. Create bucket via Dashboard or SQL
3. Check spelling of bucket ID in code (must be exactly `'avatars'`)

---

### Issue: "File type not allowed"

**Cause:** Uploaded file type not in allowed list

**Fix:**
1. Upload only image files (JPG, PNG, GIF, WebP, SVG)
2. Update allowed types in bucket settings if needed

---

### Issue: Images not loading (CORS error)

**Cause:** CORS not configured for Supabase Storage

**Fix:**
Supabase Storage should handle CORS automatically. If issues persist:
1. Check browser console for specific error
2. Verify URL is correct (starts with `https://{project}.supabase.co/storage/v1/object/public/`)
3. Contact Supabase support if CORS errors persist

---

### Issue: Upload works but image doesn't appear in list

**Cause:** Backend might not be saving the URL to database

**Fix:**
1. Check browser console - verify URL is in submitted form data
2. Check backend logs - verify URL is being saved
3. Check database: `SELECT id, first_name, avatar_url FROM contacts ORDER BY created_at DESC LIMIT 5`

---

## Cleanup and Maintenance

### Find Orphaned Avatars

Avatars not referenced by any contact:

```sql
WITH referenced_avatars AS (
  SELECT DISTINCT avatar_url
  FROM contacts
  WHERE avatar_url IS NOT NULL
    AND avatar_url LIKE '%/storage/v1/object/public/avatars/%'
)
SELECT name, created_at, metadata->>'size' as size_bytes
FROM storage.objects
WHERE bucket_id = 'avatars'
  AND NOT EXISTS (
    SELECT 1
    FROM referenced_avatars
    WHERE referenced_avatars.avatar_url LIKE '%' || storage.objects.name
  )
ORDER BY created_at DESC;
```

### Delete Orphaned Files (CAREFUL!)

```sql
-- BE VERY CAREFUL - This deletes files permanently!
-- Test with SELECT first, then uncomment DELETE
/*
DELETE FROM storage.objects
WHERE bucket_id = 'avatars'
  AND id IN (
    -- IDs from the orphaned avatars query above
  );
*/
```

### Storage Usage

Check total storage used:

```sql
SELECT
  bucket_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
WHERE bucket_id = 'avatars'
GROUP BY bucket_id;
```

---

## Optional Enhancements

### 1. Image Compression

Add client-side compression before upload:

```bash
npm install browser-image-compression
```

```javascript
import imageCompression from 'browser-image-compression';

const handleAvatarUpload = async (e) => {
  const file = e.target.files[0];

  // Compress image
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 200,
    useWebWorker: true,
  };

  const compressedFile = await imageCompression(file, options);

  // Upload compressed file...
};
```

### 2. Drag and Drop

Add drag-and-drop upload area:

```javascript
<div
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
>
  <Upload size={32} className="mx-auto mb-2 text-gray-400" />
  <p>Drag and drop image here, or click to browse</p>
</div>
```

### 3. Image Cropper

Add image cropping before upload:

```bash
npm install react-easy-crop
```

---

## Summary

✅ **Setup Complete When:**
- Bucket `avatars` exists and is public
- RLS policies are in place
- Upload button appears in form
- Test upload succeeds
- Avatar appears in contact list

🎉 **You're ready to use avatar uploads!**

