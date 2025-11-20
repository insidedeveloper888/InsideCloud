-- ============================================================================
-- QUICK SCHEMA CHECK
-- ============================================================================
-- Copy and paste this into Supabase SQL Editor to see your actual table structure
-- ============================================================================

-- 1. Check individuals table columns
SELECT
    'individuals' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'individuals'
ORDER BY ordinal_position;

-- 2. Check lark_users table columns
SELECT
    'lark_users' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'lark_users'
ORDER BY ordinal_position;

-- 3. Show sample data from individuals (without sensitive info)
SELECT
    id,
    lark_user_id,
    created_at
FROM individuals
LIMIT 3;

-- 4. Show sample data from lark_users
SELECT
    lark_user_id,
    name,
    email,
    organization_id,
    created_at
FROM lark_users
LIMIT 3;

-- 5. Test the JOIN we're trying to use
SELECT
    i.id as individual_id,
    i.lark_user_id,
    lu.name as user_name,
    lu.email as user_email
FROM individuals i
LEFT JOIN lark_users lu ON i.lark_user_id = lu.lark_user_id
LIMIT 3;
