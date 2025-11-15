-- Debug Script for Strategic Map v2 Cascade Issues
-- Run this in Supabase SQL Editor to diagnose problems

-- ============================================================================
-- CHECK 1: Verify utility functions exist
-- ============================================================================
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%iso_week%'
  OR routine_name LIKE '%sunday%'
  OR routine_name LIKE '%date_key%'
ORDER BY routine_name;

-- Expected output:
-- get_iso_week, get_last_week_of_month, get_sunday_of_iso_week,
-- date_to_date_key, date_key_to_date

-- ============================================================================
-- CHECK 2: Verify trigger exists
-- ============================================================================
SELECT
  tgname as trigger_name,
  tgtype,
  tgenabled
FROM pg_trigger
WHERE tgname = 'trigger_create_cascaded_items';

-- Expected: One row with tgenabled = 'O' (origin)

-- ============================================================================
-- CHECK 3: Test utility functions manually
-- ============================================================================
SELECT
  'Dec 2025 last week' as test,
  get_last_week_of_month(2025, 12) as result,
  'Should be 1 (Week 1 of 2026)' as expected;

SELECT
  'Week 1 2026 Sunday' as test,
  get_sunday_of_iso_week(2026, 1) as result,
  'Should be 2026-01-04' as expected;

SELECT
  'Date to date_key' as test,
  date_to_date_key('2026-01-04'::DATE) as result,
  'Should be 20260104' as expected;

-- ============================================================================
-- CHECK 4: Look at all your current items
-- ============================================================================
SELECT
  id,
  LEFT(text, 30) as text_preview,
  timeframe,
  category_index,
  year_index,
  month_col_index,
  week_number,
  daily_date_key,
  is_cascaded,
  cascade_level,
  parent_item_id,
  created_at
FROM strategic_map_items
WHERE is_deleted = FALSE
ORDER BY created_at DESC, cascade_level ASC
LIMIT 20;

-- Expected: If you added a 2025 yearly goal, you should see:
-- 1. Yearly item (timeframe='yearly', year_index=0, is_cascaded=false)
-- 2. Monthly item (timeframe='monthly', month_col_index=24299, is_cascaded=true)
-- 3. Weekly item (timeframe='weekly', week_number=1, is_cascaded=true)
-- 4. Daily item (timeframe='daily', daily_date_key=20260104, is_cascaded=true)

-- ============================================================================
-- CHECK 5: Look specifically for cascade chains
-- ============================================================================
WITH RECURSIVE cascade_tree AS (
  -- Start with yearly items
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
    parent_item_id,
    ARRAY[id] as path,
    0 as depth
  FROM strategic_map_items
  WHERE timeframe = 'yearly'
    AND is_deleted = FALSE
    AND is_cascaded = FALSE

  UNION ALL

  -- Find children
  SELECT
    c.id,
    c.text,
    c.timeframe,
    c.category_index,
    c.year_index,
    c.month_col_index,
    c.week_number,
    c.daily_date_key,
    c.is_cascaded,
    c.cascade_level,
    c.parent_item_id,
    p.path || c.id,
    p.depth + 1
  FROM strategic_map_items c
  INNER JOIN cascade_tree p ON c.parent_item_id = p.id
  WHERE c.is_deleted = FALSE
)
SELECT
  REPEAT('  ', depth) || timeframe as cascade_chain,
  LEFT(text, 30) as text_preview,
  category_index,
  year_index,
  month_col_index,
  week_number,
  daily_date_key,
  cascade_level,
  depth
FROM cascade_tree
ORDER BY path;

-- Expected: Tree structure showing yearly → monthly → weekly → daily

-- ============================================================================
-- CHECK 6: Check for recent trigger logs (if logging enabled)
-- ============================================================================
-- Note: RAISE NOTICE logs appear in Supabase Logs → Postgres Logs

-- ============================================================================
-- CHECK 7: Verify realtime publication
-- ============================================================================
SELECT
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- Expected: Row with tablename = 'strategic_map_items'

-- ============================================================================
-- CHECK 8: Count items by timeframe
-- ============================================================================
SELECT
  timeframe,
  is_cascaded,
  COUNT(*) as item_count
FROM strategic_map_items
WHERE is_deleted = FALSE
GROUP BY timeframe, is_cascaded
ORDER BY timeframe, is_cascaded;

-- Expected (if cascade works):
-- yearly, false, 1+
-- monthly, true, 1+
-- weekly, true, 1+
-- daily, true, 1+
