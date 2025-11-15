-- Migration: Strategic Map Tables and Cascade Logic
-- Version: 0002
-- Created: 2025-11-14
-- Description: Creates tables, indexes, triggers for Strategic Map v2 with auto-cascading

--=============================================
-- DROP EXISTING (if any)
--=============================================

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_create_cascaded_items ON strategic_map_items;
DROP TRIGGER IF EXISTS trigger_delete_cascaded_items ON strategic_map_items;
DROP TRIGGER IF EXISTS trigger_update_cascaded_items ON strategic_map_items;

-- Drop all functions that depend on strategic_map_items
DROP FUNCTION IF EXISTS create_cascaded_items();
DROP FUNCTION IF EXISTS delete_cascaded_items();
DROP FUNCTION IF EXISTS update_cascaded_items();
DROP FUNCTION IF EXISTS get_strategic_map_items(UUID, VARCHAR);
DROP FUNCTION IF EXISTS upsert_strategic_map_items(UUID, UUID, JSONB);

-- Drop old v1 functions if they exist
DROP FUNCTION IF EXISTS strategic_map_upsert_child(strategic_map_items, text, date, integer, text) CASCADE;
DROP FUNCTION IF EXISTS strategic_map_upsert_child CASCADE;

-- Drop tables with CASCADE to handle any remaining dependencies
DROP TABLE IF EXISTS strategic_map_audit_log CASCADE;
DROP TABLE IF EXISTS strategic_map_items CASCADE;

--=============================================
-- MAIN TABLE: strategic_map_items
--=============================================

CREATE TABLE strategic_map_items (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-Tenant Context
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by_individual_id UUID NOT NULL REFERENCES individuals(id) ON DELETE RESTRICT,

  -- Item Content
  text TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'neutral' CHECK (status IN ('neutral', 'done', 'fail')),

  -- Position & Hierarchy
  timeframe VARCHAR(20) NOT NULL CHECK (timeframe IN ('yearly', 'monthly', 'weekly', 'daily')),
  category_index INTEGER NOT NULL CHECK (category_index BETWEEN 0 AND 5),

  -- Timeframe-Specific Identifiers
  year_index INTEGER,           -- For yearly: 0-based index in years array
  month_col_index INTEGER,      -- For monthly: year * 12 + monthIndex
  week_number INTEGER,          -- For weekly: ISO week number (1-53)
  daily_date_key INTEGER,       -- For daily: YYYYMMDD format

  -- Cascade Tracking
  parent_item_id UUID REFERENCES strategic_map_items(id) ON DELETE CASCADE,
  is_cascaded BOOLEAN NOT NULL DEFAULT FALSE,
  cascade_level INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Constraint: Unique position per organization (only one item per cell initially)
  -- Note: This will be relaxed later to allow multiple items per cell
  CONSTRAINT strategic_map_items_unique_position
    UNIQUE NULLS NOT DISTINCT (
      organization_id,
      timeframe,
      category_index,
      year_index,
      month_col_index,
      week_number,
      daily_date_key,
      is_deleted
    )
);

-- Indexes for Performance
CREATE INDEX idx_strategic_map_org_timeframe
  ON strategic_map_items(organization_id, timeframe)
  WHERE is_deleted = FALSE;

CREATE INDEX idx_strategic_map_org_year
  ON strategic_map_items(organization_id, year_index)
  WHERE timeframe = 'yearly' AND is_deleted = FALSE;

CREATE INDEX idx_strategic_map_org_month
  ON strategic_map_items(organization_id, month_col_index)
  WHERE timeframe = 'monthly' AND is_deleted = FALSE;

CREATE INDEX idx_strategic_map_org_week
  ON strategic_map_items(organization_id, week_number)
  WHERE timeframe = 'weekly' AND is_deleted = FALSE;

CREATE INDEX idx_strategic_map_org_daily
  ON strategic_map_items(organization_id, daily_date_key)
  WHERE timeframe = 'daily' AND is_deleted = FALSE;

CREATE INDEX idx_strategic_map_parent
  ON strategic_map_items(parent_item_id)
  WHERE parent_item_id IS NOT NULL AND is_deleted = FALSE;

CREATE INDEX idx_strategic_map_created_by
  ON strategic_map_items(created_by_individual_id);

-- Comment on table
COMMENT ON TABLE strategic_map_items IS 'Strategic Map goal items with hierarchical cascading from yearly to daily';

--=============================================
-- AUDIT LOG TABLE (Optional but Recommended)
--=============================================

CREATE TABLE strategic_map_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id UUID REFERENCES strategic_map_items(id) ON DELETE SET NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'status_change')),
  actor_individual_id UUID NOT NULL REFERENCES individuals(id) ON DELETE SET NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_strategic_map_audit_org_item
  ON strategic_map_audit_log(organization_id, item_id);

