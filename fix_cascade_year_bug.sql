-- Fix: Cascade year calculation bug
-- Problem: Weekly → Daily cascade uses NOW() instead of the actual week's year
-- This causes Week 1 (which belongs to 2026) to cascade to 2025

DROP TRIGGER IF EXISTS trigger_create_cascaded_items ON strategic_map_items;
DROP FUNCTION IF EXISTS create_cascaded_items();

CREATE OR REPLACE FUNCTION create_cascaded_items()
RETURNS TRIGGER AS $$
DECLARE
  v_target_timeframe VARCHAR(20);
  v_target_category_index INTEGER;
  v_target_month_col_index INTEGER;
  v_target_week_number INTEGER;
  v_target_daily_date_key INTEGER;
  v_current_year INTEGER;
  v_year INTEGER;
  v_month INTEGER;
  v_year_index INTEGER;
  v_sunday_date DATE;
  v_week_year INTEGER;
BEGIN
  -- Prevent cascading beyond daily (daily is the end of the chain)
  IF NEW.timeframe = 'daily' THEN
    RETURN NEW;
  END IF;

  -- Determine cascade target based on timeframe
  CASE NEW.timeframe
    -- ========================================================================
    -- Yearly → Monthly (December)
    -- ========================================================================
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

      RAISE NOTICE '[CASCADE] Yearly → Monthly: year_index=%, year=%, month_col_index=%',
        v_year_index, v_year, v_target_month_col_index;

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

    -- ========================================================================
    -- Monthly → Weekly (Last week of month)
    -- ========================================================================
    WHEN 'monthly' THEN
      -- Ensure month_col_index is not NULL
      IF NEW.month_col_index IS NULL THEN
        RAISE NOTICE '[CASCADE] Monthly → Weekly: Skipped (month_col_index is NULL)';
        RETURN NEW;
      END IF;

      v_target_timeframe := 'weekly';
      v_target_category_index := NEW.category_index;

      -- Calculate year and month from month_col_index
      -- month_col_index = year * 12 + month (0-indexed, so January = 0, December = 11)
      v_year := NEW.month_col_index / 12;
      v_month := (NEW.month_col_index % 12) + 1; -- Convert to 1-indexed (1-12)

      -- Get the last ISO week that overlaps with this month
      v_target_week_number := get_last_week_of_month(v_year, v_month);

      RAISE NOTICE '[CASCADE] Monthly → Weekly: month_col_index=%, year=%, month=%, target_week=%',
        NEW.month_col_index, v_year, v_month, v_target_week_number;

      -- Insert or update cascaded item in last week of month
      INSERT INTO strategic_map_items (
        organization_id,
        created_by_individual_id,
        text,
        status,
        timeframe,
        category_index,
        week_number,
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
        v_target_week_number,
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

    -- ========================================================================
    -- Weekly → Daily (Sunday)
    -- FIXED: Determine year from parent monthly item's month_col_index
    -- ========================================================================
    WHEN 'weekly' THEN
      -- Ensure week_number is not NULL
      IF NEW.week_number IS NULL THEN
        RAISE NOTICE '[CASCADE] Weekly → Daily: Skipped (week_number is NULL)';
        RETURN NEW;
      END IF;

      v_target_timeframe := 'daily';
      v_target_category_index := NEW.category_index;

      -- Get the year from parent monthly item
      -- This is more reliable than guessing based on NOW()
      SELECT month_col_index INTO v_target_month_col_index
      FROM strategic_map_items
      WHERE id = NEW.parent_item_id;

      IF v_target_month_col_index IS NOT NULL THEN
        -- Calculate year from parent's month_col_index
        v_week_year := v_target_month_col_index / 12;
        RAISE NOTICE '[CASCADE] Weekly → Daily: Using parent month year: %', v_week_year;
      ELSE
        -- Fallback: use current year (shouldn't happen if cascade is working)
        v_week_year := EXTRACT(YEAR FROM NOW())::INTEGER;
        RAISE NOTICE '[CASCADE] Weekly → Daily: No parent found, using current year: %', v_week_year;
      END IF;

      -- Get Sunday of this ISO week in the calculated year
      v_sunday_date := get_sunday_of_iso_week(v_week_year, NEW.week_number);

      -- If Week 1 and we got a date in the previous year, it actually belongs to next year
      IF NEW.week_number = 1 AND EXTRACT(MONTH FROM v_sunday_date) = 12 THEN
        RAISE NOTICE '[CASCADE] Week 1 Sunday is in December, trying next year';
        v_sunday_date := get_sunday_of_iso_week(v_week_year + 1, NEW.week_number);
      END IF;

      -- Convert Sunday date to daily_date_key (YYYYMMDD)
      v_target_daily_date_key := date_to_date_key(v_sunday_date);

      RAISE NOTICE '[CASCADE] Weekly → Daily: week_number=%, week_year=%, sunday_date=%, daily_date_key=%',
        NEW.week_number, v_week_year, v_sunday_date, v_target_daily_date_key;

      -- Insert or update cascaded item on Sunday
      INSERT INTO strategic_map_items (
        organization_id,
        created_by_individual_id,
        text,
        status,
        timeframe,
        category_index,
        daily_date_key,
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
        v_target_daily_date_key,
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

    ELSE
      NULL; -- No cascade for other timeframes
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER trigger_create_cascaded_items
AFTER INSERT OR UPDATE ON strategic_map_items
FOR EACH ROW
WHEN (NEW.is_deleted = FALSE)
EXECUTE FUNCTION create_cascaded_items();

-- Now fix the existing weekly items to re-trigger cascade with correct year
UPDATE strategic_map_items
SET updated_at = NOW()
WHERE timeframe = 'weekly'
  AND text LIKE '%Test%'
  AND is_deleted = FALSE;

-- Check results
SELECT
  timeframe,
  category_index,
  week_number,
  daily_date_key,
  is_cascaded,
  cascade_level,
  LEFT(text, 40) as text_preview
FROM strategic_map_items
WHERE text LIKE '%Test%'
  AND is_deleted = FALSE
ORDER BY cascade_level, timeframe;
