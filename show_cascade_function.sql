-- Show the cascade trigger function definition
SELECT
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname LIKE '%cascade%'
    OR p.proname LIKE '%strategic_map%'
  )
ORDER BY p.proname;
