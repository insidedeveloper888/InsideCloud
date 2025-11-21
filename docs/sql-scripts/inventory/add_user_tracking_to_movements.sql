-- ============================================================================
-- Enhance Inventory Stock Movements with User Tracking
-- ============================================================================
-- This script adds user information display to stock movements
-- It creates a view that joins movements with user data from individuals table
--
-- Features:
-- - Show user name for each movement
-- - Track movement source (PO, manual stock in, manual stock out, refund, etc.)
-- - Support for both Lark users and direct users
-- ============================================================================

-- 1. First, let's verify the current schema has the necessary fields
-- The inventory_stock_movements table should already have:
--   - created_by_individual_id (UUID) - links to individuals table
--   - reference_type (TEXT) - 'purchase_order', 'manual', 'return', 'refund', 'adjustment'
--   - reference_id (UUID) - links to the source document

-- 2. Create a view for movements with user information
-- NOTE: Table structure verified via Supabase MCP:
--   - individuals table has: id, user_id, display_name, primary_email, avatar_url, profile (JSONB)
--   - lark_users table has: id, lark_user_id, name, email, avatar_url, lark_union_id
--   - JOIN relationship: individuals.profile->'profile'->>'user_id' = lark_users.lark_user_id
CREATE OR REPLACE VIEW inventory_stock_movements_with_users AS
SELECT
  m.id,
  m.organization_id,
  m.product_id,
  m.location_id,
  m.movement_type,
  m.quantity,
  m.unit_cost,
  m.total_cost,
  m.project_id,
  m.reference_type,
  m.reference_id,
  m.notes,
  m.scan_code,
  m.occurred_at,
  m.created_at,
  m.created_by_individual_id,

  -- User information (from individuals table, preferring lark_users if available)
  COALESCE(lu.name, i.display_name) as created_by_name,
  COALESCE(lu.email, i.primary_email) as created_by_email,
  COALESCE(lu.avatar_url, i.avatar_url) as created_by_avatar_url,
  lu.lark_user_id as created_by_lark_user_id,
  lu.lark_union_id as created_by_union_id,

  -- Product information
  p.sku as product_sku,
  p.name as product_name,
  p.unit as product_unit,

  -- Location information
  l.name as location_name,
  l.code as location_code,

  -- Reference type display (user-friendly labels)
  CASE m.reference_type
    WHEN 'purchase_order' THEN 'Purchase Order'
    WHEN 'manual' THEN 'Manual Entry'
    WHEN 'return' THEN 'Customer Return'
    WHEN 'refund' THEN 'Refund/Return to Supplier'
    WHEN 'adjustment' THEN 'Stock Adjustment'
    WHEN 'transfer' THEN 'Location Transfer'
    WHEN 'project' THEN 'Project Usage'
    ELSE 'Other'
  END as reference_type_display

FROM inventory_stock_movements m
LEFT JOIN individuals i ON m.created_by_individual_id = i.id
LEFT JOIN lark_users lu ON (i.profile->'profile'->>'user_id') = lu.lark_user_id
LEFT JOIN inventory_products p ON m.product_id = p.id
LEFT JOIN inventory_locations l ON m.location_id = l.id;

-- 3. Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_by
  ON inventory_stock_movements(created_by_individual_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_reference
  ON inventory_stock_movements(reference_type, reference_id);

-- 4. Update reference_type check constraint to include new types
-- First, drop the old constraint
ALTER TABLE inventory_stock_movements
  DROP CONSTRAINT IF EXISTS inventory_stock_movements_reference_type_check;

-- Add new constraint with expanded reference types
ALTER TABLE inventory_stock_movements
  ADD CONSTRAINT inventory_stock_movements_reference_type_check
  CHECK (reference_type IS NULL OR reference_type IN (
    'purchase_order',
    'manual',
    'return',
    'refund',
    'adjustment',
    'transfer',
    'project',
    'sales_order'
  ));

-- 5. Grant SELECT permission on the view to authenticated users
-- (Adjust this based on your RLS policies)
GRANT SELECT ON inventory_stock_movements_with_users TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if view was created successfully
SELECT COUNT(*) as total_movements_with_users
FROM inventory_stock_movements_with_users;

-- Sample query: Get recent movements with user names
SELECT
  occurred_at,
  movement_type,
  product_name,
  quantity,
  location_name,
  reference_type_display,
  COALESCE(created_by_name, 'System') as created_by,
  notes
FROM inventory_stock_movements_with_users
ORDER BY occurred_at DESC
LIMIT 10;

-- ============================================================================
-- USAGE NOTES
-- ============================================================================
--
-- Frontend API Changes Needed:
-- 1. Update stock movements query to use the new view
-- 2. Display user name in movements table
-- 3. Add "Stock In" button for manual entries (refund, return, adjustment)
--
-- Example Frontend Query:
--   SELECT * FROM inventory_stock_movements_with_users
--   WHERE organization_id = $1
--   ORDER BY occurred_at DESC;
--
-- ============================================================================
