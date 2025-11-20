-- ============================================================================
-- Fix Inventory Product Icon
-- ============================================================================
-- This updates the inventory product icon field to 'InventoryIcon'
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Update the icon column to use the correct icon component name
UPDATE public.products
SET icon = 'InventoryIcon'
WHERE key = 'inventory';

-- Verify the update
SELECT
  id,
  key,
  name,
  icon,
  category,
  description
FROM public.products
WHERE key = 'inventory';
