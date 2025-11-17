// Install the missing get_sunday_of_iso_week function using direct Postgres connection
const { Client } = require('pg');

// Supabase connection config
const config = {
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.rituzypqhjawhyrxoddj',
  password: 'JackKwokJunhao#1234',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
};

async function installFunction() {
  const client = new Client(config);

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL\n');

    console.log('Installing get_sunday_of_iso_week function...\n');

    const sql = `
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
    `;

    const result = await client.query(sql);
    console.log('✅ Function get_sunday_of_iso_week created successfully!\n');

    // Test it
    console.log('Testing function...');
    const testResult = await client.query(
      'SELECT get_sunday_of_iso_week($1, $2) as result',
      [2025, 52]
    );
    console.log(`✅ Test passed! Sunday of Week 52, 2025: ${testResult.rows[0].result}\n`);

    // Now reinstall the trigger to make sure it uses the function
    console.log('Reinstalling cascade trigger...\n');

    const triggerSQL = `
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

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_create_cascaded_items ON strategic_map_items;

CREATE TRIGGER trigger_create_cascaded_items
  AFTER INSERT ON strategic_map_items
  FOR EACH ROW
  EXECUTE FUNCTION create_cascaded_items();
    `;

    await client.query(triggerSQL);
    console.log('✅ Cascade trigger reinstalled successfully!\n');

    console.log('=== Installation Complete! ===\n');
    console.log('All functions are now installed:');
    console.log('  ✅ get_last_week_of_month');
    console.log('  ✅ get_sunday_of_iso_week');
    console.log('  ✅ date_to_date_key');
    console.log('  ✅ create_cascaded_items (trigger)');
    console.log('\n🎉 Ready to test! Try creating a new goal in the yearly view.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

installFunction();
