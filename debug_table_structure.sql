-- Debug: Check all constraints and triggers on strategic_map_items table

-- 1. Check all constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'strategic_map_items'::regclass;

-- 2. Check all triggers
SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'strategic_map_items';

-- 3. Check table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'strategic_map_items'
ORDER BY ordinal_position;

-- 4. Check indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'strategic_map_items';
