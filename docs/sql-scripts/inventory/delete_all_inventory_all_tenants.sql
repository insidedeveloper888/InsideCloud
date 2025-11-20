-- ============================================================================
-- DELETE ALL INVENTORY DATA FOR ALL TENANTS (DESTRUCTIVE - USE WITH CAUTION!)
-- ============================================================================
-- This script deletes ALL inventory data for ALL organizations/tenants
--
-- WARNING: This action cannot be undone!
-- Make sure you have a backup before running this script
-- ============================================================================

-- Step 1: Preview what will be deleted (ALWAYS RUN THIS FIRST!)
SELECT 'PREVIEW: Data that will be deleted across ALL tenants' AS status;

SELECT 'Purchase Order Items' AS table_name, COUNT(*) AS total_records
FROM inventory_purchase_order_items
UNION ALL
SELECT 'Purchase Orders', COUNT(*)
FROM inventory_purchase_orders
UNION ALL
SELECT 'Supplier Prices', COUNT(*)
FROM inventory_supplier_prices
UNION ALL
SELECT 'Stock Movements', COUNT(*)
FROM inventory_stock_movements
UNION ALL
SELECT 'Stock Items', COUNT(*)
FROM inventory_stock_items
UNION ALL
SELECT 'Products', COUNT(*)
FROM inventory_products
UNION ALL
SELECT 'Suppliers', COUNT(*)
FROM inventory_suppliers
UNION ALL
SELECT 'Locations', COUNT(*)
FROM inventory_locations
UNION ALL
SELECT 'Settings (Low Stock Thresholds)', COUNT(*)
FROM inventory_settings;

-- Step 2: Show breakdown by organization
SELECT
  o.slug AS organization,
  COUNT(DISTINCT p.id) AS products,
  COUNT(DISTINCT si.id) AS stock_items,
  COUNT(DISTINCT sm.id) AS movements,
  COUNT(DISTINCT po.id) AS purchase_orders,
  COUNT(DISTINCT s.id) AS suppliers,
  COUNT(DISTINCT l.id) AS locations,
  COUNT(DISTINCT sett.id) AS settings
FROM organizations o
LEFT JOIN inventory_products p ON p.organization_id = o.id
LEFT JOIN inventory_stock_items si ON si.organization_id = o.id
LEFT JOIN inventory_stock_movements sm ON sm.organization_id = o.id
LEFT JOIN inventory_purchase_orders po ON po.organization_id = o.id
LEFT JOIN inventory_suppliers s ON s.organization_id = o.id
LEFT JOIN inventory_locations l ON l.organization_id = o.id
LEFT JOIN inventory_settings sett ON sett.organization_id = o.id
GROUP BY o.id, o.slug
ORDER BY o.slug;

-- ============================================================================
-- Step 3: TRUNCATE ALL TABLES (DESTRUCTIVE!)
-- ============================================================================
-- Uncomment the section below ONLY when you're ready to delete ALL inventory
-- data for ALL tenants
/*

-- TRUNCATE is faster than DELETE and resets auto-increment counters
-- CASCADE automatically handles foreign key constraints

TRUNCATE TABLE inventory_purchase_order_items CASCADE;
TRUNCATE TABLE inventory_purchase_orders CASCADE;
TRUNCATE TABLE inventory_supplier_prices CASCADE;
TRUNCATE TABLE inventory_stock_movements CASCADE;
TRUNCATE TABLE inventory_stock_items CASCADE;
TRUNCATE TABLE inventory_products CASCADE;
TRUNCATE TABLE inventory_suppliers CASCADE;
TRUNCATE TABLE inventory_locations CASCADE;
TRUNCATE TABLE inventory_settings CASCADE;

SELECT 'All inventory data truncated successfully across ALL tenants!' AS result;

*/

-- ============================================================================
-- Step 4: Verification after deletion
-- ============================================================================
-- Run this after deletion to verify everything is cleared
/*

SELECT 'Remaining Records After Deletion:' AS status;

SELECT 'Purchase Order Items' AS table_name, COUNT(*) AS remaining
FROM inventory_purchase_order_items
UNION ALL
SELECT 'Purchase Orders', COUNT(*)
FROM inventory_purchase_orders
UNION ALL
SELECT 'Supplier Prices', COUNT(*)
FROM inventory_supplier_prices
UNION ALL
SELECT 'Stock Movements', COUNT(*)
FROM inventory_stock_movements
UNION ALL
SELECT 'Stock Items', COUNT(*)
FROM inventory_stock_items
UNION ALL
SELECT 'Products', COUNT(*)
FROM inventory_products
UNION ALL
SELECT 'Suppliers', COUNT(*)
FROM inventory_suppliers
UNION ALL
SELECT 'Locations', COUNT(*)
FROM inventory_locations
UNION ALL
SELECT 'Settings', COUNT(*)
FROM inventory_settings;

-- All counts should be 0 after successful deletion

*/

-- ============================================================================
-- IMPORTANT NOTES:
-- ============================================================================
-- 1. This script deletes data for ALL organizations/tenants
-- 2. Organizations themselves are NOT deleted (only their inventory data)
-- 3. Users and authentication data are NOT affected
-- 4. To delete specific tenant data only, use clear_inventory_data.sql instead
-- 5. After deletion, tenants can start fresh with new inventory data
-- 6. Settings will revert to default (threshold = 10) on first save
-- ============================================================================
