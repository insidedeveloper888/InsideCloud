-- ============================================================================
-- PRODUCT ACCESS CONTROL SYSTEM - DATABASE SCHEMA & SEEDING
-- ============================================================================
-- Version: 1.0.0
-- Created: 2025-11-20
-- Purpose: Enable organization-level product access control
--
-- This migration:
-- 1. Ensures products table exists with correct schema
-- 2. Seeds all current products (strategic_map, contact_management, document_parser)
-- 3. Creates organization_product_access records for all org-product combinations
-- 4. Adds performance indexes
--
-- Run this file on your Supabase database to enable product access control.
-- ============================================================================

-- ============================================================================
-- 1. PRODUCTS TABLE
-- ============================================================================

-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,              -- 'strategic_map', 'contact_management', etc.
  name VARCHAR(255) NOT NULL,                     -- Display name
  display_name VARCHAR(255),                      -- Localized name (optional)
  description TEXT,
  category VARCHAR(100),                          -- 'planning', 'crm', 'analytics', etc.
  icon VARCHAR(100),                              -- Icon name for UI
  metadata JSONB DEFAULT '{}',                    -- Additional product config
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE products IS 'Master table of all products available in the platform';
COMMENT ON COLUMN products.key IS 'Unique identifier used in code for routing and access control';
COMMENT ON COLUMN products.metadata IS 'JSON object for version, config, or other product-specific data';

-- ============================================================================
-- 2. ORGANIZATION_PRODUCT_ACCESS TABLE
-- ============================================================================

-- Create organization_product_access table if it doesn't exist
CREATE TABLE IF NOT EXISTS organization_product_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, product_id)
);

-- Add comment
COMMENT ON TABLE organization_product_access IS 'Controls which products each organization can access';
COMMENT ON COLUMN organization_product_access.is_enabled IS 'When false, organization loses access to product immediately';

-- ============================================================================
-- 3. SEED PRODUCTS (UPSERT - Safe to run multiple times)
-- ============================================================================

INSERT INTO products (key, name, display_name, description, category, icon, metadata) VALUES
  (
    'strategic_map',
    'Strategic Map',
    '战略地图',
    'Hierarchical goal planning tool with automatic cascading from yearly to daily views. Real-time collaboration with Supabase Realtime.',
    'planning',
    'Map',
    '{"version": "2.2.0", "status": "production", "release_date": "2025-11-17"}'
  ),
  (
    'contact_management',
    'Contact Management',
    '名单管理',
    'Full-featured CRM system with configurable rating scales, advanced filtering, and pipeline management.',
    'crm',
    'Users',
    '{"version": "2.4.0", "status": "production", "release_date": "2025-11-19"}'
  ),
  (
    'document_parser',
    'Document Parser',
    'Document Parser',
    'Pure frontend parser for accounting software exports (CSV/Excel). Supports SQL Accounting and Autocount.',
    'analytics',
    'FileText',
    '{"version": "2.3.0", "status": "production", "release_date": "2025-11-18", "frontend_only": true}'
  )
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- 4. GRANT PRODUCT ACCESS TO ALL ORGANIZATIONS
-- ============================================================================

-- This grants ALL organizations access to ALL products
-- Modify the WHERE clause if you want selective access
INSERT INTO organization_product_access (organization_id, product_id, is_enabled)
SELECT
  o.id AS organization_id,
  p.id AS product_id,
  true AS is_enabled
FROM organizations o
CROSS JOIN products p
WHERE NOT EXISTS (
  SELECT 1
  FROM organization_product_access opa
  WHERE opa.organization_id = o.id
    AND opa.product_id = p.id
)
ORDER BY o.slug, p.key;

