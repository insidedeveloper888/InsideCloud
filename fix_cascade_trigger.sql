-- Fix: Cascade trigger issue
-- The problem: Cascaded items (monthly) aren't triggering further cascades (weekly → daily)
-- Root cause: The trigger has `WHEN (NEW.is_deleted = FALSE)` but also checks `IF NEW.is_cascaded = TRUE`
-- This means cascaded items exit early and don't cascade further!

-- Solution: Remove the early exit for cascaded items, but prevent infinite loops differently

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
    -- ========================================================================
    WHEN 'weekly' THEN
      -- Ensure week_number is not NULL
      IF NEW.week_number IS NULL THEN
        RAISE NOTICE '[CASCADE] Weekly → Daily: Skipped (week_number is NULL)';
        RETURN NEW;
      END IF;

      v_target_timeframe := 'daily';
      v_target_category_index := NEW.category_index;

      -- Determine which year this week belongs to
      v_current_year := EXTRACT(YEAR FROM NOW())::INTEGER;

      -- For simplicity, try current year first, then adjust
      -- Week 1 in December likely belongs to next year
      -- Week 52-53 in January likely belongs to previous year
      IF NEW.week_number <= 2 AND EXTRACT(MONTH FROM NOW()) = 12 THEN
        -- Late December, low week number = next year
        v_sunday_date := get_sunday_of_iso_week(v_current_year + 1, NEW.week_number);
      ELSIF NEW.week_number >= 52 AND EXTRACT(MONTH FROM NOW()) <= 2 THEN
        -- Early year, high week number = previous year
        v_sunday_date := get_sunday_of_iso_week(v_current_year - 1, NEW.week_number);
      ELSE
        -- Normal case
        v_sunday_date := get_sunday_of_iso_week(v_current_year, NEW.week_number);
      END IF;

      -- Convert Sunday date to daily_date_key (YYYYMMDD)
      v_target_daily_date_key := date_to_date_key(v_sunday_date);

      RAISE NOTICE '[CASCADE] Weekly → Daily: week_number=%, sunday_date=%, daily_date_key=%',
        NEW.week_number, v_sunday_date, v_target_daily_date_key;

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
-- REMOVED the early exit check for is_cascaded!
CREATE TRIGGER trigger_create_cascaded_items
AFTER INSERT OR UPDATE ON strategic_map_items
FOR EACH ROW
WHEN (NEW.is_deleted = FALSE)
EXECUTE FUNCTION create_cascaded_items();

-- Now test: Update the existing monthly item to trigger cascade
UPDATE strategic_map_items
SET updated_at = NOW()
WHERE timeframe = 'monthly'
  AND text LIKE '%Cascade Test Goal%'
  AND is_deleted = FALSE;

-- Check results
SELECT
  timeframe,
  category_index,
  year_index,
  month_col_index,
  week_number,
  daily_date_key,
  is_cascaded,
  cascade_level,
  LEFT(text, 40) as text_preview
FROM strategic_map_items
WHERE text LIKE '%Cascade Test Goal%'
  AND is_deleted = FALSE
ORDER BY cascade_level;

-- Expected output:
-- yearly, cascade_level = 0
-- monthly, cascade_level = 1
-- weekly, cascade_level = 2 (NEW!)
-- daily, cascade_level = 3 (NEW!)
