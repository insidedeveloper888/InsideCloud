/**
 * Contact Management - Avatar Storage Setup
 *
 * This script sets up Supabase Storage for contact avatar uploads
 *
 * Instructions:
 * 1. Go to Supabase Dashboard → Storage
 * 2. Create bucket manually OR run SQL below
 * 3. Run the RLS policies
 *
 * Created: 2025-11-19
 */

-- ============================================================================
-- 1. CREATE STORAGE BUCKET
-- ============================================================================

-- Insert the avatars bucket
-- Note: You can also create this via Supabase Dashboard → Storage → New Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public bucket (anyone can read)
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can view avatar images (public read)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy 2: Authenticated users can upload avatar images
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Policy 3: Users can update avatar images
-- Note: In production, you might want to restrict this to the user's own avatars
CREATE POLICY "Authenticated users can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Policy 4: Users can delete avatar images
-- Note: In production, you might want to restrict this to the user's own avatars
CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- ============================================================================
-- 3. VERIFY SETUP
-- ============================================================================

-- Check if bucket was created
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- ============================================================================
-- 4. OPTIONAL: CLEANUP OLD AVATARS (RUN MANUALLY WHEN NEEDED)
-- ============================================================================

-- Find orphaned avatars (avatars not referenced in contacts table)
-- DO NOT RUN AUTOMATICALLY - This is for manual cleanup only
/*
WITH referenced_avatars AS (
  SELECT DISTINCT avatar_url
  FROM contacts
  WHERE avatar_url IS NOT NULL
    AND avatar_url LIKE '%/storage/v1/object/public/avatars/%'
)
SELECT name
FROM storage.objects
WHERE bucket_id = 'avatars'
  AND NOT EXISTS (
    SELECT 1
    FROM referenced_avatars
    WHERE referenced_avatars.avatar_url LIKE '%' || storage.objects.name
  );
*/

-- ============================================================================
-- NOTES
-- ============================================================================

-- File Naming Convention:
-- Files are stored as: {organization_slug}/{timestamp}-{random}.{extension}
-- Example: cloud/1700000000000-abc123.jpg

-- File Size Limit:
-- 5MB (5242880 bytes) enforced at bucket level

-- Allowed File Types:
-- - JPEG (.jpg, .jpeg)
-- - PNG (.png)
-- - GIF (.gif)
-- - WebP (.webp)
-- - SVG (.svg)

-- Public Access:
-- All uploaded images are publicly accessible via URL
-- URL format: https://{project}.supabase.co/storage/v1/object/public/avatars/{path}

-- Security Considerations:
-- 1. Images are public - don't upload sensitive information
-- 2. File size is limited to 5MB
-- 3. Only image MIME types are allowed
-- 4. Consider implementing file virus scanning in production
-- 5. Consider rate limiting uploads to prevent abuse

-- Alternative: Private Bucket
-- If you need private avatars (require authentication to view):
-- 1. Set public = false when creating bucket
-- 2. Use storage.from('avatars').createSignedUrl() to generate temporary URLs
-- 3. Update RLS policies to check user permissions

