-- Migration 005: Rename sales_person to technician in delivery_orders
-- Description: Delivery orders should track technicians, not sales persons
-- Date: 2025-11-24

-- Rename the column in delivery_orders table
ALTER TABLE delivery_orders
  RENAME COLUMN sales_person_individual_id TO technician_individual_id;

-- Drop the old index
DROP INDEX IF EXISTS idx_delivery_orders_sales_person;

-- Create new index with correct name
CREATE INDEX IF NOT EXISTS idx_delivery_orders_technician
  ON delivery_orders(technician_individual_id);

-- Add comment to clarify the column purpose
COMMENT ON COLUMN delivery_orders.technician_individual_id IS
  'Technician assigned to this delivery order';
