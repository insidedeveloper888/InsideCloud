/**
 * Contact Management - Improvements Migration
 * 1. Add nickname column
 * 2. Remove deprecated assignment columns
 *
 * Created: 2025-11-19
 * Version: 1.2.0
 */

-- 1. Add nickname column
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 2. Remove deprecated assignment columns
-- (We'll keep them for now in case there's existing data, but mark as deprecated)
-- In a future migration, after data is migrated, these can be dropped:
-- ALTER TABLE contacts DROP COLUMN IF EXISTS assigned_department;
-- ALTER TABLE contacts DROP COLUMN IF EXISTS assigned_to_individual_id;

-- For now, just add a comment
COMMENT ON COLUMN contacts.assigned_department IS 'DEPRECATED: Use sales_person_individual_id or customer_service_individual_id instead';
COMMENT ON COLUMN contacts.assigned_to_individual_id IS 'DEPRECATED: Use sales_person_individual_id or customer_service_individual_id instead';

-- Migration complete