-- ============================================================================
-- 5. PERFORMANCE INDEXES
-- ============================================================================

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_key ON products(key);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Organization_product_access table indexes
CREATE INDEX IF NOT EXISTS idx_org_product_access_org ON organization_product_access(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_product_access_product ON organization_product_access(product_id);
CREATE INDEX IF NOT EXISTS idx_org_product_access_enabled ON organization_product_access(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_org_product_access_lookup ON organization_product_access(organization_id, product_id) WHERE is_enabled = true;

-- ============================================================================
-- 6. UPDATED_AT TRIGGER
-- ============================================================================

-- Ensure update_updated_at_column function exists (should already exist from contact management)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to products table
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to organization_product_access table
DROP TRIGGER IF EXISTS update_org_product_access_updated_at ON organization_product_access;
CREATE TRIGGER update_org_product_access_updated_at
  BEFORE UPDATE ON organization_product_access
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify the schema was created correctly

-- 7.1 Check products table
SELECT
  key,
  name,
  display_name,
  category,
  is_active,
  metadata->>'version' AS version,
  metadata->>'status' AS status
FROM products
ORDER BY key;

-- Expected result: 3 products (strategic_map, contact_management, document_parser)

-- 7.2 Check organization_product_access records
SELECT
  o.slug AS organization,
  p.key AS product,
  opa.is_enabled,
  opa.created_at
FROM organization_product_access opa
JOIN organizations o ON opa.organization_id = o.id
JOIN products p ON opa.product_id = p.id
ORDER BY o.slug, p.key;

-- Expected result: N organizations × 3 products = N×3 records

-- 7.3 Check indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('products', 'organization_product_access')
ORDER BY tablename, indexname;

-- Expected result: 4 indexes on products, 4 indexes on organization_product_access

-- 7.4 Get products for a specific organization (test query pattern)
SELECT
  p.key,
  p.name,
  p.display_name,
  p.description,
  p.category,
  p.icon,
  p.metadata
FROM products p
JOIN organization_product_access opa ON p.id = opa.product_id
JOIN organizations o ON opa.organization_id = o.id
WHERE o.slug = 'cloud'  -- Replace with your organization slug
  AND opa.is_enabled = true
  AND p.is_active = true
ORDER BY p.key;

-- Expected result: 3 products for organization 'cloud'

-- ============================================================================
-- 8. MANAGEMENT QUERIES (For Admins)
-- ============================================================================

-- 8.1 Grant product access to an organization
-- Example: Grant 'strategic_map' access to 'cloud' organization
/*
INSERT INTO organization_product_access (organization_id, product_id, is_enabled)
SELECT o.id, p.id, true
FROM organizations o, products p
WHERE o.slug = 'cloud' AND p.key = 'strategic_map'
ON CONFLICT (organization_id, product_id)
DO UPDATE SET
  is_enabled = true,
  updated_at = NOW();
*/

-- 8.2 Revoke product access from an organization
-- Example: Revoke 'contact_management' access from 'cloud' organization
/*
UPDATE organization_product_access
SET is_enabled = false, updated_at = NOW()
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'cloud')
  AND product_id = (SELECT id FROM products WHERE key = 'contact_management');
*/

-- 8.3 Check which organizations have access to a specific product
/*
SELECT
  o.slug,
  o.name,
  opa.is_enabled,
  opa.granted_at
FROM organization_product_access opa
JOIN organizations o ON opa.organization_id = o.id
WHERE opa.product_id = (SELECT id FROM products WHERE key = 'strategic_map')
ORDER BY o.slug;
*/

-- 8.4 Add a new product (when launching new features)
/*
INSERT INTO products (key, name, display_name, description, category, icon, metadata)
VALUES (
  'new_product_key',
  'New Product Name',
  'New Product 名称',
  'Description of the new product',
  'category_name',
  'IconName',
  '{"version": "1.0.0", "status": "beta"}'
);

-- Then grant access to organizations
INSERT INTO organization_product_access (organization_id, product_id, is_enabled)
SELECT o.id, p.id, true
FROM organizations o
CROSS JOIN products p
WHERE p.key = 'new_product_key'
  AND NOT EXISTS (
    SELECT 1 FROM organization_product_access opa
    WHERE opa.organization_id = o.id AND opa.product_id = p.id
  );
*/

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Summary:
-- ✅ Products table created/verified
-- ✅ 3 products seeded (strategic_map, contact_management, document_parser)
-- ✅ Organization_product_access table created/verified
-- ✅ Access records created for all org-product combinations
-- ✅ Performance indexes added
-- ✅ Triggers configured for updated_at columns
-- ✅ Verification and management queries provided

-- Next Steps:
-- 1. Run this file in Supabase SQL Editor
-- 2. Verify results with verification queries (section 7)
-- 3. Proceed with backend implementation (product_helper.js, middleware)
