-- Fix cascade trigger to work without unique constraint
-- The trigger likely uses ON CONFLICT which fails after dropping the unique constraint

-- First, let's see the current trigger function
SELECT
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%cascade%'
ORDER BY p.proname;

-- Common trigger names to check:
-- - cascade_strategic_map_items
-- - auto_cascade_items
-- - strategic_map_cascade
-- etc.

-- Once we see the trigger function, we need to replace ON CONFLICT
-- with a regular INSERT (since we want to allow multiple items per position)
