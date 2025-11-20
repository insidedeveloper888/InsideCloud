-- ============================================================================
-- Manual Insert Guide for InsideCloud Inventory Management
-- ============================================================================
-- Use this guide to manually insert products via Supabase SQL Editor
--
-- IMPORTANT: Replace 'your-org-slug' with your actual organization slug
-- ============================================================================

-- ============================================================================
-- STEP 1: Get Your Organization ID
-- ============================================================================
-- Run this first to find your organization_id
SELECT id, slug, name
FROM organizations
LIMIT 10;

-- Copy the 'id' value for your organization (it's a UUID)
-- Example: '123e4567-e89b-12d3-a456-426614174000'

-- ============================================================================
-- STEP 2: Check Existing Locations (Warehouses)
-- ============================================================================
-- See what locations you already have
SELECT
  id,
  name,
  code,
  organization_id
FROM inventory_locations
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'your-org-slug' LIMIT 1);

-- If no location exists, create one:
INSERT INTO inventory_locations (organization_id, name, code, address)
VALUES (
  (SELECT id FROM organizations WHERE slug = 'your-org-slug' LIMIT 1),
  'Main Warehouse',
  'MAIN',
  'Your warehouse address'
)
ON CONFLICT (organization_id, code) DO NOTHING
RETURNING id, name, code;

-- Copy the location 'id' for later use

-- ============================================================================
-- STEP 3: Insert a New Product
-- ============================================================================
-- Insert a product into the catalog
INSERT INTO inventory_products (
  organization_id,
  sku,
  name,
  category,
  unit,
  description
)
VALUES (
  (SELECT id FROM organizations WHERE slug = 'your-org-slug' LIMIT 1),
  'HD-CAM-002',              -- SKU (must be unique)
  '4K IP Camera',            -- Product name
  'CCTV',                    -- Category
  'pcs',                     -- Unit (pcs, box, meter, roll, set)
  '4K resolution IP camera with night vision'  -- Description
)
ON CONFLICT (organization_id, sku) DO NOTHING
RETURNING id, sku, name;

-- Copy the product 'id' that was returned

-- ============================================================================
-- STEP 4: Create Stock Item (Add Quantity to Location)
-- ============================================================================
-- This creates the actual inventory record with quantity
INSERT INTO inventory_stock_items (
  organization_id,
  product_id,
  location_id,
  quantity,
  reserved_quantity,
  average_cost,
  low_stock_threshold
)
VALUES (
  (SELECT id FROM organizations WHERE slug = 'your-org-slug' LIMIT 1),
  (SELECT id FROM inventory_products WHERE sku = 'HD-CAM-002' AND organization_id = (SELECT id FROM organizations WHERE slug = 'your-org-slug' LIMIT 1) LIMIT 1),
  (SELECT id FROM inventory_locations WHERE code = 'MAIN' AND organization_id = (SELECT id FROM organizations WHERE slug = 'your-org-slug' LIMIT 1) LIMIT 1),
  10,          -- Initial quantity
  0,           -- Reserved quantity (usually 0)
  250.00,      -- Average unit cost
  3            -- Low stock threshold (use your setting value)
)
ON CONFLICT (organization_id, product_id, location_id) DO UPDATE
SET
  quantity = inventory_stock_items.quantity + EXCLUDED.quantity,
  updated_at = NOW()
RETURNING id, quantity, average_cost, low_stock_threshold;

-- ============================================================================
-- STEP 5: Verify the Data
-- ============================================================================
-- Check if your product appears correctly
SELECT
  p.sku,
  p.name AS product_name,
  p.category,
  p.unit,
  l.name AS location_name,
  si.quantity,
  si.reserved_quantity,
  si.available_quantity,
  si.average_cost,
  si.low_stock_threshold,
  CASE
    WHEN si.available_quantity = 0 THEN 'out_of_stock'
    WHEN si.available_quantity <= si.low_stock_threshold THEN 'low_stock'
    ELSE 'normal'
  END AS stock_status
FROM inventory_stock_items si
JOIN inventory_products p ON si.product_id = p.id
LEFT JOIN inventory_locations l ON si.location_id = l.id
WHERE si.organization_id = (SELECT id FROM organizations WHERE slug = 'your-org-slug' LIMIT 1)
ORDER BY p.name;

-- ============================================================================
-- BULK INSERT: Multiple Products at Once
-- ============================================================================
-- Example: Insert 3 products at once
WITH new_products AS (
  INSERT INTO inventory_products (organization_id, sku, name, category, unit, description)
  SELECT
    (SELECT id FROM organizations WHERE slug = 'your-org-slug' LIMIT 1) AS organization_id,
    unnest(ARRAY['NVR-16CH', 'POE-SW-8P', 'CAT6-CABLE']) AS sku,
    unnest(ARRAY['16 Channel NVR', '8-Port PoE Switch', 'CAT6 Network Cable']) AS name,
    unnest(ARRAY['CCTV', 'Networking', 'Cable']) AS category,
    unnest(ARRAY['pcs', 'pcs', 'meter']) AS unit,
    unnest(ARRAY['Network Video Recorder 16CH', 'Gigabit PoE Switch 8 ports', 'Category 6 Ethernet Cable']) AS description
  ON CONFLICT (organization_id, sku) DO NOTHING
  RETURNING id, sku, name
)
SELECT * FROM new_products;

-- Then create stock items for all of them
INSERT INTO inventory_stock_items (organization_id, product_id, location_id, quantity, average_cost, low_stock_threshold)
SELECT
  (SELECT id FROM organizations WHERE slug = 'your-org-slug' LIMIT 1),
  p.id,
  (SELECT id FROM inventory_locations WHERE code = 'MAIN' AND organization_id = (SELECT id FROM organizations WHERE slug = 'your-org-slug' LIMIT 1) LIMIT 1),
  5,        -- Default quantity
  100.00,   -- Default cost
  3         -- Your threshold setting
FROM inventory_products p
WHERE p.organization_id = (SELECT id FROM organizations WHERE slug = 'your-org-slug' LIMIT 1)
  AND p.sku IN ('NVR-16CH', 'POE-SW-8P', 'CAT6-CABLE')
ON CONFLICT (organization_id, product_id, location_id) DO NOTHING;

-- ============================================================================
-- TROUBLESHOOTING: Common Queries
-- ============================================================================

-- See all products (no stock info)
SELECT id, sku, name, category, unit
FROM inventory_products
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'your-org-slug' LIMIT 1)
ORDER BY created_at DESC;

-- See all stock items with product details
SELECT
  p.sku,
  p.name,
  l.name AS warehouse,
  si.quantity,
  si.available_quantity,
  si.low_stock_threshold
FROM inventory_stock_items si
JOIN inventory_products p ON si.product_id = p.id
LEFT JOIN inventory_locations l ON si.location_id = l.id
WHERE si.organization_id = (SELECT id FROM organizations WHERE slug = 'your-org-slug' LIMIT 1);

-- Delete a product (will cascade delete stock items)
DELETE FROM inventory_products
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'your-org-slug' LIMIT 1)
  AND sku = 'HD-CAM-002';

-- Update product quantity directly
UPDATE inventory_stock_items
SET
  quantity = 15,
  updated_at = NOW()
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'your-org-slug' LIMIT 1)
  AND product_id = (SELECT id FROM inventory_products WHERE sku = 'HD-CAM-002' LIMIT 1);

-- ============================================================================
-- END OF GUIDE
-- ============================================================================
