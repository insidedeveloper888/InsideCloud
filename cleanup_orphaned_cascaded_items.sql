-- Clean up orphaned cascaded items
-- These are cascaded items whose parent no longer exists
-- NOTE: Cascaded items SHOULD have the same text as their parent, so we DON'T check text mismatch

-- First, let's see truly orphaned items (cascaded items with no parent)
SELECT
  c.id,
  c.timeframe,
  c.category_index,
  c.text as cascaded_text,
  c.parent_item_id
FROM strategic_map_items c
LEFT JOIN strategic_map_items p ON c.parent_item_id = p.id
WHERE c.is_cascaded = TRUE
  AND c.is_deleted = FALSE
  AND (
    p.id IS NULL  -- Parent doesn't exist
    OR p.is_deleted = TRUE  -- Parent is deleted
  )
ORDER BY c.timeframe, c.category_index;

-- Soft delete truly orphaned cascaded items (no parent)
UPDATE strategic_map_items
SET
  is_deleted = TRUE,
  deleted_at = NOW()
WHERE id IN (
  SELECT c.id
  FROM strategic_map_items c
  LEFT JOIN strategic_map_items p ON c.parent_item_id = p.id
  WHERE c.is_cascaded = TRUE
    AND c.is_deleted = FALSE
    AND (
      p.id IS NULL  -- Parent doesn't exist
      OR p.is_deleted = TRUE  -- Parent is deleted
    )
);

-- Verify: Check if any orphaned items remain
SELECT
  c.id,
  c.timeframe,
  c.text as cascaded_text,
  c.parent_item_id
FROM strategic_map_items c
LEFT JOIN strategic_map_items p ON c.parent_item_id = p.id
WHERE c.is_cascaded = TRUE
  AND c.is_deleted = FALSE
  AND (
    p.id IS NULL
    OR p.is_deleted = TRUE
  );

SELECT 'Truly orphaned cascaded items cleaned up!' AS status;
