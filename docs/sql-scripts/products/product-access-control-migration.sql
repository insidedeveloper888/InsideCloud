-- =====================================================
-- Product Access Control - Migration Script
-- For Existing Database with UUID-based products table
-- =====================================================
-- This script safely updates your existing tables
-- and adds the contact_management product
-- =====================================================

-- =====================================================
-- PART 1: Add missing columns to products table
-- =====================================================

-- Add icon column (stores React component name like "TargetIcon", "DocumentIcon")
-- These map to components in src/components/ui/icons/
ALTER TABLE products
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Add is_active column (soft delete flag)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add updated_at column (for tracking changes)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- PART 2: Update existing products with new fields
-- =====================================================

-- Update strategic_map product
-- Icon "TargetIcon" maps to src/components/ui/icons/TargetIcon.jsx
UPDATE products
SET
  icon = 'TargetIcon',
  is_active = true,
  updated_at = NOW()
WHERE key = 'strategic_map';

-- Update document_parser product
-- Icon "DocumentIcon" maps to src/components/ui/icons/DocumentIcon.jsx
UPDATE products
SET
  icon = 'DocumentIcon',
  is_active = true,
  updated_at = NOW()
WHERE key = 'document_parser';

-- =====================================================
-- PART 3: Insert contact_management product
-- =====================================================

-- Insert contact_management (will skip if already exists)
-- Icon "ContactBookIcon" maps to src/components/ui/icons/ContactBookIcon.jsx
INSERT INTO products (
  id,
  key,
  name,
  description,
  category,
  icon,
  is_active,
  metadata,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),  -- Generate UUID (compatible with your existing schema)
  'contact_management',
  '名单管理',  -- Display name (Chinese)
  'Full-featured CRM system with configurable rating scales, custom pipeline stages, and comprehensive contact tracking for customers, suppliers, COI, and internal contacts',
  'crm',
  'ContactBookIcon',  -- Maps to ContactBookIcon.jsx component
  true,
  '{"version": "2.4.0", "status": "production", "features": ["configurable_ratings", "custom_stages", "traffic_channels", "tags"]}',
  NOW(),
  NOW()
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- =====================================================
-- PART 4: Grant access to all organizations
-- =====================================================

-- Grant contact_management access to all active organizations
-- This uses your existing schema with granted_by, granted_at, expires_at
INSERT INTO organization_product_access (
  organization_id,
  product_id,
  is_enabled,
  granted_by,
  granted_at,
  expires_at,
  metadata,
  created_at,
  updated_at
)
SELECT
  o.id,
  p.id,
  true,
  NULL,  -- No specific user granted this (auto-grant)
  NOW(),
  NULL,  -- No expiration
  '{}',
  NOW(),
  NOW()
FROM organizations o
CROSS JOIN products p
WHERE
  o.is_active = true
  AND p.key = 'contact_management'
ON CONFLICT (organization_id, product_id) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  granted_at = EXCLUDED.granted_at,
  updated_at = NOW();

-- =====================================================
-- PART 5: Create updated_at trigger for products
-- =====================================================

-- Create trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS products_updated_at_trigger ON products;

-- Create new trigger
CREATE TRIGGER products_updated_at_trigger
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_products_updated_at();

-- =====================================================
-- PART 6: Create indexes for performance (if not exist)
-- =====================================================

-- Index on products.key for fast lookups
CREATE INDEX IF NOT EXISTS idx_products_key ON products(key);

-- Index on products.is_active for filtering active products
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Index on organization_product_access for fast access checks
CREATE INDEX IF NOT EXISTS idx_org_product_access_lookup
ON organization_product_access(organization_id, product_id);

-- Index on organization_product_access.is_enabled for filtering
CREATE INDEX IF NOT EXISTS idx_org_product_access_enabled
ON organization_product_access(is_enabled);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all products
SELECT
  id,
  key,
  name,
  icon,
  category,
  is_active,
  created_at,
  updated_at
FROM products
ORDER BY created_at;

-- Check organization access
SELECT
  o.slug AS organization,
  p.key AS product,
  p.name AS product_name,
  p.icon AS product_icon,
  opa.is_enabled,
  opa.granted_at,
  opa.expires_at
FROM organization_product_access opa
JOIN organizations o ON o.id = opa.organization_id
JOIN products p ON p.id = opa.product_id
WHERE opa.is_enabled = true
ORDER BY o.slug, p.key;

-- Count products by organization
SELECT
  o.slug AS organization,
  COUNT(*) FILTER (WHERE opa.is_enabled = true) AS enabled_products,
  COUNT(*) AS total_access_records
FROM organizations o
LEFT JOIN organization_product_access opa ON opa.organization_id = o.id
WHERE o.is_active = true
GROUP BY o.slug
ORDER BY o.slug;
