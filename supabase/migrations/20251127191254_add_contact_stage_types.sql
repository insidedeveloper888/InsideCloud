-- Migration: Add stage_type and is_system to contact_stages
-- Purpose: Lock system stages (Lead, Won, Lost) while allowing custom stages
-- Date: 2025-11-27

-- ============================================================================
-- STEP 1: Create ENUM type for stage types
-- ============================================================================
CREATE TYPE contact_stage_type AS ENUM ('lead', 'negotiation', 'won', 'lost');

-- ============================================================================
-- STEP 2: Add new columns to contact_stages table
-- ============================================================================
ALTER TABLE contact_stages
  ADD COLUMN stage_type contact_stage_type NULL,
  ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT false;

-- ============================================================================
-- STEP 3: Create unique index - one system stage per type per organization
-- ============================================================================
CREATE UNIQUE INDEX idx_contact_stages_unique_system_type
  ON contact_stages(organization_id, stage_type)
  WHERE is_system = true;

-- ============================================================================
-- STEP 4: Add constraint - system stages MUST have a stage_type
-- ============================================================================
ALTER TABLE contact_stages
  ADD CONSTRAINT chk_system_stage_has_type
  CHECK (
    (is_system = false) OR
    (is_system = true AND stage_type IS NOT NULL)
  );

-- ============================================================================
-- STEP 5: Data Migration - Mark existing stages as system stages
-- ============================================================================

-- For each organization, identify and mark system stages based on name patterns
DO $$
DECLARE
  org RECORD;
  lead_stage_id UUID;
  won_stage_id UUID;
  lost_stage_id UUID;
BEGIN
  -- Loop through all organizations
  FOR org IN SELECT id FROM organizations
  LOOP
    RAISE NOTICE 'Processing organization: %', org.id;

    -- Find and mark LEAD stage
    SELECT id INTO lead_stage_id
    FROM contact_stages
    WHERE organization_id = org.id
      AND (
        LOWER(name) LIKE '%lead%' OR
        LOWER(name) LIKE '%prospect%' OR
        LOWER(name) LIKE '%new%'
      )
    ORDER BY
      CASE
        WHEN LOWER(name) = 'lead' THEN 1
        WHEN LOWER(name) LIKE '%lead%' THEN 2
        ELSE 3
      END
    LIMIT 1;

    IF lead_stage_id IS NOT NULL THEN
      UPDATE contact_stages
      SET stage_type = 'lead', is_system = true
      WHERE id = lead_stage_id;
      RAISE NOTICE '  Marked LEAD stage: %', lead_stage_id;
    ELSE
      -- Create default LEAD stage if not found
      INSERT INTO contact_stages (organization_id, name, color, stage_type, is_system, order_index)
      VALUES (org.id, 'Lead', '#3B82F6', 'lead', true, 1)
      RETURNING id INTO lead_stage_id;
      RAISE NOTICE '  Created LEAD stage: %', lead_stage_id;
    END IF;

    -- Find and mark WON stage
    SELECT id INTO won_stage_id
    FROM contact_stages
    WHERE organization_id = org.id
      AND id != lead_stage_id  -- Exclude already marked stage
      AND (
        LOWER(name) LIKE '%won%' OR
        LOWER(name) LIKE '%success%' OR
        LOWER(name) LIKE '%closed%' OR
        LOWER(name) LIKE '%convert%'
      )
    ORDER BY
      CASE
        WHEN LOWER(name) = 'won' THEN 1
        WHEN LOWER(name) LIKE '%won%' THEN 2
        ELSE 3
      END
    LIMIT 1;

    IF won_stage_id IS NOT NULL THEN
      UPDATE contact_stages
      SET stage_type = 'won', is_system = true
      WHERE id = won_stage_id;
      RAISE NOTICE '  Marked WON stage: %', won_stage_id;
    ELSE
      -- Create default WON stage if not found
      INSERT INTO contact_stages (organization_id, name, color, stage_type, is_system, order_index)
      VALUES (org.id, 'Won', '#10B981', 'won', true, 99)
      RETURNING id INTO won_stage_id;
      RAISE NOTICE '  Created WON stage: %', won_stage_id;
    END IF;

    -- Find and mark LOST stage
    SELECT id INTO lost_stage_id
    FROM contact_stages
    WHERE organization_id = org.id
      AND id NOT IN (lead_stage_id, won_stage_id)  -- Exclude already marked stages
      AND (
        LOWER(name) LIKE '%lost%' OR
        LOWER(name) LIKE '%fail%' OR
        LOWER(name) LIKE '%reject%' OR
        LOWER(name) LIKE '%dead%'
      )
    ORDER BY
      CASE
        WHEN LOWER(name) = 'lost' THEN 1
        WHEN LOWER(name) LIKE '%lost%' THEN 2
        ELSE 3
      END
    LIMIT 1;

    IF lost_stage_id IS NOT NULL THEN
      UPDATE contact_stages
      SET stage_type = 'lost', is_system = true
      WHERE id = lost_stage_id;
      RAISE NOTICE '  Marked LOST stage: %', lost_stage_id;
    ELSE
      -- Create default LOST stage if not found
      INSERT INTO contact_stages (organization_id, name, color, stage_type, is_system, order_index)
      VALUES (org.id, 'Lost', '#EF4444', 'lost', true, 100)
      RETURNING id INTO lost_stage_id;
      RAISE NOTICE '  Created LOST stage: %', lost_stage_id;
    END IF;

  END LOOP;

  RAISE NOTICE 'Migration completed successfully';
END $$;

-- ============================================================================
-- STEP 6: Verification query (commented out - uncomment to run manually)
-- ============================================================================
-- SELECT
--   o.slug as organization,
--   cs.name as stage_name,
--   cs.stage_type,
--   cs.is_system,
--   COUNT(c.id) as contacts_count
-- FROM contact_stages cs
-- JOIN organizations o ON cs.organization_id = o.id
-- LEFT JOIN contacts c ON c.current_stage_id = cs.id
-- WHERE cs.is_system = true
-- GROUP BY o.slug, cs.id, cs.name, cs.stage_type, cs.is_system
-- ORDER BY o.slug, cs.stage_type;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- To rollback this migration:
--
-- ALTER TABLE contact_stages DROP CONSTRAINT chk_system_stage_has_type;
-- DROP INDEX idx_contact_stages_unique_system_type;
-- ALTER TABLE contact_stages DROP COLUMN stage_type;
-- ALTER TABLE contact_stages DROP COLUMN is_system;
-- DROP TYPE contact_stage_type;
