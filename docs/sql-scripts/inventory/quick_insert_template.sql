-- ============================================================================
-- QUICK INSERT TEMPLATE - Copy and customize this
-- ============================================================================
-- Replace YOUR-ORG-SLUG with your actual organization slug
-- ============================================================================

-- Step 1: Find your organization ID (run this first)
SELECT id, slug FROM organizations WHERE slug = 'YOUR-ORG-SLUG';

-- Step 2: Insert Product + Create Stock in one go
WITH org AS (
  SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1
),
location AS (
  SELECT id FROM inventory_locations
  WHERE organization_id = (SELECT id FROM org)
    AND code = 'MAIN'
  LIMIT 1
),
new_product AS (
  INSERT INTO inventory_products (organization_id, sku, name, category, unit, description)
  VALUES (
    (SELECT id FROM org),
    'YOUR-SKU-HERE',           -- Change this: e.g., 'CAM-003'
    'YOUR-PRODUCT-NAME',       -- Change this: e.g., 'Outdoor Camera'
    'CCTV',                    -- Change this: CCTV, Networking, Cable, etc.
    'pcs',                     -- Change this: pcs, box, meter, roll, set
    'Product description here' -- Optional description
  )
  ON CONFLICT (organization_id, sku) DO UPDATE
  SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit = EXCLUDED.unit,
    description = EXCLUDED.description,
    updated_at = NOW()
  RETURNING id, sku, name
)
INSERT INTO inventory_stock_items (
  organization_id,
  product_id,
  location_id,
  quantity,
  reserved_quantity,
  average_cost,
  low_stock_threshold
)
SELECT
  (SELECT id FROM org),
  new_product.id,
  (SELECT id FROM location),
  10,      -- Change this: initial quantity
  0,       -- Usually 0 (reserved)
  100.00,  -- Change this: unit cost
  3        -- Change this: your threshold setting
FROM new_product
ON CONFLICT (organization_id, product_id, location_id) DO UPDATE
SET
  quantity = inventory_stock_items.quantity + EXCLUDED.quantity,
  updated_at = NOW()
RETURNING *;

-- Step 3: Verify it appears in your inventory
SELECT
  p.sku,
  p.name,
  p.category,
  si.quantity,
  si.available_quantity AS available,
  si.low_stock_threshold,
  CASE
    WHEN si.available_quantity = 0 THEN 'out_of_stock'
    WHEN si.available_quantity <= si.low_stock_threshold THEN 'low_stock'
    ELSE 'normal'
  END AS status
FROM inventory_stock_items si
JOIN inventory_products p ON si.product_id = p.id
WHERE si.organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1)
ORDER BY p.created_at DESC
LIMIT 10;
