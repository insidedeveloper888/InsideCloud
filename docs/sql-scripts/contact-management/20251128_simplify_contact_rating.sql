-- Migration: Simplify Contact Rating Scale
-- Date: 2025-11-28
-- Description: Hardcode max_rating_scale to 5 stars for all organizations
-- Reason: Remove configuration complexity and prevent data inconsistency

-- Step 1: Drop the old constraint that allowed 3-10 range
ALTER TABLE public.contact_settings
DROP CONSTRAINT IF EXISTS contact_settings_max_rating_scale_check;

-- Step 2: Set all existing max_rating_scale to 5
UPDATE public.contact_settings
SET max_rating_scale = 5
WHERE max_rating_scale != 5;

-- Step 3: Add new constraint (fixed at 5)
ALTER TABLE public.contact_settings
ADD CONSTRAINT contact_settings_max_rating_scale_check
CHECK (max_rating_scale = 5);

-- Step 4: Set default to 5
ALTER TABLE public.contact_settings
ALTER COLUMN max_rating_scale SET DEFAULT 5;

-- Step 5: Add comment explaining this is now fixed
COMMENT ON COLUMN public.contact_settings.max_rating_scale IS 'Fixed at 5 stars - not user configurable. Column kept for backward compatibility.';

-- Verification query (run after migration)
-- SELECT organization_id, max_rating_scale FROM contact_settings;
-- Expected: All rows should have max_rating_scale = 5
