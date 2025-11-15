-- Simple Cascade Test
-- This will manually create a yearly item and verify cascade

-- Step 1: Find your organization ID
SELECT id, slug, name FROM organizations WHERE slug = 'cloud';
-- Copy the ID from the result

-- Step 2: Find your individual ID
SELECT id FROM individuals LIMIT 1;
-- Copy the ID from the result

-- Step 3: REPLACE the UUIDs below with your actual IDs, then run

DO $$
DECLARE
  v_org_id UUID := '86774cf1-7590-487e-9657-110cdf3c7fc9'; -- REPLACE WITH YOUR ORG ID
  v_user_id UUID := 'c064315a-6a6f-4275-a8a5-622397e5c97a'; -- REPLACE WITH YOUR USER ID
  v_yearly_id UUID;
BEGIN
  -- Insert a test yearly item
  INSERT INTO strategic_map_items (
    organization_id,
    created_by_individual_id,
    text,
    status,
    timeframe,
    category_index,
    year_index,
    is_cascaded,
    cascade_level
  ) VALUES (
    v_org_id,
    v_user_id,
    '[TEST] Cascade Test Goal - 2025',
    'neutral',
    'yearly',
    0, -- 阶段成就
    0, -- 2025 (first year)
    FALSE,
    0
  )
  RETURNING id INTO v_yearly_id;

  RAISE NOTICE 'Created yearly item: %', v_yearly_id;

  -- Wait a moment for trigger to fire
  PERFORM pg_sleep(1);

  -- Check what was created
  RAISE NOTICE '=== Cascade Results ===';

  -- Check monthly cascade
  IF EXISTS (
    SELECT 1 FROM strategic_map_items
    WHERE parent_item_id = v_yearly_id
      AND timeframe = 'monthly'
      AND is_deleted = FALSE
  ) THEN
    RAISE NOTICE '✅ Monthly cascade: WORKING';
  ELSE
    RAISE NOTICE '❌ Monthly cascade: FAILED';
  END IF;

  -- Check weekly cascade
  IF EXISTS (
    SELECT 1 FROM strategic_map_items
    WHERE timeframe = 'weekly'
      AND is_deleted = FALSE
      AND parent_item_id IN (
        SELECT id FROM strategic_map_items
        WHERE parent_item_id = v_yearly_id
      )
  ) THEN
    RAISE NOTICE '✅ Weekly cascade: WORKING';
  ELSE
    RAISE NOTICE '❌ Weekly cascade: FAILED';
  END IF;

  -- Check daily cascade
  IF EXISTS (
    SELECT 1 FROM strategic_map_items
    WHERE timeframe = 'daily'
      AND is_deleted = FALSE
      AND parent_item_id IN (
        SELECT id FROM strategic_map_items
        WHERE timeframe = 'weekly'
          AND parent_item_id IN (
            SELECT id FROM strategic_map_items
            WHERE parent_item_id = v_yearly_id
          )
      )
  ) THEN
    RAISE NOTICE '✅ Daily cascade: WORKING';
  ELSE
    RAISE NOTICE '❌ Daily cascade: FAILED';
  END IF;

END $$;

-- Show all items in the cascade chain
SELECT
  timeframe,
  category_index,
  year_index,
  month_col_index,
  week_number,
  daily_date_key,
  is_cascaded,
  cascade_level,
  LEFT(text, 40) as text_preview
FROM strategic_map_items
WHERE text LIKE '%Cascade Test Goal%'
  AND is_deleted = FALSE
ORDER BY cascade_level;
