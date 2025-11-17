-- Clean up duplicate cascaded items
-- This removes duplicates while keeping the oldest item for each position

-- First, let's see how many duplicates we have
SELECT
  organization_id,
  timeframe,
  category_index,
  COALESCE(year_index::text, 'NULL') as year_idx,
  COALESCE(month_col_index::text, 'NULL') as month_idx,
  COALESCE(week_number::text, 'NULL') as week_num,
  COALESCE(daily_date_key::text, 'NULL') as daily_key,
  text,
  COUNT(*) as duplicate_count
FROM strategic_map_items
WHERE is_cascaded = TRUE
  AND is_deleted = FALSE
GROUP BY
  organization_id,
  timeframe,
  category_index,
  year_index,
  month_col_index,
  week_number,
  daily_date_key,
  text,
  parent_item_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Delete duplicates, keeping only the oldest item for each position
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY
        organization_id,
        timeframe,
        category_index,
        COALESCE(year_index, -1),
        COALESCE(month_col_index, -1),
        COALESCE(week_number, -1),
        COALESCE(daily_date_key, -1),
        text,
        parent_item_id
      ORDER BY created_at ASC  -- Keep the oldest one
    ) as rn
  FROM strategic_map_items
  WHERE is_cascaded = TRUE
    AND is_deleted = FALSE
)
DELETE FROM strategic_map_items
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Verify: Check if any duplicates remain
SELECT
  organization_id,
  timeframe,
  category_index,
  text,
  COUNT(*) as duplicate_count
FROM strategic_map_items
WHERE is_cascaded = TRUE
  AND is_deleted = FALSE
GROUP BY
  organization_id,
  timeframe,
  category_index,
  year_index,
  month_col_index,
  week_number,
  daily_date_key,
  text,
  parent_item_id
HAVING COUNT(*) > 1;

SELECT 'Duplicate cascaded items cleaned up!' AS status;
