-- Simple check: Is the cascade trigger attached and enabled?

-- 1. Check if trigger is attached
SELECT
    t.tgname AS trigger_name,
    CASE t.tgenabled
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE t.tgenabled::text
    END AS status
FROM pg_trigger t
WHERE t.tgrelid = 'strategic_map_items'::regclass
  AND t.tgname LIKE '%cascade%'
ORDER BY t.tgname;

-- 2. Check if helper functions exist
SELECT proname AS function_name
FROM pg_proc
WHERE proname IN (
    'create_cascaded_items',
    'get_last_week_of_month',
    'get_sunday_of_iso_week',
    'date_to_date_key'
)
ORDER BY proname;

-- If the above shows missing functions or disabled trigger, that's the problem!
