-- Check cascade trigger status and test cascade manually

-- 1. Check if trigger exists and is enabled
SELECT
    t.tgname AS trigger_name,
    CASE t.tgenabled
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        WHEN 'R' THEN 'REPLICA'
        WHEN 'A' THEN 'ALWAYS'
        ELSE 'UNKNOWN'
    END AS status,
    p.proname AS function_name,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'strategic_map_items'::regclass
  AND t.tgname = 'trigger_create_cascaded_items'
ORDER BY t.tgname;

-- 2. If trigger doesn't exist, we need to create it
-- Check if the function exists
SELECT
    proname AS function_name,
    'Function exists' AS status
FROM pg_proc
WHERE proname = 'create_cascaded_items';

-- 3. Show helper functions needed for cascade
SELECT
    proname AS function_name
FROM pg_proc
WHERE proname IN (
    'get_last_week_of_month',
    'get_sunday_of_iso_week',
    'date_to_date_key'
)
ORDER BY proname;
