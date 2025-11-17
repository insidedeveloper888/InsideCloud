-- Make created_by_individual_id and updated_by_individual_id nullable
-- Since Strategic Map v2 uses organization mode only, we don't need to track individuals

ALTER TABLE strategic_map_items
ALTER COLUMN created_by_individual_id DROP NOT NULL;

ALTER TABLE strategic_map_items
ALTER COLUMN updated_by_individual_id DROP NOT NULL;

-- Verify the changes
SELECT
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'strategic_map_items'
  AND column_name IN ('created_by_individual_id', 'updated_by_individual_id');
