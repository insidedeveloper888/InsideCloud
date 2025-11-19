/**
 * Contact Management - Avatar Storage Setup V2
 *
 * This script creates a NEW bucket called 'contact-avatars' for contact management
 * (separate from the existing 'avatars' bucket)
 *
 * IMPORTANT: Run this in Supabase Dashboard → SQL Editor
 * (NOT via API client, as RLS policies require admin privileges)
 *
 * Created: 2025-11-19
 */

-- ============================================================================
-- 1. CREATE STORAGE BUCKET: contact-avatars
-- ============================================================================

-- Create the contact-avatars bucket
-- Note: Using ON CONFLICT to prevent error if bucket already exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contact-avatars',
  'contact-avatars',
  true, -- Public bucket (anyone can read)
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Contact avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload contact avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update contact avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete contact avatars" ON storage.objects;

-- Policy 1: Anyone can view contact avatar images (public read)
CREATE POLICY "Contact avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'contact-avatars');

-- Policy 2: Authenticated users can upload contact avatar images
CREATE POLICY "Authenticated users can upload contact avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contact-avatars');

-- Policy 3: Authenticated users can update contact avatar images
CREATE POLICY "Authenticated users can update contact avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'contact-avatars')
WITH CHECK (bucket_id = 'contact-avatars');

-- Policy 4: Authenticated users can delete contact avatar images
CREATE POLICY "Authenticated users can delete contact avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contact-avatars');

-- ============================================================================
-- 3. VERIFY SETUP
-- ============================================================================

-- Check if bucket was created
SELECT * FROM storage.buckets WHERE id = 'contact-avatars';

-- Check policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%contact avatar%';

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
-- URL format: https://{project}.supabase.co/storage/v1/object/public/contact-avatars/{path}

-- Security Considerations:
-- 1. Images are public - don't upload sensitive information
-- 2. File size is limited to 5MB
-- 3. Only image MIME types are allowed
-- 4. All authenticated users can upload (consider restricting by organization in production)

-- Troubleshooting:
-- If you get "must be owner of table objects" error:
-- → Run this script in Supabase Dashboard → SQL Editor (not via API)
--
-- If you get "new row violates row-level security policy":
-- → Check that your user is authenticated
-- → Verify the user has a valid JWT token
-- → Check that REACT_APP_SUPABASE_ANON_KEY is set correctly in .env
