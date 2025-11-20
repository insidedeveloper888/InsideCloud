-- ============================================================================
-- Setup Inventory Product for All Tenants
-- ============================================================================
-- This script adds the Inventory Management product to public.products
-- and grants access to all existing organizations
-- ============================================================================

-- Step 1: Check if product already exists
SELECT * FROM public.products WHERE key = 'inventory';

-- ============================================================================
-- Step 2: Insert Inventory Product (if not exists)
-- ============================================================================

INSERT INTO public.products (
  id,
  key,
  name,
  description,
  category,
  metadata
)
VALUES (
  gen_random_uuid(),  -- Generate unique ID
  'inventory',         -- Product key (must match code)
  'Inventory Management',  -- Display name
  'Complete inventory management system with stock tracking, purchase orders, suppliers, and warehouse management.',
  'operations',        -- Category: operations, analytics, etc.
  '{}'::jsonb         -- Metadata (JSON object for future use)
)
ON CONFLICT (key) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  metadata = EXCLUDED.metadata
RETURNING *;

-- ============================================================================
-- Step 3: Grant Access to ALL Organizations
-- ============================================================================

-- Insert organization_product_access for all existing organizations
INSERT INTO public.organization_product_access (
  id,
  organization_id,
  product_id,
  is_enabled,
  created_at
)
SELECT
  gen_random_uuid() AS id,
  o.id AS organization_id,
  p.id AS product_id,
  true AS is_enabled,
  NOW() AS created_at
FROM public.organizations o
CROSS JOIN (
  SELECT id FROM public.products WHERE key = 'inventory' LIMIT 1
) p
WHERE NOT EXISTS (
  -- Don't insert if access already exists
  SELECT 1
  FROM public.organization_product_access opa
  WHERE opa.organization_id = o.id
    AND opa.product_id = p.id
)
RETURNING *;

-- ============================================================================
-- Step 4: Verification
-- ============================================================================

-- Verify the product was created
SELECT
  id,
  key,
  name,
  category,
  description,
  created_at
FROM public.products
WHERE key = 'inventory';

-- Verify all organizations have access
SELECT
  o.slug AS organization_slug,
  o.name AS organization_name,
  p.name AS product_name,
  opa.is_enabled,
  opa.created_at AS access_granted_at
FROM public.organization_product_access opa
JOIN public.organizations o ON opa.organization_id = o.id
JOIN public.products p ON opa.product_id = p.id
WHERE p.key = 'inventory'
ORDER BY o.slug;

-- Count organizations with access
SELECT
  'Total Organizations' AS metric,
  COUNT(*) AS count
FROM public.organizations
UNION ALL
SELECT
  'Organizations with Inventory Access',
  COUNT(*)
FROM public.organization_product_access opa
JOIN public.products p ON opa.product_id = p.id
WHERE p.key = 'inventory';

-- ============================================================================
-- Step 5: (Optional) Enable for Future Organizations
-- ============================================================================

-- If you want new organizations to automatically get inventory access,
-- you would need to add a database trigger or handle it in your signup code.
-- For now, you can run Step 3 again anytime to grant access to new orgs.

-- ============================================================================
-- Alternative: Enable for Specific Organization Only
-- ============================================================================
/*

-- Use this if you only want to enable for ONE specific organization
INSERT INTO public.organization_product_access (
  id,
  organization_id,
  product_id,
  is_enabled,
  created_at
)
SELECT
  gen_random_uuid(),
  o.id,
  p.id,
  true,
  NOW()
FROM public.organizations o
CROSS JOIN (SELECT id FROM public.products WHERE key = 'inventory') p
WHERE o.slug = 'YOUR-ORG-SLUG-HERE'  -- Replace with actual org slug
  AND NOT EXISTS (
    SELECT 1
    FROM public.organization_product_access opa
    WHERE opa.organization_id = o.id AND opa.product_id = p.id
  )
RETURNING *;

*/

-- ============================================================================
-- Disable Inventory for Specific Organization
-- ============================================================================
/*

-- If you need to revoke access for a specific organization
UPDATE public.organization_product_access
SET is_enabled = false
WHERE organization_id = (SELECT id FROM public.organizations WHERE slug = 'YOUR-ORG-SLUG')
  AND product_id = (SELECT id FROM public.products WHERE key = 'inventory')
RETURNING *;

*/

-- ============================================================================
-- Complete Cleanup (Remove Product & All Access)
-- ============================================================================
/*

-- WARNING: This removes the product and all access records
-- Use only if you need to completely remove inventory product

-- Delete all access records first
DELETE FROM public.organization_product_access
WHERE product_id = (SELECT id FROM public.products WHERE key = 'inventory');

-- Then delete the product
DELETE FROM public.products
WHERE key = 'inventory';

*/
