-- ============================================================================
-- Fix Inventory Constraints
-- ============================================================================
-- This migration fixes:
-- 1. Status constraint to allow 'partially_received'
-- 2. Column name mismatch in purchase_order_items table
-- ============================================================================

-- 1. Fix purchase order status constraint
-- Drop the old constraint (whatever it's called)
DO $$
BEGIN
    -- Drop constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'check_valid_status'
        AND conrelid = 'inventory_purchase_orders'::regclass
    ) THEN
        ALTER TABLE inventory_purchase_orders DROP CONSTRAINT check_valid_status;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'inventory_purchase_orders_status_check'
        AND conrelid = 'inventory_purchase_orders'::regclass
    ) THEN
        ALTER TABLE inventory_purchase_orders DROP CONSTRAINT inventory_purchase_orders_status_check;
    END IF;
END $$;

-- Add the correct constraint with all statuses
ALTER TABLE inventory_purchase_orders
ADD CONSTRAINT inventory_purchase_orders_status_check
CHECK (status IN ('draft', 'approved', 'ordered', 'partially_received', 'received', 'cancelled'));

-- ============================================================================
-- Verification queries
-- ============================================================================
-- Check the status constraint
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'inventory_purchase_orders'::regclass
AND conname LIKE '%status%';

-- Check purchase order items columns
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'inventory_purchase_order_items'
AND column_name IN ('quantity', 'received_quantity')
ORDER BY column_name;

SELECT '✅ Migration completed successfully!' AS result;
