-- ============================================================================
-- Migration: Add location_id to Purchase Orders
-- ============================================================================
-- This adds a receiving warehouse/location field to purchase orders
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add location_id column to inventory_purchase_orders
ALTER TABLE inventory_purchase_orders
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES inventory_locations(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_inventory_purchase_orders_location
  ON inventory_purchase_orders(location_id);

-- Add comment
COMMENT ON COLUMN inventory_purchase_orders.location_id IS 'Warehouse/location where goods will be received';

-- Verify the column was added
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'inventory_purchase_orders'
  AND column_name = 'location_id';

SELECT 'Migration completed! location_id added to inventory_purchase_orders' AS result;
