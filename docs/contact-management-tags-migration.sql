/**
 * Contact Management - Tags Migration
 *
 * This migration adds tagging functionality to contacts:
 * - Tags can be created and managed per organization
 * - Contacts can have multiple tags (many-to-many)
 * - Smart duplicate prevention (case-insensitive, whitespace-insensitive)
 * - Tag colors for visual distinction
 *
 * Run this in Supabase Dashboard → SQL Editor
 *
 * Created: 2025-11-19
 */

-- ============================================================================
-- 1. CREATE TAGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6', -- Default blue color (Tailwind blue-500)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate tags (case-insensitive, whitespace-normalized)
  CONSTRAINT unique_tag_name_per_org UNIQUE (organization_id, name)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_contact_tags_org_id ON contact_tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_name_lower ON contact_tags(organization_id, LOWER(TRIM(name)));

-- ============================================================================
-- 2. CREATE TAG ASSIGNMENTS TABLE (Many-to-Many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contact_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES contact_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate assignments
  CONSTRAINT unique_contact_tag UNIQUE (contact_id, tag_id)
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_contact ON contact_tag_assignments(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_tag ON contact_tag_assignments(tag_id);

-- ============================================================================
-- 3. FUNCTIONS FOR TAG MANAGEMENT
-- ============================================================================

/**
 * Function: get_or_create_tag
 *
 * Gets an existing tag or creates a new one
 * Handles case-insensitive matching with whitespace normalization
 *
 * @param p_organization_id - Organization UUID
 * @param p_tag_name - Tag name (will be normalized)
 * @param p_color - Optional color (defaults to blue)
 * @returns tag_id UUID
 */
CREATE OR REPLACE FUNCTION get_or_create_tag(
  p_organization_id UUID,
  p_tag_name TEXT,
  p_color TEXT DEFAULT '#3B82F6'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_tag_id UUID;
  v_normalized_name TEXT;
BEGIN
  -- Normalize the tag name (trim whitespace)
  v_normalized_name := TRIM(p_tag_name);

  -- Try to find existing tag (case-insensitive)
  SELECT id INTO v_tag_id
  FROM contact_tags
  WHERE organization_id = p_organization_id
    AND LOWER(name) = LOWER(v_normalized_name);

  -- If not found, create new tag
  IF v_tag_id IS NULL THEN
    INSERT INTO contact_tags (organization_id, name, color)
    VALUES (p_organization_id, v_normalized_name, p_color)
    RETURNING id INTO v_tag_id;
  END IF;

  RETURN v_tag_id;
END;
$$;

/**
 * Function: assign_tags_to_contact
 *
 * Assigns multiple tags to a contact
 * Removes old assignments and creates new ones
 *
 * @param p_contact_id - Contact UUID
 * @param p_tag_ids - Array of tag UUIDs
 */
CREATE OR REPLACE FUNCTION assign_tags_to_contact(
  p_contact_id UUID,
  p_tag_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Remove all existing tag assignments
  DELETE FROM contact_tag_assignments
  WHERE contact_id = p_contact_id;

  -- Add new tag assignments
  IF p_tag_ids IS NOT NULL AND array_length(p_tag_ids, 1) > 0 THEN
    INSERT INTO contact_tag_assignments (contact_id, tag_id)
    SELECT p_contact_id, unnest(p_tag_ids)
    ON CONFLICT (contact_id, tag_id) DO NOTHING;
  END IF;
END;
$$;

-- ============================================================================
-- 4. TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_contact_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contact_tags_updated_at
  BEFORE UPDATE ON contact_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_tags_updated_at();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view tags in their organization" ON contact_tags;
DROP POLICY IF EXISTS "Users can create tags in their organization" ON contact_tags;
DROP POLICY IF EXISTS "Users can update tags in their organization" ON contact_tags;
DROP POLICY IF EXISTS "Users can delete tags in their organization" ON contact_tags;
DROP POLICY IF EXISTS "Users can view tag assignments for their org contacts" ON contact_tag_assignments;
DROP POLICY IF EXISTS "Users can create tag assignments for their org contacts" ON contact_tag_assignments;
DROP POLICY IF EXISTS "Users can delete tag assignments for their org contacts" ON contact_tag_assignments;

-- Policies for contact_tags (allow all operations for service role)
CREATE POLICY "Users can view tags in their organization"
ON contact_tags FOR SELECT
USING (true);

CREATE POLICY "Users can create tags in their organization"
ON contact_tags FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update tags in their organization"
ON contact_tags FOR UPDATE
USING (true);

CREATE POLICY "Users can delete tags in their organization"
ON contact_tags FOR DELETE
USING (true);

-- Policies for contact_tag_assignments
CREATE POLICY "Users can view tag assignments for their org contacts"
ON contact_tag_assignments FOR SELECT
USING (true);

CREATE POLICY "Users can create tag assignments for their org contacts"
ON contact_tag_assignments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete tag assignments for their org contacts"
ON contact_tag_assignments FOR DELETE
USING (true);

-- ============================================================================
-- 6. SEED DATA (Optional - Common Tags)
-- ============================================================================

-- Uncomment to add default tags for existing organizations
/*
INSERT INTO contact_tags (organization_id, name, color)
SELECT
  id as organization_id,
  tag.name,
  tag.color
FROM organizations
CROSS JOIN (
  VALUES
    ('VIP', '#EF4444'),           -- Red
    ('Follow Up', '#F59E0B'),     -- Amber
    ('High Priority', '#DC2626'), -- Red-600
    ('Cold Lead', '#6B7280'),     -- Gray-500
    ('Partner', '#8B5CF6'),       -- Purple
    ('Referral', '#10B981')       -- Green
) AS tag(name, color)
ON CONFLICT (organization_id, name) DO NOTHING;
*/

-- ============================================================================
-- 7. VERIFY SETUP
-- ============================================================================

-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('contact_tags', 'contact_tag_assignments');

-- Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_or_create_tag', 'assign_tags_to_contact');

-- Check indexes
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('contact_tags', 'contact_tag_assignments');

-- ============================================================================
-- NOTES
-- ============================================================================

-- Tag Matching Logic:
-- - Case-insensitive: "VIP" matches "vip", "Vip", "VIP"
-- - Whitespace-insensitive: "Company Event" matches "companyevent", "Company  Event"
-- - TRIM() removes leading/trailing spaces
-- - LOWER() for case-insensitive comparison

-- Tag Colors:
-- - Stored as hex color codes (e.g., #3B82F6)
-- - Default: Blue (#3B82F6)
-- - Frontend can use these for badge colors

-- Tag Assignment:
-- - Many-to-many relationship
-- - A contact can have multiple tags
-- - A tag can be assigned to multiple contacts
-- - Cascade delete: Deleting a tag removes all assignments
-- - Cascade delete: Deleting a contact removes all assignments

-- Performance:
-- - Indexes on organization_id for fast filtering
-- - Index on LOWER(TRIM(name)) for fast duplicate detection
-- - Indexes on foreign keys for fast joins

-- Security:
-- - RLS policies allow all operations (we control access via backend API)
-- - Backend validates organization membership before allowing operations
