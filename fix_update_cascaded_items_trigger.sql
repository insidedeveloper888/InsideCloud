-- Fix update_cascaded_items trigger to recursively update all descendants
-- Currently it only updates direct children, not grandchildren

CREATE OR REPLACE FUNCTION public.update_cascaded_items()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only process original items (not cascaded)
  IF NEW.is_cascaded = TRUE THEN
    RETURN NEW;
  END IF;

  -- Recursively update ALL descendants (not just direct children)
  -- Use a recursive CTE to find all cascaded items in the tree
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

  RETURN NEW;
END;
$function$;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_cascaded_items ON strategic_map_items;

-- Create the trigger (attach function to table)
CREATE TRIGGER trigger_update_cascaded_items
  AFTER UPDATE ON strategic_map_items
  FOR EACH ROW
  WHEN (OLD.text IS DISTINCT FROM NEW.text OR OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_cascaded_items();

-- Verify trigger was created
SELECT 'Update cascade trigger created and attached successfully!' AS status;
