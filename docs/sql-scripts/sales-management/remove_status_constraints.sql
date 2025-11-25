-- ============================================================================
-- REMOVE STATUS CHECK CONSTRAINTS FOR MULTI-TENANT FLEXIBILITY
-- ============================================================================
-- Purpose: Remove hardcoded status check constraints to allow organizations
--          to configure their own custom statuses via the settings UI
-- Date: 2025-11-24
-- ============================================================================

-- Drop check constraint on sales_orders.status
-- This allows organizations to use custom statuses configured in sales_document_statuses table
ALTER TABLE sales_orders 
DROP CONSTRAINT IF EXISTS sales_orders_status_check;

-- Drop check constraint on quotations.status (if it exists)
ALTER TABLE quotations 
DROP CONSTRAINT IF EXISTS quotations_status_check;

-- Drop check constraint on delivery_orders.status (if it exists)
ALTER TABLE delivery_orders 
DROP CONSTRAINT IF EXISTS delivery_orders_status_check;

-- Drop check constraint on invoices.status (if it exists)
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_status_check;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that constraints have been removed
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname LIKE '%status_check%'
  AND conrelid::regclass::text IN ('sales_orders', 'quotations', 'delivery_orders', 'invoices');

-- If the above query returns no rows, the constraints have been successfully removed

-- ============================================================================
-- NOTES
-- ============================================================================
-- After running this script:
-- 1. Status values will be validated by the application layer
-- 2. Organizations can configure custom statuses via the Settings UI
-- 3. Status values are stored in the sales_document_statuses table
-- 4. The application will enforce that only configured statuses can be used
-- ============================================================================
