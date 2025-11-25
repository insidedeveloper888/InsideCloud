-- ============================================================================
-- SALES ORDER STATUS CONFIGURATION
-- ============================================================================
-- Version: 1.1.0
-- Created: 2025-11-22
-- Purpose: Add configurable order statuses with single "completed" flag
-- ============================================================================

-- Create status configuration table
CREATE TABLE IF NOT EXISTS sales_order_status_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- User-defined status
  status_key TEXT NOT NULL,  -- 'draft', 'delivered', 'completed', etc.
  status_label TEXT NOT NULL,  -- Display name: 'Draft', 'Delivered', etc.
  status_color TEXT NOT NULL DEFAULT '#3B82F6',  -- Hex color

  -- THE KEY FIELD: Only one status can have this as true
  is_completed_status BOOLEAN DEFAULT FALSE,
  -- This flag determines which orders count as revenue in analytics

  -- Display order and active state
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(organization_id, status_key)
);

-- Create unique index: Only ONE status can be marked as completed per organization
CREATE UNIQUE INDEX idx_one_completed_status_per_org
ON sales_order_status_config (organization_id)
WHERE is_completed_status = TRUE;

-- Add index for performance
CREATE INDEX idx_status_config_org_active
ON sales_order_status_config (organization_id, is_active);

-- ============================================================================
-- SEED DEFAULT STATUSES FOR EXISTING ORGANIZATIONS
-- ============================================================================

-- Insert default statuses for all existing organizations that have sales_order_settings
INSERT INTO sales_order_status_config (
  organization_id,
  status_key,
  status_label,
  status_color,
  is_completed_status,
  sort_order,
  is_active
)
SELECT
  organization_id,
  status_key,
  status_label,
  status_color,
  is_completed_status,
  sort_order,
  TRUE as is_active
FROM (
  SELECT
    organization_id,
    'draft' as status_key,
    'Draft' as status_label,
    '#6B7280' as status_color,
    FALSE as is_completed_status,
    0 as sort_order
  FROM sales_order_settings

  UNION ALL

  SELECT
    organization_id,
    'confirmed',
    'Confirmed',
    '#3B82F6',
    FALSE,
    1
  FROM sales_order_settings

  UNION ALL

  SELECT
    organization_id,
    'processing',
    'Processing',
    '#F59E0B',
    FALSE,
    2
  FROM sales_order_settings

  UNION ALL

  SELECT
    organization_id,
    'shipped',
    'Shipped',
    '#8B5CF6',
    FALSE,
    3
  FROM sales_order_settings

  UNION ALL

  SELECT
    organization_id,
    'delivered',
    'Delivered',
    '#10B981',
    TRUE,  -- This is the completed status
    4
  FROM sales_order_settings

  UNION ALL

  SELECT
    organization_id,
    'cancelled',
    'Cancelled',
    '#EF4444',
    FALSE,
    5
  FROM sales_order_settings
) AS default_statuses
ON CONFLICT (organization_id, status_key) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE sales_order_status_config IS 'Configurable order statuses per organization';
COMMENT ON COLUMN sales_order_status_config.status_key IS 'Unique key for the status (e.g., draft, delivered)';
COMMENT ON COLUMN sales_order_status_config.status_label IS 'Display name shown to users';
COMMENT ON COLUMN sales_order_status_config.status_color IS 'Hex color code for UI display';
COMMENT ON COLUMN sales_order_status_config.is_completed_status IS 'Only ONE status per org can be TRUE - determines revenue calculation';
COMMENT ON COLUMN sales_order_status_config.sort_order IS 'Display order in dropdowns and lists';
