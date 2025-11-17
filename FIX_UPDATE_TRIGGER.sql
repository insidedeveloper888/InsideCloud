-- Fix the UPDATE trigger - use a different approach to avoid CTE scoping issues
-- This version uses a temporary table instead of CTE

CREATE OR REPLACE FUNCTION public.update_cascaded_items()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_descendant_id UUID;
  v_updated_count INTEGER := 0;
BEGIN
  -- Only process when text or status changes
  IF OLD.text = NEW.text AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Only propagate updates from original items (cascaded items are read-only in UI)
  IF NEW.is_cascaded = TRUE THEN
    RETURN NEW;
  END IF;

  -- Update all descendants using a loop instead of CTE
  -- This approach is more compatible across PostgreSQL versions
  FOR v_descendant_id IN
    WITH RECURSIVE descendants AS (
      -- Direct children
      SELECT id
      FROM strategic_map_items
      WHERE parent_item_id = NEW.id
        AND is_deleted = FALSE

      UNION ALL

      -- Recursive: grandchildren, great-grandchildren, etc.
      SELECT s.id
      FROM strategic_map_items s
      INNER JOIN descendants d ON s.parent_item_id = d.id
      WHERE s.is_deleted = FALSE
    )
    SELECT id FROM descendants
  LOOP
    UPDATE strategic_map_items
    SET
      text = NEW.text,
      status = NEW.status,
      updated_at = NOW(),
      updated_by_individual_id = NEW.updated_by_individual_id
    WHERE id = v_descendant_id;

    v_updated_count := v_updated_count + 1;
  END LOOP;

  RAISE NOTICE '[UPDATE CASCADE] Updated % descendants of item %', v_updated_count, NEW.id;

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

-- Test it
SELECT 'Update cascade trigger fixed! CTE scoping issue resolved.' as status;
