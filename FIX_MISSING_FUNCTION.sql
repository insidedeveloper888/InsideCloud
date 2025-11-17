-- Quick Fix: Install the missing get_sunday_of_iso_week function
-- This is the ONLY function missing from your database
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/rituzypqhjawhyrxoddj/sql

-- Drop existing function first (in case it exists with different parameter names)
DROP FUNCTION IF EXISTS public.get_sunday_of_iso_week(integer, integer);

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

-- Test it
SELECT get_sunday_of_iso_week(2025, 52) as sunday_of_week_52_2025;

-- You should see: 2025-12-28

-- ✅ Done! Now the cascade will work when you create a new yearly goal.
