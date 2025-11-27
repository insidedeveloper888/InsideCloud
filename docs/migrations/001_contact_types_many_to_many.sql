-- ============================================================================
-- MIGRATION: Contact Types Many-to-Many Relationship
-- ============================================================================
-- Version: 001
-- Created: 2025-11-26
-- Purpose: Refactor contact_type from single TEXT field to many-to-many relationship
--          allowing contacts to have multiple types (e.g., Customer + Supplier)
--
-- Migration Steps:
-- 1. Create contact_types table (organization-level type definitions)
-- 2. Create contact_contact_types junction table (many-to-many)
-- 3. Enable RLS and create policies for both tables
-- 4. Create indexes for performance
-- 5. Migrate existing data (create default types + link existing contacts)
--
-- IMPORTANT: This migration does NOT drop the contacts.contact_type column.
--            The column will be deprecated after code migration is complete.
-- ============================================================================

-- ============================================================================
-- SECTION 1: CREATE contact_types TABLE
-- ============================================================================
-- This table defines available contact types per organization.
-- Each organization can customize their types (add/rename non-system types).

CREATE TABLE IF NOT EXISTS contact_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Type identifiers
  code TEXT NOT NULL,           -- For code logic (e.g., 'customer', 'supplier')
  name TEXT NOT NULL,           -- For display (e.g., 'Customer', 'Supplier')
  description TEXT,             -- Optional description

  -- Configuration
  is_system BOOLEAN DEFAULT false,  -- true = cannot delete/rename (core types)
  sort_order INTEGER DEFAULT 0,     -- Display ordering

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT contact_types_org_code_unique UNIQUE (organization_id, code)
);

-- Add comments
COMMENT ON TABLE contact_types IS 'Defines available contact types per organization (Customer, Supplier, COI, etc.)';
COMMENT ON COLUMN contact_types.code IS 'Machine-readable identifier for code logic (lowercase, no spaces)';
COMMENT ON COLUMN contact_types.name IS 'Human-readable display name';
COMMENT ON COLUMN contact_types.is_system IS 'System types cannot be deleted or have code renamed';
COMMENT ON COLUMN contact_types.sort_order IS 'Controls display order in UI dropdowns';


-- ============================================================================
-- SECTION 2: CREATE contact_contact_types JUNCTION TABLE
-- ============================================================================
-- This table creates the many-to-many relationship between contacts and types.
-- A contact can have multiple types (e.g., both Customer and Supplier).

CREATE TABLE IF NOT EXISTS contact_contact_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  contact_type_id UUID NOT NULL REFERENCES contact_types(id) ON DELETE RESTRICT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints: prevent duplicate assignments
  CONSTRAINT contact_contact_types_unique UNIQUE (contact_id, contact_type_id)
);

-- Add comments
COMMENT ON TABLE contact_contact_types IS 'Junction table linking contacts to their types (many-to-many)';
COMMENT ON COLUMN contact_contact_types.contact_id IS 'Reference to contacts table';
COMMENT ON COLUMN contact_contact_types.contact_type_id IS 'Reference to contact_types table';


-- ============================================================================
-- SECTION 3: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- RLS ensures organizations can only see their own data.
-- Pattern matches existing contacts table RLS.

-- Enable RLS on contact_types
ALTER TABLE contact_types ENABLE ROW LEVEL SECURITY;

-- Policies for contact_types (direct organization_id access)
CREATE POLICY "contact_types_select_policy" ON contact_types
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE individual_id = auth.uid()
    )
  );

CREATE POLICY "contact_types_insert_policy" ON contact_types
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE individual_id = auth.uid()
    )
  );

CREATE POLICY "contact_types_update_policy" ON contact_types
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE individual_id = auth.uid()
    )
  );

CREATE POLICY "contact_types_delete_policy" ON contact_types
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE individual_id = auth.uid()
    )
    AND is_system = false  -- Prevent deletion of system types
  );

-- Enable RLS on contact_contact_types
ALTER TABLE contact_contact_types ENABLE ROW LEVEL SECURITY;

-- Policies for contact_contact_types (join through contact_types to get org)
CREATE POLICY "contact_contact_types_select_policy" ON contact_contact_types
  FOR SELECT
  USING (
    contact_type_id IN (
      SELECT ct.id FROM contact_types ct
      WHERE ct.organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE individual_id = auth.uid()
      )
    )
  );

CREATE POLICY "contact_contact_types_insert_policy" ON contact_contact_types
  FOR INSERT
  WITH CHECK (
    contact_type_id IN (
      SELECT ct.id FROM contact_types ct
      WHERE ct.organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE individual_id = auth.uid()
      )
    )
  );

CREATE POLICY "contact_contact_types_update_policy" ON contact_contact_types
  FOR UPDATE
  USING (
    contact_type_id IN (
      SELECT ct.id FROM contact_types ct
      WHERE ct.organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE individual_id = auth.uid()
      )
    )
  );

CREATE POLICY "contact_contact_types_delete_policy" ON contact_contact_types
  FOR DELETE
  USING (
    contact_type_id IN (
      SELECT ct.id FROM contact_types ct
      WHERE ct.organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE individual_id = auth.uid()
      )
    )
  );


