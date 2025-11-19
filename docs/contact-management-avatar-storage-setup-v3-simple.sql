/**
 * Contact Management - Avatar Storage Setup V3 (Simplified)
 *
 * This script ONLY creates the bucket.
 * You must create policies via Supabase Dashboard UI.
 *
 * IMPORTANT: Run this in Supabase Dashboard → SQL Editor
 *
 * Created: 2025-11-19
 */

-- ============================================================================
-- CREATE STORAGE BUCKET: contact-avatars
-- ============================================================================

-- Create the contact-avatars bucket
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
-- VERIFY BUCKET CREATION
-- ============================================================================

-- Check if bucket was created
SELECT * FROM storage.buckets WHERE id = 'contact-avatars';

-- ============================================================================
-- NEXT STEPS
-- ============================================================================

/*
After running this script, you MUST create RLS policies via Supabase Dashboard UI:

1. Go to Supabase Dashboard → Storage → contact-avatars → Policies tab
2. Create 4 policies:

   a) SELECT (public read):
      - Policy name: Contact avatars are publicly accessible
      - Allowed operation: SELECT
      - Target roles: public
      - USING: bucket_id = 'contact-avatars'

   b) INSERT (authenticated upload):
      - Policy name: Authenticated users can upload contact avatars
      - Allowed operation: INSERT
      - Target roles: authenticated
      - WITH CHECK: bucket_id = 'contact-avatars'

   c) UPDATE (authenticated update):
      - Policy name: Authenticated users can update contact avatars
      - Allowed operation: UPDATE
      - Target roles: authenticated
      - USING: bucket_id = 'contact-avatars'
      - WITH CHECK: bucket_id = 'contact-avatars'

   d) DELETE (authenticated delete):
      - Policy name: Authenticated users can delete contact avatars
      - Allowed operation: DELETE
      - Target roles: authenticated
      - USING: bucket_id = 'contact-avatars'

Alternatively, you can create the bucket via UI:
- Supabase Dashboard → Storage → New bucket
- Then create policies as described above
*/
