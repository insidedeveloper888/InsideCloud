-- Drop the unique position constraint to allow multiple items in the same cell
-- Strategic Map should support stacking multiple goals/items in the same position

-- First, let's see what constraints exist
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'strategic_map_items'::regclass
  AND conname LIKE '%unique%';

-- Drop the unique constraint
ALTER TABLE strategic_map_items
DROP CONSTRAINT IF EXISTS strategic_map_items_unique_position;

-- Verify it's gone
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'strategic_map_items'::regclass
  AND conname LIKE '%unique%';
