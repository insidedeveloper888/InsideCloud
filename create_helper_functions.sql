-- Helper functions required by cascade trigger
-- These must be created BEFORE the cascade trigger

-- ========================================================================
-- 1. get_last_week_of_month(year, month)
-- Returns the ISO week number of the last week that overlaps with the given month
-- ========================================================================
CREATE OR REPLACE FUNCTION public.get_last_week_of_month(p_year INTEGER, p_month INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $function$
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
$function$;

-- ========================================================================
-- 2. get_sunday_of_iso_week(year, week_number)
-- Returns the Sunday date of a given ISO week
-- ========================================================================
CREATE OR REPLACE FUNCTION public.get_sunday_of_iso_week(p_year INTEGER, p_week_number INTEGER)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $function$
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
$function$;

-- ========================================================================
-- 3. date_to_date_key(date)
-- Converts a DATE to YYYYMMDD integer format
-- ========================================================================
CREATE OR REPLACE FUNCTION public.date_to_date_key(p_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
  RETURN (
    EXTRACT(YEAR FROM p_date)::INTEGER * 10000 +
    EXTRACT(MONTH FROM p_date)::INTEGER * 100 +
    EXTRACT(DAY FROM p_date)::INTEGER
  );
END;
$function$;

-- ========================================================================
-- Verification: Test the functions
-- ========================================================================
SELECT 'Helper functions created successfully!' AS status;

-- Test examples
SELECT
  'get_last_week_of_month(2025, 12)' AS test,
  get_last_week_of_month(2025, 12) AS result;

SELECT
  'get_sunday_of_iso_week(2025, 52)' AS test,
  get_sunday_of_iso_week(2025, 52) AS result;

SELECT
  'date_to_date_key(2025-12-28)' AS test,
  date_to_date_key('2025-12-28'::DATE) AS result;
