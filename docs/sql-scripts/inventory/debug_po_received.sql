-- ============================================================================
-- DEBUG: Check if PO "received" creates stock movements
-- ============================================================================
-- Run these queries in Supabase SQL Editor to debug the PO issue
-- Replace 'YOUR-ORG-SLUG' with your actual organization slug
-- ============================================================================

-- Step 1: Check your existing purchase orders
SELECT
  id,
  code,
  status,
  total_amount,
  expected_delivery_date,
  created_at
FROM inventory_purchase_orders
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1)
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Check items in your latest PO (copy PO id from above)
SELECT
  poi.id,
  p.sku,
  p.name AS product_name,
  poi.quantity_ordered AS quantity,
  poi.unit_cost,
  poi.received_quantity
FROM inventory_purchase_order_items poi
JOIN inventory_products p ON poi.product_id = p.id
WHERE poi.purchase_order_id = 'YOUR-PO-ID-HERE'  -- Replace with actual PO ID
ORDER BY poi.created_at;

-- Step 3: Check if stock movements were created for this PO
SELECT
  sm.id,
  sm.movement_type,
  p.sku,
  p.name AS product_name,
  sm.quantity,
  sm.unit_cost,
  l.name AS warehouse,
  sm.reference_type,
  sm.occurred_at
FROM inventory_stock_movements sm
JOIN inventory_products p ON sm.product_id = p.id
LEFT JOIN inventory_locations l ON sm.location_id = l.id
WHERE sm.reference_type = 'purchase_order'
  AND sm.reference_id = 'YOUR-PO-ID-HERE'  -- Replace with actual PO ID
  AND sm.organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1);

-- Step 4: Check current stock items
SELECT
  p.sku,
  p.name AS product_name,
  l.name AS warehouse,
  si.quantity,
  si.available_quantity,
  si.updated_at
FROM inventory_stock_items si
JOIN inventory_products p ON si.product_id = p.id
LEFT JOIN inventory_locations l ON si.location_id = l.id
WHERE si.organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1)
ORDER BY si.updated_at DESC;

-- Step 5: Check all warehouses in your organization
SELECT
  id,
  name,
  code,
  active,
  created_at
FROM inventory_locations
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1)
ORDER BY created_at;

-- ============================================================================
-- EXPECTED BEHAVIOR:
-- ============================================================================
-- When you mark a PO as "received":
-- 1. Step 3 should show stock_movements with reference_type='purchase_order'
-- 2. Step 4 should show increased quantities in stock_items
-- 3. If Step 3 is empty, the auto stock-in failed silently
-- 4. If Step 5 shows multiple warehouses, stock went to the FIRST one
-- ============================================================================
