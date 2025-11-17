-- Debug: Check if cascade trigger is properly attached

-- 1. Check which triggers are active on strategic_map_items
SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'strategic_map_items'
ORDER BY trigger_name;

-- 2. Check if create_cascaded_items trigger exists
SELECT
    tgname AS trigger_name,
    tgtype AS trigger_type,
    tgenabled AS is_enabled
FROM pg_trigger
WHERE tgrelid = 'strategic_map_items'::regclass
  AND tgname LIKE '%cascade%';

-- 3. Manually test the cascade logic
-- Add a test yearly item and see what gets created
DO $$
DECLARE
  v_org_id UUID;
  v_new_item_id UUID;
  v_cascaded_count INTEGER;
BEGIN
  -- Get your organization ID
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'cloud' LIMIT 1;

  RAISE NOTICE 'Organization ID: %', v_org_id;

  -- Insert a test yearly item
  INSERT INTO strategic_map_items (
    organization_id,
    text,
    status,
    timeframe,
    category_index,
    year_index,
    is_cascaded,
    cascade_level
  ) VALUES (
    v_org_id,
    'DEBUG TEST',
    'neutral',
    'yearly',
    0,
    0,
    FALSE,
    0
  ) RETURNING id INTO v_new_item_id;

  RAISE NOTICE 'Created yearly item: %', v_new_item_id;

  -- Wait a moment for trigger to fire
  PERFORM pg_sleep(0.5);

  -- Count cascaded items
  SELECT COUNT(*) INTO v_cascaded_count
  FROM strategic_map_items
  WHERE parent_item_id = v_new_item_id;

  RAISE NOTICE 'Cascaded items created: %', v_cascaded_count;

  -- Show what was created
  RAISE NOTICE 'Cascaded items:';
  DECLARE
    r RECORD;
  BEGIN
    FOR r IN
      SELECT timeframe, text, cascade_level
      FROM strategic_map_items
      WHERE parent_item_id = v_new_item_id
    LOOP
      RAISE NOTICE '  - % item: % (level %)', r.timeframe, r.text, r.cascade_level;
    END LOOP;
  END;

  -- Rollback so we don't actually add the test item
  RAISE EXCEPTION 'Rolling back test transaction';
END $$;
