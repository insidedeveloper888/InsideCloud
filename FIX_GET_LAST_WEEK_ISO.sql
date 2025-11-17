-- Fix get_last_week_of_month to use ISO 8601 Thursday rule
-- A week belongs to a month if its Thursday is in that month

CREATE OR REPLACE FUNCTION public.get_last_week_of_month(p_year INTEGER, p_month INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_last_day_of_month DATE;
  v_current_date DATE;
  v_thursday DATE;
  v_week_number INTEGER;
  v_last_week_number INTEGER;
BEGIN
  -- Get the last day of the month
  v_last_day_of_month := (DATE (p_year || '-' || p_month || '-01') + INTERVAL '1 month - 1 day')::DATE;

  -- Start from the last day and work backwards to find the last Thursday in the month
  v_current_date := v_last_day_of_month;

  -- Find the last Thursday of the month
  WHILE EXTRACT(ISODOW FROM v_current_date) != 4 LOOP  -- 4 = Thursday
    v_current_date := v_current_date - INTERVAL '1 day';
  END LOOP;

  -- This Thursday belongs to the month, so get its ISO week number
  v_last_week_number := EXTRACT(WEEK FROM v_current_date)::INTEGER;

  RETURN v_last_week_number;
END;
$$;

-- Test it
SELECT
  'December 2025 last week' as test,
  get_last_week_of_month(2025, 12) as week_number,
  'Should be 52 (not 1)' as expected;

-- Verify: Week 52 is Dec 22-28, Thursday is Dec 25 ✓
-- Week 1 is Dec 29 - Jan 4, Thursday is Jan 1 → belongs to January ✓
