-- Install UPDATE trigger to propagate changes to all cascaded descendants
-- This ensures when you edit a yearly goal, all monthly/weekly/daily items update

CREATE OR REPLACE FUNCTION public.update_cascaded_items()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only process when text or status changes
  IF OLD.text = NEW.text AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Only propagate updates from original items (cascaded items are read-only in UI)
  IF NEW.is_cascaded = TRUE THEN
    RETURN NEW;
  END IF;

  -- Recursively update ALL descendants using recursive CTE
  WITH RECURSIVE descendants AS (
    -- Direct children
    SELECT id, parent_item_id, cascade_level
    FROM strategic_map_items
    WHERE parent_item_id = NEW.id
      AND is_deleted = FALSE

    UNION ALL

    -- Recursive: grandchildren, great-grandchildren, etc.
    SELECT s.id, s.parent_item_id, s.cascade_level
    FROM strategic_map_items s
    INNER JOIN descendants d ON s.parent_item_id = d.id
    WHERE s.is_deleted = FALSE
  )
  UPDATE strategic_map_items
  SET
    text = NEW.text,
    status = NEW.status,
    updated_at = NOW(),
    updated_by_individual_id = NEW.updated_by_individual_id
  WHERE id IN (SELECT id FROM descendants);

  RAISE NOTICE '[UPDATE CASCADE] Updated % descendants of item %',
    (SELECT COUNT(*) FROM descendants), NEW.id;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if present
DROP TRIGGER IF EXISTS trigger_update_cascaded_items ON strategic_map_items;

-- Create the UPDATE trigger
CREATE TRIGGER trigger_update_cascaded_items
  AFTER UPDATE ON strategic_map_items
  FOR EACH ROW
  WHEN (OLD.text IS DISTINCT FROM NEW.text OR OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_cascaded_items();

-- Verify
SELECT 'Update cascade trigger installed! Edits to yearly goals will now propagate to all descendants.' as status;
