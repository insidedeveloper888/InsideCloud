-- ========================================================================
-- COMPLETE CASCADE INSTALLATION SCRIPT
-- Run this entire file in Supabase SQL Editor to fix cascading
-- ========================================================================

-- ========================================================================
-- STEP 1: Create Helper Functions
-- ========================================================================

-- 1.1 get_last_week_of_month(year, month)
-- Returns the ISO week number of the last week that overlaps with the given month
CREATE OR REPLACE FUNCTION public.get_last_week_of_month(p_year INTEGER, p_month INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_last_day_of_month DATE;
  v_iso_week INTEGER;
BEGIN
  -- Get the last day of the month
  v_last_day_of_month := (DATE (p_year || '-' || p_month || '-01') + INTERVAL '1 month - 1 day')::DATE;

  -- Get ISO week number of the last day
  v_iso_week := EXTRACT(WEEK FROM v_last_day_of_month)::INTEGER;

  -- Handle edge case: If last day is in Week 1 of next year, use Week 52/53 instead
  IF p_month = 12 AND v_iso_week = 1 THEN
    -- Get the ISO week of Dec 25 instead (always in the last week of the year)
    v_iso_week := EXTRACT(WEEK FROM (p_year || '-12-25')::DATE)::INTEGER;
  END IF;

  RETURN v_iso_week;
END;
$$;

-- 1.2 get_sunday_of_iso_week(year, week_number)
-- Returns the Sunday date of a given ISO week
CREATE OR REPLACE FUNCTION public.get_sunday_of_iso_week(p_year INTEGER, p_week_number INTEGER)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_jan_4th DATE;
  v_monday_of_week DATE;
  v_sunday_of_week DATE;
BEGIN
  -- ISO weeks: Week 1 is the week with Jan 4th
  -- ISO weeks start on Monday

  -- Get Jan 4th of the year
  v_jan_4th := (p_year || '-01-04')::DATE;

  -- Find the Monday of week 1 (may be in previous year)
  v_monday_of_week := v_jan_4th - (EXTRACT(ISODOW FROM v_jan_4th)::INTEGER - 1);

  -- Add (week_number - 1) weeks to get Monday of target week
  v_monday_of_week := v_monday_of_week + (p_week_number - 1) * INTERVAL '7 days';

  -- Sunday is 6 days after Monday
  v_sunday_of_week := v_monday_of_week + INTERVAL '6 days';

  RETURN v_sunday_of_week;
END;
$$;

-- 1.3 date_to_date_key(date)
-- Converts a DATE to YYYYMMDD integer format
CREATE OR REPLACE FUNCTION public.date_to_date_key(p_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN (
    EXTRACT(YEAR FROM p_date)::INTEGER * 10000 +
    EXTRACT(MONTH FROM p_date)::INTEGER * 100 +
    EXTRACT(DAY FROM p_date)::INTEGER
  );
END;
$$;

-- ========================================================================
-- STEP 2: Create Cascade Trigger Function
-- ========================================================================

CREATE OR REPLACE FUNCTION public.create_cascaded_items()
RETURNS trigger
LANGUAGE plpgsql
AS $$
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
  -- Only cascade original items (not already cascaded items)
  IF NEW.is_cascaded = TRUE THEN
    RETURN NEW;
  END IF;

  -- Prevent cascading beyond daily
  IF NEW.timeframe = 'daily' THEN
    RETURN NEW;
  END IF;

  -- Determine cascade target based on timeframe
  CASE NEW.timeframe
    -- ========================================================================
    -- Yearly → Monthly (December)
    -- ========================================================================
    WHEN 'yearly' THEN
      v_year_index := COALESCE(NEW.year_index, 0);
      v_target_timeframe := 'monthly';
      v_target_category_index := NEW.category_index;

      -- Calculate year from year_index
      v_current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
      v_year := v_current_year + v_year_index;

      -- December column index: year * 12 + 11
      v_target_month_col_index := v_year * 12 + 11;

      RAISE NOTICE '[CASCADE] Yearly → Monthly: year_index=%, year=%, month_col_index=%',
        v_year_index, v_year, v_target_month_col_index;

      -- Insert cascaded item in December
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
      );

    -- ========================================================================
    -- Monthly → Weekly (Last week of month)
    -- ========================================================================
    WHEN 'monthly' THEN
      IF NEW.month_col_index IS NULL THEN
        RAISE NOTICE '[CASCADE] Monthly → Weekly: Skipped (month_col_index is NULL)';
        RETURN NEW;
      END IF;

      v_target_timeframe := 'weekly';
      v_target_category_index := NEW.category_index;

      -- Calculate year and month from month_col_index
      v_year := NEW.month_col_index / 12;
      v_month := (NEW.month_col_index % 12) + 1;

      -- Get the last ISO week that overlaps with this month
      v_target_week_number := get_last_week_of_month(v_year, v_month);

      RAISE NOTICE '[CASCADE] Monthly → Weekly: month_col_index=%, year=%, month=%, target_week=%',
        NEW.month_col_index, v_year, v_month, v_target_week_number;

      -- Insert cascaded item in last week of month
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
      );

    -- ========================================================================
    -- Weekly → Daily (Sunday)
    -- ========================================================================
    WHEN 'weekly' THEN
      IF NEW.week_number IS NULL THEN
        RAISE NOTICE '[CASCADE] Weekly → Daily: Skipped (week_number is NULL)';
        RETURN NEW;
      END IF;

      v_target_timeframe := 'daily';
      v_target_category_index := NEW.category_index;

      -- Get the year from parent monthly item
      SELECT month_col_index INTO v_target_month_col_index
      FROM strategic_map_items
      WHERE id = NEW.parent_item_id;

      IF v_target_month_col_index IS NOT NULL THEN
        v_week_year := v_target_month_col_index / 12;
        RAISE NOTICE '[CASCADE] Weekly → Daily: Using parent month year: %', v_week_year;
      ELSE
        v_week_year := EXTRACT(YEAR FROM NOW())::INTEGER;
        RAISE NOTICE '[CASCADE] Weekly → Daily: No parent found, using current year: %', v_week_year;
      END IF;

      -- Get Sunday of this ISO week
      v_sunday_date := get_sunday_of_iso_week(v_week_year, NEW.week_number);

      -- If Week 1 and Sunday is in December, try next year
      IF NEW.week_number = 1 AND EXTRACT(MONTH FROM v_sunday_date) = 12 THEN
        RAISE NOTICE '[CASCADE] Week 1 Sunday is in December, trying next year';
        v_sunday_date := get_sunday_of_iso_week(v_week_year + 1, NEW.week_number);
      END IF;

      -- Convert Sunday date to daily_date_key (YYYYMMDD)
      v_target_daily_date_key := date_to_date_key(v_sunday_date);

      RAISE NOTICE '[CASCADE] Weekly → Daily: week_number=%, week_year=%, sunday_date=%, daily_date_key=%',
        NEW.week_number, v_week_year, v_sunday_date, v_target_daily_date_key;

      -- Insert cascaded item on Sunday
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
      );

    ELSE
      NULL;
  END CASE;

  RETURN NEW;
