-- =====================================================
-- Product Status Enhancement
-- Adds product lifecycle status support
-- =====================================================
-- Enables "Coming Soon", "Beta", "Deprecated" products
-- to be displayed in UI with appropriate UX
-- =====================================================

-- Add status column with constraint
ALTER TABLE products
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
CHECK (status IN ('active', 'coming_soon', 'beta', 'deprecated'));

-- Add comment explaining the statuses
COMMENT ON COLUMN products.status IS
'Product lifecycle status:
- active: Fully available product
- coming_soon: Show in UI but not accessible yet
- beta: Available but experimental/testing
- deprecated: Being phased out, may be removed';

-- Create index for efficient status filtering
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Update existing products to have explicit status
UPDATE products
SET status = 'active'
WHERE status IS NULL;

-- =====================================================
-- Example: Add "Coming Soon" products
-- =====================================================

-- Example 1: Work Specification (工作规格)
INSERT INTO products (
  id,
  key,
  name,
  description,
  category,
  icon,
  status,
  is_active,
  metadata,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'work_specification',
  '工作规格',
  'Define job specifications, roles, and responsibilities with structured templates',
  'hr',
  'SheetIcon',
  'coming_soon',  -- Coming Soon status
  true,
  '{"version": "1.0.0", "planned_release": "2025-12", "priority": "high"}',
  NOW(),
  NOW()
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Example 2: Promotion System (晋升机制)
INSERT INTO products (
  id,
  key,
  name,
  description,
  category,
  icon,
  status,
  is_active,
  metadata,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'promotion_system',
  '晋升机制',
  'Career progression framework with promotion criteria, level definitions, and evaluation workflows',
  'hr',
  'PromotionIcon',
  'coming_soon',  -- Coming Soon status
  true,
  '{"version": "1.0.0", "planned_release": "2026-01", "priority": "medium"}',
  NOW(),
  NOW()
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- =====================================================
-- IMPORTANT: Coming Soon products and access control
-- =====================================================

-- Coming Soon products should NOT have organization_product_access records
-- This prevents them from being accessible even if status changes
-- When ready to launch:
--   1. UPDATE products SET status = 'active' WHERE key = 'work_specification'
--   2. Grant access: INSERT INTO organization_product_access (...)

-- Alternatively, you can pre-create access records with is_enabled = false
-- and enable them when ready to launch:
/*
INSERT INTO organization_product_access (
  organization_id,
  product_id,
  is_enabled,
  granted_at,
  metadata
)
SELECT
  o.id,
  p.id,
  false,  -- Disabled until launch
  NOW(),
  '{"pre_created": true, "launch_ready": false}'
FROM organizations o
CROSS JOIN products p
WHERE p.key = 'work_specification'
ON CONFLICT (organization_id, product_id) DO NOTHING;
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- View all products with their status
SELECT
  key,
  name,
  status,
  is_active,
  category,
  icon,
  metadata->>'planned_release' AS planned_release,
  created_at
FROM products
ORDER BY
  CASE status
    WHEN 'active' THEN 1
    WHEN 'beta' THEN 2
    WHEN 'coming_soon' THEN 3
    WHEN 'deprecated' THEN 4
  END,
  key;

-- Count products by status
SELECT
  status,
  COUNT(*) as count,
  STRING_AGG(name, ', ') as products
FROM products
WHERE is_active = true
GROUP BY status
ORDER BY count DESC;

-- View Coming Soon products specifically
SELECT
  key,
  name,
  metadata->>'planned_release' AS planned_release,
  metadata->>'priority' AS priority
FROM products
WHERE status = 'coming_soon'
  AND is_active = true
ORDER BY metadata->>'planned_release';

-- View organization access for all products (including coming soon)
SELECT
  o.slug AS organization,
  p.key AS product,
  p.name AS product_name,
  p.status AS product_status,
  COALESCE(opa.is_enabled, false) AS has_access
FROM products p
CROSS JOIN organizations o
LEFT JOIN organization_product_access opa
  ON opa.organization_id = o.id
  AND opa.product_id = p.id
WHERE p.is_active = true
  AND o.is_active = true
ORDER BY o.slug, p.status, p.key;
