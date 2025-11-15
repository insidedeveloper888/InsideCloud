-- Fix: Update get_strategic_map_items RPC function to remove name columns
-- Run this to fix the "column i_created.name does not exist" error

DROP FUNCTION IF EXISTS get_strategic_map_items(UUID, VARCHAR);

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

GRANT EXECUTE ON FUNCTION get_strategic_map_items(UUID, VARCHAR) TO authenticated;