CREATE INDEX idx_strategic_map_audit_created_at
  ON strategic_map_audit_log(created_at DESC);

COMMENT ON TABLE strategic_map_audit_log IS 'Audit trail for Strategic Map changes';

--=============================================
-- CASCADE TRIGGER FUNCTIONS
--=============================================

-- Function: Create cascaded items when parent is created/updated
CREATE OR REPLACE FUNCTION create_cascaded_items()
RETURNS TRIGGER AS $$
DECLARE
  v_target_timeframe VARCHAR(20);
  v_target_category_index INTEGER;
  v_target_year_index INTEGER;
  v_target_month_col_index INTEGER;
  v_target_week_number INTEGER;
  v_target_daily_date_key INTEGER;
  v_current_year INTEGER;
  v_year INTEGER;
BEGIN
  -- Only cascade original items (not already cascaded)
  IF NEW.is_cascaded = TRUE THEN
    RETURN NEW;
  END IF;

  -- Determine cascade target based on timeframe
  CASE NEW.timeframe
    -- Yearly → Monthly (December)
    WHEN 'yearly' THEN
      v_target_timeframe := 'monthly';
      v_target_category_index := NEW.category_index;

      -- Calculate year from year_index
      -- Assuming current year + year_index
      v_current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
      v_year := v_current_year + NEW.year_index;

      -- December column index: year * 12 + 11 (December is month 11, 0-indexed)
      v_target_month_col_index := v_year * 12 + 11;

      -- Insert or update cascaded item in December
      INSERT INTO strategic_map_items (
        organization_id,
        created_by_individual_id,
        text,
        status,
        timeframe,
        category_index,
        month_col_index,
        parent_item_id,
        is_cascaded,
        cascade_level
      ) VALUES (
        NEW.organization_id,
        NEW.created_by_individual_id,
        NEW.text,
        NEW.status,
        v_target_timeframe,
        v_target_category_index,
        v_target_month_col_index,
        NEW.id,
        TRUE,
        NEW.cascade_level + 1
      )
      ON CONFLICT (organization_id, timeframe, category_index, year_index, month_col_index, week_number, daily_date_key, is_deleted)
      DO UPDATE SET
        text = EXCLUDED.text,
        status = EXCLUDED.status,
        updated_at = NOW(),
        updated_by_individual_id = EXCLUDED.created_by_individual_id;

    -- Monthly → Weekly (Last week of month)
    -- Note: This is complex and requires date calculations
    -- For now, we'll skip this and implement in application logic
    WHEN 'monthly' THEN
      -- TODO: Implement when we have date calculation logic
      -- Challenge: Determining last ISO week that overlaps with given month
      NULL;

    -- Weekly → Daily (Sunday)
    -- Note: Requires ISO week to date conversion
    WHEN 'weekly' THEN
      -- TODO: Implement when we have ISO week to date conversion
      -- Challenge: Finding Sunday of given ISO week
      NULL;

    ELSE
      -- Daily items don't cascade further
      NULL;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Create cascaded items after insert/update
CREATE TRIGGER trigger_create_cascaded_items
AFTER INSERT OR UPDATE ON strategic_map_items
FOR EACH ROW
WHEN (NEW.is_deleted = FALSE)
EXECUTE FUNCTION create_cascaded_items();

-- Function: Update cascaded items when parent is updated
CREATE OR REPLACE FUNCTION update_cascaded_items()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process original items (not cascaded)
  IF NEW.is_cascaded = TRUE THEN
    RETURN NEW;
  END IF;

  -- Update all direct children (cascaded items)
  UPDATE strategic_map_items
  SET
    text = NEW.text,
    status = NEW.status,
    updated_at = NOW(),
    updated_by_individual_id = NEW.updated_by_individual_id
  WHERE parent_item_id = NEW.id
    AND is_deleted = FALSE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update cascaded items when parent is updated
CREATE TRIGGER trigger_update_cascaded_items
AFTER UPDATE ON strategic_map_items
FOR EACH ROW
WHEN (NEW.is_deleted = FALSE AND OLD.is_deleted = FALSE)
EXECUTE FUNCTION update_cascaded_items();

-- Function: Soft delete cascaded items when parent is deleted
CREATE OR REPLACE FUNCTION delete_cascaded_items()
RETURNS TRIGGER AS $$
BEGIN
  -- Soft delete all child cascaded items recursively
  UPDATE strategic_map_items
  SET
    is_deleted = TRUE,
    deleted_at = NOW(),
    deleted_by_individual_id = NEW.deleted_by_individual_id
  WHERE parent_item_id = OLD.id
    AND is_deleted = FALSE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Delete cascaded items when parent is deleted
