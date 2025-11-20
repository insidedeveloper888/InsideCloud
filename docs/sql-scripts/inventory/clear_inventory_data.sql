-- ============================================================================
-- CLEAR ALL INVENTORY DATA (DESTRUCTIVE - USE WITH CAUTION!)
-- ============================================================================
-- This script deletes ALL inventory data for your organization
-- Replace 'YOUR-ORG-SLUG' with your actual organization slug
--
-- WARNING: This action cannot be undone!
-- Make sure you have a backup before running this script
-- ============================================================================

-- Step 1: Verify your organization (ALWAYS RUN THIS FIRST!)
SELECT id, slug, name FROM organizations WHERE slug = 'YOUR-ORG-SLUG';
-- Copy the 'id' value to confirm it's correct

-- Step 2: Preview what will be deleted
SELECT 'Purchase Order Items' AS table_name, COUNT(*) AS count
FROM inventory_purchase_order_items poi
JOIN inventory_purchase_orders po ON poi.purchase_order_id = po.id
WHERE po.organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1)
UNION ALL
SELECT 'Purchase Orders', COUNT(*)
FROM inventory_purchase_orders
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1)
UNION ALL
SELECT 'Stock Movements', COUNT(*)
FROM inventory_stock_movements
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1)
UNION ALL
SELECT 'Stock Items', COUNT(*)
FROM inventory_stock_items
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1)
UNION ALL
SELECT 'Products', COUNT(*)
FROM inventory_products
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1)
UNION ALL
SELECT 'Suppliers', COUNT(*)
FROM inventory_suppliers
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1)
UNION ALL
SELECT 'Locations', COUNT(*)
FROM inventory_locations
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1);

-- ============================================================================
-- Step 3: DELETE ALL DATA (DESTRUCTIVE!)
-- ============================================================================
-- Uncomment the section below ONLY when you're ready to delete

/*
-- Delete in correct order (respecting foreign key constraints)
-- 1. Purchase Order Items first (child records)
DELETE FROM inventory_purchase_order_items
WHERE purchase_order_id IN (
  SELECT id FROM inventory_purchase_orders
  WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1)
);

-- 2. Purchase Orders
DELETE FROM inventory_purchase_orders
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1);

-- 3. Supplier Prices
DELETE FROM inventory_supplier_prices
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1);

-- 4. Stock Movements
DELETE FROM inventory_stock_movements
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1);

-- 5. Stock Items
DELETE FROM inventory_stock_items
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1);

-- 6. Products
DELETE FROM inventory_products
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1);

-- 7. Suppliers
DELETE FROM inventory_suppliers
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1);

-- 8. Locations (Optional - you may want to keep these)
-- DELETE FROM inventory_locations
-- WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1);

-- 9. Settings (Optional - you may want to keep these)
-- DELETE FROM inventory_settings
-- WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1);

SELECT 'Inventory data cleared successfully!' AS result;
*/

-- ============================================================================
-- Alternative: Clear specific data only
-- ============================================================================

-- Option A: Clear only transactions (keep products, suppliers, locations)
/*
DELETE FROM inventory_purchase_order_items
WHERE purchase_order_id IN (
  SELECT id FROM inventory_purchase_orders
  WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1)
);

DELETE FROM inventory_purchase_orders
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1);

DELETE FROM inventory_stock_movements
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1);

DELETE FROM inventory_stock_items
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1);

SELECT 'Transaction data cleared! Products and suppliers preserved.' AS result;
*/

-- Option B: Reset stock quantities to zero (keep everything, just reset quantities)
/*
UPDATE inventory_stock_items
SET
  quantity = 0,
  reserved_quantity = 0,
  updated_at = NOW()
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1);

SELECT 'All stock quantities reset to zero!' AS result;
*/

-- ============================================================================
-- Verification after deletion
-- ============================================================================
-- Run this after deletion to verify everything is cleared
/*
SELECT 'Remaining Records After Deletion:' AS status;

SELECT 'Purchase Orders' AS table_name, COUNT(*) AS remaining
FROM inventory_purchase_orders
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1)
UNION ALL
SELECT 'Stock Items', COUNT(*)
FROM inventory_stock_items
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1)
UNION ALL
SELECT 'Products', COUNT(*)
FROM inventory_products
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1)
UNION ALL
SELECT 'Suppliers', COUNT(*)
FROM inventory_suppliers
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'YOUR-ORG-SLUG' LIMIT 1);
*/