-- ============================================================================
-- SECTION 4: CREATE INDEXES
-- ============================================================================
-- Indexes for optimal query performance.

-- contact_types indexes
CREATE INDEX IF NOT EXISTS idx_contact_types_organization
  ON contact_types(organization_id);

CREATE INDEX IF NOT EXISTS idx_contact_types_code
  ON contact_types(organization_id, code);

CREATE INDEX IF NOT EXISTS idx_contact_types_sort_order
  ON contact_types(organization_id, sort_order);

-- contact_contact_types indexes
CREATE INDEX IF NOT EXISTS idx_contact_contact_types_contact
  ON contact_contact_types(contact_id);

CREATE INDEX IF NOT EXISTS idx_contact_contact_types_type
  ON contact_contact_types(contact_type_id);

-- Composite index for common query: "get all types for a contact"
CREATE INDEX IF NOT EXISTS idx_contact_contact_types_contact_type
  ON contact_contact_types(contact_id, contact_type_id);


-- ============================================================================
-- SECTION 5: CREATE TRIGGER FOR updated_at
-- ============================================================================
-- Auto-update the updated_at timestamp on contact_types changes.
-- Uses existing update_updated_at_column() function from contact-management schema.

CREATE TRIGGER update_contact_types_updated_at
  BEFORE UPDATE ON contact_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- SECTION 6: DATA MIGRATION
-- ============================================================================
-- Create default contact types for each organization and migrate existing data.

-- 6.1: Insert default contact types for ALL existing organizations
INSERT INTO contact_types (organization_id, code, name, description, is_system, sort_order)
SELECT
  o.id,
  type_data.code,
  type_data.name,
  type_data.description,
  type_data.is_system,
  type_data.sort_order
FROM organizations o
CROSS JOIN (
  VALUES
    ('customer', 'Customer', 'Clients and buyers of products/services', true, 1),
    ('supplier', 'Supplier', 'Vendors and service providers', true, 2),
    ('coi', 'COI', 'Center of Influence - referral sources and partners', false, 3),
    ('internal', 'Internal', 'Internal team members and staff', false, 4)
) AS type_data(code, name, description, is_system, sort_order)
ON CONFLICT (organization_id, code) DO NOTHING;


-- 6.2: Migrate existing contacts to many-to-many relationship
-- For each contact, create a link to the appropriate contact_type based on TEXT value
INSERT INTO contact_contact_types (contact_id, contact_type_id)
SELECT
  c.id AS contact_id,
  ct.id AS contact_type_id
FROM contacts c
JOIN contact_types ct
  ON ct.organization_id = c.organization_id
  AND ct.code = c.contact_type
WHERE c.contact_type IS NOT NULL
ON CONFLICT (contact_id, contact_type_id) DO NOTHING;


-- ============================================================================
-- SECTION 7: VERIFICATION QUERIES (RUN MANUALLY AFTER MIGRATION)
-- ============================================================================
-- Use these queries to verify the migration succeeded.

-- 7.1: Verify contact_types table created with correct data
-- SELECT organization_id, code, name, is_system, sort_order
-- FROM contact_types
-- ORDER BY organization_id, sort_order;

-- 7.2: Verify contact_contact_types records match original contact_type values
-- SELECT
--   c.id AS contact_id,
--   c.first_name || ' ' || c.last_name AS contact_name,
--   c.contact_type AS original_type,
--   ct.code AS migrated_type
-- FROM contacts c
-- JOIN contact_contact_types cct ON cct.contact_id = c.id
-- JOIN contact_types ct ON ct.id = cct.contact_type_id
-- ORDER BY c.organization_id, c.id;

-- 7.3: Count verification - should match
-- SELECT
--   (SELECT COUNT(*) FROM contacts WHERE contact_type IS NOT NULL) AS original_count,
--   (SELECT COUNT(*) FROM contact_contact_types) AS migrated_count;

-- 7.4: Verify indexes created
-- SELECT indexname, tablename
-- FROM pg_indexes
-- WHERE tablename IN ('contact_types', 'contact_contact_types')
-- ORDER BY tablename, indexname;

-- 7.5: Verify RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('contact_types', 'contact_contact_types')
-- ORDER BY tablename, policyname;


-- ============================================================================
-- FUTURE: DROP DEPRECATED COLUMN (DO NOT RUN YET)
-- ============================================================================
-- After code migration is complete and verified, run these commands:
--
-- Step 1: Remove the CHECK constraint
-- ALTER TABLE contacts DROP CONSTRAINT contacts_contact_type_check;
--
-- Step 2: Remove the default
-- ALTER TABLE contacts ALTER COLUMN contact_type DROP DEFAULT;
--
-- Step 3: Remove NOT NULL constraint
-- ALTER TABLE contacts ALTER COLUMN contact_type DROP NOT NULL;
--
-- Step 4: Drop the column (AFTER all code is updated)
-- ALTER TABLE contacts DROP COLUMN contact_type;
--
-- Step 5: Drop the old index
-- DROP INDEX IF EXISTS idx_contacts_type;


-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
