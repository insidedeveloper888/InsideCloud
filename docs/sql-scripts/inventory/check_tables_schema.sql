-- ============================================================================
-- Diagnostic Script: Check Table Schemas
-- ============================================================================
-- Run this first to see what columns actually exist in your tables
-- This will help us write the correct JOIN query
-- ============================================================================

-- 1. Check individuals table structure
SELECT
    'individuals' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'individuals'
ORDER BY ordinal_position;

-- 2. Check lark_users table structure (if it exists)
SELECT
    'lark_users' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'lark_users'
ORDER BY ordinal_position;

-- 3. Check inventory_stock_movements table structure
SELECT
    'inventory_stock_movements' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'inventory_stock_movements'
ORDER BY ordinal_position;

-- 4. Sample data from individuals table (first 3 rows)
SELECT * FROM individuals LIMIT 3;

-- 5. Sample data from lark_users table (first 3 rows, if table exists)
-- Uncomment if lark_users table exists:
-- SELECT * FROM lark_users LIMIT 3;
