-- ============================================================================
-- QUICK SETUP: Enable Inventory for All Tenants (One Command)
-- ============================================================================
-- Copy and paste this entire block into Supabase SQL Editor
-- ============================================================================

-- Step 1: Create the product (if not exists)
INSERT INTO public.products (id, key, name, description, category, metadata)
VALUES (
  gen_random_uuid(),
  'inventory',
  'Inventory Management',
  'Complete inventory management system with stock tracking, purchase orders, suppliers, and warehouse management.',
  'operations',
  '{}'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category;

-- Step 2: Enable for ALL organizations
INSERT INTO public.organization_product_access (id, organization_id, product_id, is_enabled, created_at)
SELECT
  gen_random_uuid(),
  o.id,
  (SELECT id FROM public.products WHERE key = 'inventory'),
  true,
  NOW()
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_product_access opa
  WHERE opa.organization_id = o.id
    AND opa.product_id = (SELECT id FROM public.products WHERE key = 'inventory')
);

-- Step 3: Verify (check results)
SELECT
  o.slug AS org,
  p.name AS product,
  opa.is_enabled AS enabled
FROM public.organization_product_access opa
JOIN public.organizations o ON opa.organization_id = o.id
JOIN public.products p ON opa.product_id = p.id
WHERE p.key = 'inventory'
ORDER BY o.slug;
