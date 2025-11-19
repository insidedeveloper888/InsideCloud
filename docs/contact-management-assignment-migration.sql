/**
 * Contact Management - Assignment Fields Migration
 * Add separate fields for Sales Person and Customer Service assignments
 * Remove assigned_department field (deprecated)
 *
 * Created: 2025-11-19
 * Version: 1.1.0
 */

-- Add new assignment fields
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS sales_person_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_service_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL;

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_contacts_sales_person ON contacts(sales_person_individual_id);
CREATE INDEX IF NOT EXISTS idx_contacts_customer_service ON contacts(customer_service_individual_id);

-- Note: We keep assigned_department and assigned_to_individual_id for backward compatibility
-- They can be deprecated in a future migration once all data is migrated

-- Migration complete