END;
$$;

-- ========================================================================
-- STEP 3: Attach Trigger to Table
-- ========================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_cascaded_items ON strategic_map_items;

-- Create the trigger
CREATE TRIGGER trigger_create_cascaded_items
  AFTER INSERT ON strategic_map_items
  FOR EACH ROW
  EXECUTE FUNCTION create_cascaded_items();

-- ========================================================================
-- STEP 4: Verification
-- ========================================================================

-- Verify all functions were created
SELECT
  'Functions installed: ' || COUNT(*) AS status
FROM pg_proc
WHERE proname IN (
  'create_cascaded_items',
  'get_last_week_of_month',
  'get_sunday_of_iso_week',
  'date_to_date_key'
);

-- Verify trigger was created
SELECT
  tgname AS trigger_name,
  CASE tgenabled
    WHEN 'O' THEN 'ENABLED'
    ELSE 'DISABLED'
  END AS status
FROM pg_trigger
WHERE tgrelid = 'strategic_map_items'::regclass
  AND tgname = 'trigger_create_cascaded_items';

-- Test the helper functions
SELECT 'Helper function tests:' AS test_section;

SELECT
  'Last week of December 2025' AS test,
  get_last_week_of_month(2025, 12) AS result;

SELECT
  'Sunday of week 52, 2025' AS test,
  get_sunday_of_iso_week(2025, 52) AS result;

SELECT
  'Date key for 2025-12-28' AS test,
  date_to_date_key('2025-12-28'::DATE) AS result;

SELECT '✅ Installation complete! Try creating a new yearly goal to test cascading.' AS final_status;
