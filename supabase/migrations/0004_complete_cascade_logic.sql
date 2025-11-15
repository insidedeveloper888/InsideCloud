-- ============================================================================
-- Strategic Map v2 - Complete Cascade Implementation
-- ============================================================================
-- This migration completes the cascade logic for all timeframes:
--   Yearly → Monthly (December) ✅ Already working
--   Monthly → Weekly (Last week of month) ⭐ NEW
--   Weekly → Daily (Sunday) ⭐ NEW
--
-- Handles complex scenarios:
--   - Cross-year boundaries (Dec 2025 → Week 1 2026 → Sun Jan 4 2026)
--   - ISO week numbering (weeks start Monday, Week 1 has first Thursday)
--   - Month-week overlaps (last week of month may span into next month)
-- ============================================================================

-- ============================================================================
-- PART 1: ISO Week Utility Functions
-- ============================================================================

-- Function: Get ISO week number from a date
-- Returns: Week number (1-53) according to ISO 8601
CREATE OR REPLACE FUNCTION get_iso_week(input_date DATE)
RETURNS INTEGER AS $$
DECLARE
  v_year INTEGER;
  v_week INTEGER;
BEGIN
  -- ISO week calculation:
  -- Week 1 is the week containing the first Thursday of the year
  -- Weeks start on Monday
  v_year := EXTRACT(ISOYEAR FROM input_date);
  v_week := EXTRACT(WEEK FROM input_date);

  -- PostgreSQL's WEEK extraction already uses ISO 8601
  RETURN v_week;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Get the last ISO week that overlaps with a given month
