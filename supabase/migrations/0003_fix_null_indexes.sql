-- Fix: Handle NULL index values and ensure proper cascade behavior
-- This addresses the issue where colIndex comes back as null

-- First, let's check if there's data with NULL indexes for yearly items
-- and fix the cascade trigger to handle NULL year_index

-- Drop and recreate the cascade trigger with better NULL handling
DROP TRIGGER IF EXISTS trigger_create_cascaded_items ON strategic_map_items;
DROP FUNCTION IF EXISTS create_cascaded_items();

CREATE OR REPLACE FUNCTION create_cascaded_items()
RETURNS TRIGGER AS $$
DECLARE
  v_target_timeframe VARCHAR(20);
  v_target_category_index INTEGER;
  v_target_month_col_index INTEGER;
  v_current_year INTEGER;
  v_year INTEGER;
  v_year_index INTEGER;
BEGIN
  -- Only cascade original items (not already cascaded)
  IF NEW.is_cascaded = TRUE THEN
    RETURN NEW;
  END IF;

  -- Determine cascade target based on timeframe
  CASE NEW.timeframe
    -- Yearly → Monthly (December)
    WHEN 'yearly' THEN
      -- Ensure year_index is not NULL (use 0 as default)
      v_year_index := COALESCE(NEW.year_index, 0);

      v_target_timeframe := 'monthly';
      v_target_category_index := NEW.category_index;

      -- Calculate year from year_index
      v_current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
      v_year := v_current_year + v_year_index;

      -- December column index: year * 12 + 11 (December is month 11, 0-indexed)
      v_target_month_col_index := v_year * 12 + 11;

      RAISE NOTICE 'Creating cascade: year_index=%, month_col_index=%', v_year_index, v_target_month_col_index;

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
    WHEN 'monthly' THEN
      NULL; -- TODO: Implement

    -- Weekly → Daily (Sunday)
    WHEN 'weekly' THEN
      NULL; -- TODO: Implement

    ELSE
      NULL; -- Daily items don't cascade
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_cascaded_items
AFTER INSERT OR UPDATE ON strategic_map_items
FOR EACH ROW
WHEN (NEW.is_deleted = FALSE)
EXECUTE FUNCTION create_cascaded_items();

-- Now update existing records to ensure they have proper non-NULL indexes
-- Update yearly items to have year_index = 0 if NULL
UPDATE strategic_map_items
SET year_index = 0
WHERE timeframe = 'yearly'
  AND year_index IS NULL
  AND is_deleted = FALSE;

-- Update monthly items to recalculate month_col_index if NULL
UPDATE strategic_map_items
SET month_col_index = EXTRACT(YEAR FROM NOW())::INTEGER * 12 + 11
WHERE timeframe = 'monthly'
  AND month_col_index IS NULL
  AND is_deleted = FALSE
  AND is_cascaded = TRUE;

-- Verify the fix
SELECT
  id,
  text,
  timeframe,
  category_index,
  year_index,
  month_col_index,
  is_cascaded
FROM strategic_map_items
WHERE is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 10;