CREATE TRIGGER trigger_delete_cascaded_items
AFTER UPDATE ON strategic_map_items
FOR EACH ROW
WHEN (NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE)
EXECUTE FUNCTION delete_cascaded_items();

--=============================================
-- RPC FUNCTIONS
--=============================================

-- Function: Get all strategic map items for an organization
CREATE OR REPLACE FUNCTION get_strategic_map_items(
  p_organization_id UUID,
  p_timeframe VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  text TEXT,
  status VARCHAR(20),
  timeframe VARCHAR(20),
  category_index INTEGER,
  year_index INTEGER,
  month_col_index INTEGER,
  week_number INTEGER,
  daily_date_key INTEGER,
  parent_item_id UUID,
  is_cascaded BOOLEAN,
  cascade_level INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by_individual_id UUID,
  updated_by_individual_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    smi.id,
    smi.text,
    smi.status,
    smi.timeframe,
    smi.category_index,
    smi.year_index,
    smi.month_col_index,
    smi.week_number,
    smi.daily_date_key,
    smi.parent_item_id,
    smi.is_cascaded,
    smi.cascade_level,
    smi.created_at,
    smi.updated_at,
    smi.created_by_individual_id,
    smi.updated_by_individual_id
  FROM strategic_map_items smi
  WHERE smi.organization_id = p_organization_id
    AND smi.is_deleted = FALSE
    AND (p_timeframe IS NULL OR smi.timeframe = p_timeframe)
  ORDER BY
    smi.timeframe,
    smi.category_index,
    COALESCE(smi.year_index, 0),
    COALESCE(smi.month_col_index, 0),
    COALESCE(smi.week_number, 0),
    COALESCE(smi.daily_date_key, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Batch upsert strategic map items
CREATE OR REPLACE FUNCTION upsert_strategic_map_items(
  p_organization_id UUID,
  p_individual_id UUID,
  p_items JSONB
)
RETURNS TABLE (
  id UUID,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_item JSONB;
  v_new_id UUID;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      INSERT INTO strategic_map_items (
        organization_id,
        created_by_individual_id,
        text,
        status,
        timeframe,
        category_index,
        year_index,
        month_col_index,
        week_number,
        daily_date_key
      ) VALUES (
        p_organization_id,
        p_individual_id,
        v_item->>'text',
        COALESCE(v_item->>'status', 'neutral'),
        v_item->>'timeframe',
        (v_item->>'category_index')::INTEGER,
        (v_item->>'year_index')::INTEGER,
        (v_item->>'month_col_index')::INTEGER,
        (v_item->>'week_number')::INTEGER,
        (v_item->>'daily_date_key')::INTEGER
      )
      ON CONFLICT (organization_id, timeframe, category_index, year_index, month_col_index, week_number, daily_date_key, is_deleted)
      DO UPDATE SET
        text = EXCLUDED.text,
        status = EXCLUDED.status,
        updated_at = NOW(),
        updated_by_individual_id = p_individual_id
      RETURNING strategic_map_items.id INTO v_new_id;

      RETURN QUERY SELECT v_new_id, TRUE, NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT NULL::UUID, FALSE, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--=============================================
-- ROW LEVEL SECURITY (RLS)
--=============================================

-- Enable RLS
ALTER TABLE strategic_map_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_map_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see items from their organization
CREATE POLICY strategic_map_items_select_policy ON strategic_map_items
  FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.individual_id = auth.uid()
    )
  );

-- Policy: Users can insert items to their organization
CREATE POLICY strategic_map_items_insert_policy ON strategic_map_items
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.individual_id = auth.uid()
    )
  );

-- Policy: Users can update items in their organization
CREATE POLICY strategic_map_items_update_policy ON strategic_map_items
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.individual_id = auth.uid()
    )
  );

-- Policy: Users can delete items in their organization
CREATE POLICY strategic_map_items_delete_policy ON strategic_map_items
  FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.individual_id = auth.uid()
    )
  );

-- Audit log policies (read-only for users, write handled by triggers)
CREATE POLICY strategic_map_audit_select_policy ON strategic_map_audit_log
  FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.individual_id = auth.uid()
    )
  );

--=============================================
-- GRANTS
--=============================================

-- Grant execute on RPC functions to authenticated users
GRANT EXECUTE ON FUNCTION get_strategic_map_items(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_strategic_map_items(UUID, UUID, JSONB) TO authenticated;

--=============================================
-- MIGRATION COMPLETE
--=============================================

COMMENT ON TABLE strategic_map_items IS 'Strategic Map v2 - Hierarchical goal tracking with auto-cascading (Yearly → Monthly → Weekly → Daily)';
