-- Install ONLY the cascade trigger (helper functions already exist)
-- Run this in Supabase SQL Editor

-- ========================================================================
-- Create Cascade Trigger Function
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
-- Attach Trigger to Table
-- ========================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_cascaded_items ON strategic_map_items;

-- Create the trigger
CREATE TRIGGER trigger_create_cascaded_items
  AFTER INSERT ON strategic_map_items
  FOR EACH ROW
  EXECUTE FUNCTION create_cascaded_items();

-- ========================================================================
-- Verification
-- ========================================================================

-- Verify trigger was created
SELECT
  tgname AS trigger_name,
  CASE tgenabled
    WHEN 'O' THEN 'ENABLED'
    ELSE 'DISABLED'
  END AS status,
  'Trigger successfully installed!' as message
FROM pg_trigger
WHERE tgrelid = 'strategic_map_items'::regclass
  AND tgname = 'trigger_create_cascaded_items';

-- If you see a row with status='ENABLED', you're ready to test!
-- Create a new goal in the yearly view and it should cascade to all 4 timeframes.
