-- ============================================================================
-- SALES MANAGEMENT PRODUCT SETUP
-- ============================================================================
-- Version: 1.0.0
-- Created: 2025-11-22
-- Purpose: Initialize sales_management product in products table and grant
--          access to all organizations
--
-- Run this script AFTER running sales-management-complete-schema.sql
-- ============================================================================

-- ============================================================================
-- 1. INSERT SALES MANAGEMENT PRODUCT
-- ============================================================================

INSERT INTO products (key, name, description, category, icon, metadata, is_active)
VALUES (
  'sales_management',
  '销售管理',
  'Comprehensive sales order management system with customer assignment, product selection, multi-item orders, and configurable running numbers.',
  'crm',
  'ShoppingCart',
  '{
    "version": "1.0.0",
    "status": "active",
    "release_date": "2025-11-22",
    "displayName": "Sales Management",
    "features": [
      "Multi-item sales orders",
      "Customer and sales person assignment",
      "Configurable running number format",
      "Team-based visibility",
      "Sales analytics dashboard",
      "Integration-ready for accounting software"
    ]
  }'::jsonb,
  true
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  metadata = EXCLUDED.metadata,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================================
-- 2. GRANT ACCESS TO ALL ORGANIZATIONS
-- ============================================================================

-- This grants ALL organizations access to sales_management product
INSERT INTO organization_product_access (organization_id, product_id, is_enabled)
SELECT
  o.id AS organization_id,
  p.id AS product_id,
  true AS is_enabled
FROM organizations o
CROSS JOIN products p
WHERE p.key = 'sales_management'
  AND NOT EXISTS (
    SELECT 1
    FROM organization_product_access opa
    WHERE opa.organization_id = o.id
      AND opa.product_id = p.id
  )
ORDER BY o.slug;

-- ============================================================================
-- 3. INITIALIZE DEFAULT SETTINGS FOR EXISTING ORGANIZATIONS
-- ============================================================================

-- Create default sales_order_settings for organizations that don't have one yet
INSERT INTO sales_order_settings (
  organization_id,
  order_code_format,
  reset_period,
  default_tax_rate,
  tax_inclusive,
  sales_order_visibility,
  enable_sales_teams
)
SELECT
  o.id,
  'SO-{YYMM}-{5digits}',  -- Default format
  'monthly',               -- Reset monthly
  6.00,                    -- 6% SST (Malaysia)
  false,                   -- Tax not inclusive
  'organization',          -- Everyone can view
  false                    -- Teams disabled by default
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1
  FROM sales_order_settings sos
  WHERE sos.organization_id = o.id
)
ORDER BY o.slug;

-- ============================================================================
-- 4. VERIFICATION QUERIES
-- ============================================================================

-- 4.1 Verify product was created
SELECT
  key,
  name,
  category,
  icon,
  is_active,
  metadata->>'version' AS version,
  metadata->>'status' AS status
FROM products
WHERE key = 'sales_management';

-- Expected: 1 row with sales_management product

-- 4.2 Verify organization access grants
SELECT
  o.slug AS organization,
  o.name AS organization_name,
  p.key AS product,
  opa.is_enabled,
  opa.created_at
FROM organization_product_access opa
JOIN organizations o ON opa.organization_id = o.id
JOIN products p ON opa.product_id = p.id
WHERE p.key = 'sales_management'
ORDER BY o.slug;

-- Expected: N rows (one per organization)

-- 4.3 Verify default settings were created
SELECT
  o.slug AS organization,
  sos.order_code_format,
  sos.reset_period,
  sos.default_tax_rate,
  sos.sales_order_visibility,
  sos.enable_sales_teams,
  sos.next_order_number
FROM sales_order_settings sos
JOIN organizations o ON sos.organization_id = o.id
ORDER BY o.slug;

-- Expected: N rows (one per organization) with default settings

-- 4.4 Count totals
SELECT
  (SELECT COUNT(*) FROM products WHERE key = 'sales_management') AS product_count,
  (SELECT COUNT(*) FROM organization_product_access opa
   JOIN products p ON opa.product_id = p.id
   WHERE p.key = 'sales_management') AS access_grants,
  (SELECT COUNT(*) FROM sales_order_settings) AS settings_count,
  (SELECT COUNT(*) FROM organizations) AS total_organizations;

-- Expected: product_count = 1, access_grants = total_organizations, settings_count = total_organizations

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
DECLARE
  v_org_count INTEGER;
  v_access_count INTEGER;
  v_settings_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_org_count FROM organizations;
  SELECT COUNT(*) INTO v_access_count FROM organization_product_access opa
    JOIN products p ON opa.product_id = p.id WHERE p.key = 'sales_management';
  SELECT COUNT(*) INTO v_settings_count FROM sales_order_settings;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Sales Management Product Setup Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Product: sales_management (销售管理)';
  RAISE NOTICE 'Organizations with access: % / %', v_access_count, v_org_count;
  RAISE NOTICE 'Default settings created: %', v_settings_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Verify product appears in dashboard';
  RAISE NOTICE '2. Update frontend icon mapping (ShoppingCart)';
  RAISE NOTICE '3. Deploy backend API endpoints';
  RAISE NOTICE '4. Test sales order creation';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- END OF SETUP SCRIPT
-- ============================================================================