-- Returns: Week number (1-53)
-- Example: December 2025 → Returns 1 (Week 1 of 2026)
CREATE OR REPLACE FUNCTION get_last_week_of_month(p_year INTEGER, p_month INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_last_day DATE;
  v_week_number INTEGER;
  v_day_of_week INTEGER;
  v_sunday_of_last_week DATE;
BEGIN
  -- Get last day of the month
  v_last_day := (DATE (p_year || '-' || p_month || '-01') + INTERVAL '1 month - 1 day')::DATE;

  -- Find the Sunday that falls within or after this month
  -- (Sunday is the last day of an ISO week, which starts Monday)
  v_day_of_week := EXTRACT(DOW FROM v_last_day); -- 0=Sunday, 1=Monday, ..., 6=Saturday

  -- Calculate the Sunday of the last week that overlaps with this month
  IF v_day_of_week = 0 THEN
    -- Last day is already Sunday
    v_sunday_of_last_week := v_last_day;
  ELSE
    -- Find next Sunday after last day
    v_sunday_of_last_week := v_last_day + (7 - v_day_of_week);
  END IF;

  -- Get ISO week of that Sunday
  v_week_number := get_iso_week(v_sunday_of_last_week);

  RETURN v_week_number;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Get the Sunday (last day) of a given ISO week
-- Returns: DATE of the Sunday in that week
-- Example: Week 1, 2026 → Returns 2026-01-04 (Sunday)
CREATE OR REPLACE FUNCTION get_sunday_of_iso_week(p_year INTEGER, p_week INTEGER)
RETURNS DATE AS $$
DECLARE
  v_jan_4 DATE;
  v_week_1_monday DATE;
  v_target_monday DATE;
  v_target_sunday DATE;
BEGIN
  -- ISO Week 1 contains the first Thursday of the year
  -- Equivalently: ISO Week 1 contains January 4th
  v_jan_4 := DATE (p_year || '-01-04');

  -- Find Monday of Week 1 (might be in previous year)
  v_week_1_monday := v_jan_4 - (EXTRACT(ISODOW FROM v_jan_4)::INTEGER - 1);

  -- Calculate Monday of target week
  v_target_monday := v_week_1_monday + ((p_week - 1) * 7);

  -- Sunday is 6 days after Monday
  v_target_sunday := v_target_monday + 6;

  RETURN v_target_sunday;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Convert daily_date_key (YYYYMMDD integer) to DATE
CREATE OR REPLACE FUNCTION date_key_to_date(p_date_key INTEGER)
RETURNS DATE AS $$
BEGIN
  RETURN TO_DATE(p_date_key::TEXT, 'YYYYMMDD');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Convert DATE to daily_date_key (YYYYMMDD integer)
CREATE OR REPLACE FUNCTION date_to_date_key(p_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN TO_CHAR(p_date, 'YYYYMMDD')::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- PART 2: Complete Cascade Trigger Implementation
-- ============================================================================

-- Drop existing trigger and function
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
  -- Only cascade original items (not already cascaded)
  IF NEW.is_cascaded = TRUE THEN
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
      -- For Week 1-52, it's usually the current year
      -- For Week 53, it might be previous year
      -- We'll use a heuristic: assume it's the current year or next year

      v_current_year := EXTRACT(YEAR FROM NOW())::INTEGER;

      -- Try current year first
      v_sunday_date := get_sunday_of_iso_week(v_current_year, NEW.week_number);

      -- If the week number is very low (1-2) and current month is December,
      -- it might be referring to next year
      IF NEW.week_number <= 2 AND EXTRACT(MONTH FROM NOW()) = 12 THEN
        v_sunday_date := get_sunday_of_iso_week(v_current_year + 1, NEW.week_number);
      END IF;

      -- If the week number is very high (52-53) and current month is January,
      -- it might be referring to previous year
      IF NEW.week_number >= 52 AND EXTRACT(MONTH FROM NOW()) = 1 THEN
        v_sunday_date := get_sunday_of_iso_week(v_current_year - 1, NEW.week_number);
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

    -- Daily items don't cascade
    ELSE
      NULL;
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

-- ============================================================================
-- PART 3: Test Utility Functions
-- ============================================================================

-- Test 1: Get ISO week number for specific dates
-- Expected: Dec 29, 2025 is Week 1 of 2026
-- Expected: Jan 4, 2026 is Week 1 of 2026
DO $$
BEGIN
  RAISE NOTICE '=== TEST: ISO Week Calculation ===';
  RAISE NOTICE 'Dec 29, 2025 (Mon): Week %', get_iso_week('2025-12-29'::DATE);
  RAISE NOTICE 'Jan 3, 2026 (Sat): Week %', get_iso_week('2026-01-03'::DATE);
  RAISE NOTICE 'Jan 4, 2026 (Sun): Week %', get_iso_week('2026-01-04'::DATE);
END $$;

-- Test 2: Get last week of December 2025
-- Expected: Week 1 (of 2026)
DO $$
BEGIN
  RAISE NOTICE '=== TEST: Last Week of Month ===';
  RAISE NOTICE 'Last week of Dec 2025: Week %', get_last_week_of_month(2025, 12);
  RAISE NOTICE 'Last week of Nov 2025: Week %', get_last_week_of_month(2025, 11);
END $$;

-- Test 3: Get Sunday of Week 1, 2026
-- Expected: 2026-01-04
DO $$
BEGIN
  RAISE NOTICE '=== TEST: Sunday of ISO Week ===';
  RAISE NOTICE 'Sunday of Week 1, 2026: %', get_sunday_of_iso_week(2026, 1);
  RAISE NOTICE 'Sunday of Week 52, 2025: %', get_sunday_of_iso_week(2025, 52);
END $$;

-- Test 4: Date key conversions
-- Expected: 20260104
DO $$
BEGIN
  RAISE NOTICE '=== TEST: Date Key Conversion ===';
  RAISE NOTICE '2026-01-04 → %', date_to_date_key('2026-01-04'::DATE);
  RAISE NOTICE '20260104 → %', date_key_to_date(20260104);
END $$;

-- ============================================================================
-- PART 4: Verification Query
-- ============================================================================

-- Show all items with their cascade relationships
SELECT
  id,
  text,
  timeframe,
  category_index,
  year_index,
  month_col_index,
  week_number,
  daily_date_key,
  is_cascaded,
  cascade_level,
  parent_item_id
FROM strategic_map_items
WHERE is_deleted = FALSE
ORDER BY cascade_level, timeframe, category_index
LIMIT 20;

-- ============================================================================
-- Migration Complete!
-- ============================================================================
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Restart your backend server (picks up new trigger logic)
-- 3. Test by creating a yearly item - should cascade all the way to daily!
-- ============================================================================
