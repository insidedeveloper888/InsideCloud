-- ============================================================================
-- CONTACT MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0.0
-- Created: 2025-11-19
-- Purpose: Complete database schema for Contact Management (名单管理) CRM system
--
-- This file contains all tables, constraints, indexes, and triggers needed
-- for the Contact Management feature. Execute this entire file on a fresh
-- database to set up the complete system.
-- ============================================================================

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- 1. Contacts Table
-- Stores all contact records (customers, suppliers, COI, internal)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nickname TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),

  -- Contact Information
  email TEXT,
  phone_1 TEXT NOT NULL,
  phone_2 TEXT,

  -- Business Information
  company_name TEXT,
  industry TEXT,
  entity_type TEXT NOT NULL DEFAULT 'individual' CHECK (entity_type IN ('individual', 'company')),
  contact_type TEXT NOT NULL DEFAULT 'customer' CHECK (contact_type IN ('customer', 'supplier', 'coi', 'internal')),

  -- Contact Person (for company entities)
  contact_person_name TEXT,
  contact_person_phone TEXT,

  -- Address Information
  address_line_1 TEXT,
  address_line_2 TEXT,
  postal_code TEXT,
  city TEXT,
  state TEXT CHECK (
    state IS NULL OR
    state IN (
      'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang',
      'Penang', 'Perak', 'Perlis', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu',
      'Kuala Lumpur', 'Labuan', 'Putrajaya'
    )
  ),

  -- Source & Assignment
  traffic_source_id UUID REFERENCES traffic_channels(id) ON DELETE SET NULL,
  sales_person_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  customer_service_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Referral System
  referred_by_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Pipeline Status
  current_stage_id UUID REFERENCES contact_stages(id) ON DELETE SET NULL,

  -- Avatar
  avatar_url TEXT,
  avatar_color TEXT DEFAULT '#3B82F6',

  -- Customer Rating (1-10, configurable via contact_settings)
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),

  -- Notes
  notes TEXT,

  -- Soft Delete
  is_deleted BOOLEAN DEFAULT FALSE,

  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  updated_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL
);

-- 2. Contact Stages Table
-- Defines pipeline stages for contact progression
CREATE TABLE IF NOT EXISTS contact_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#2196F3',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- 3. Traffic Channels Table
-- Defines traffic sources/marketing channels
CREATE TABLE IF NOT EXISTS traffic_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- 4. Contact Tags Table
-- Tag system for contact categorization
CREATE TABLE IF NOT EXISTS contact_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- 5. Contact Tag Assignments Table
-- Many-to-many relationship between contacts and tags
CREATE TABLE IF NOT EXISTS contact_tag_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES contact_tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contact_id, tag_id)
);

-- 6. Contact Settings Table
-- Organization-level settings for contact management
CREATE TABLE IF NOT EXISTS contact_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Rating Configuration
  max_rating_scale INTEGER NOT NULL DEFAULT 10 CHECK (max_rating_scale >= 3 AND max_rating_scale <= 10),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one settings record per organization
  UNIQUE(organization_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_organization ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(contact_type);
CREATE INDEX IF NOT EXISTS idx_contacts_stage ON contacts(current_stage_id);
CREATE INDEX IF NOT EXISTS idx_contacts_channel ON contacts(traffic_source_id);
CREATE INDEX IF NOT EXISTS idx_contacts_sales_person ON contacts(sales_person_individual_id);
CREATE INDEX IF NOT EXISTS idx_contacts_customer_service ON contacts(customer_service_individual_id);
CREATE INDEX IF NOT EXISTS idx_contacts_deleted ON contacts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_1);

-- Contact Stages indexes
CREATE INDEX IF NOT EXISTS idx_contact_stages_organization ON contact_stages(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_stages_order ON contact_stages(order_index);

-- Traffic Channels indexes
CREATE INDEX IF NOT EXISTS idx_traffic_channels_organization ON traffic_channels(organization_id);

-- Contact Tags indexes
CREATE INDEX IF NOT EXISTS idx_contact_tags_organization ON contact_tags(organization_id);

-- Contact Tag Assignments indexes
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_contact ON contact_tag_assignments(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_tag ON contact_tag_assignments(tag_id);

-- Contact Settings indexes
CREATE INDEX IF NOT EXISTS idx_contact_settings_organization ON contact_settings(organization_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE contacts IS 'Central table for all contact records (customers, suppliers, COI, internal)';
COMMENT ON TABLE contact_stages IS 'Pipeline stages for contact progression (e.g., Lead, Qualified, Won)';
COMMENT ON TABLE traffic_channels IS 'Marketing channels and traffic sources (e.g., Website, Referral, Social Media)';
COMMENT ON TABLE contact_tags IS 'Tags for categorizing and filtering contacts';
COMMENT ON TABLE contact_tag_assignments IS 'Many-to-many relationship between contacts and tags';
COMMENT ON TABLE contact_settings IS 'Organization-level settings for contact management features';

COMMENT ON COLUMN contacts.entity_type IS 'Individual or Company';
COMMENT ON COLUMN contacts.contact_type IS 'Customer, Supplier, COI (Center of Influence), or Internal';
COMMENT ON COLUMN contacts.state IS 'Malaysian states and federal territories only';
COMMENT ON COLUMN contacts.rating IS 'Customer conversion probability rating (1-10). Only applicable for customer contacts.';
COMMENT ON COLUMN contacts.avatar_color IS 'Hex color for avatar background when no image is provided';
COMMENT ON COLUMN contact_settings.max_rating_scale IS 'Maximum rating scale for customer conversion probability (3-10). Default is 10.';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_stages_updated_at BEFORE UPDATE ON contact_stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_traffic_channels_updated_at BEFORE UPDATE ON traffic_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_tags_updated_at BEFORE UPDATE ON contact_tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_settings_updated_at BEFORE UPDATE ON contact_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DEFAULT DATA (OPTIONAL)
-- ============================================================================

-- Uncomment and customize these INSERTs for your organization
-- Replace 'your-organization-id' with actual UUID

/*
-- Default Contact Stages
INSERT INTO contact_stages (organization_id, name, color, order_index) VALUES
  ('your-organization-id', 'Lead', '#9E9E9E', 0),
  ('your-organization-id', 'Qualified', '#2196F3', 1),
  ('your-organization-id', 'Proposal', '#FF9800', 2),
  ('your-organization-id', 'Negotiation', '#FFC107', 3),
  ('your-organization-id', 'Won', '#4CAF50', 4),
  ('your-organization-id', 'Lost', '#F44336', 5)
ON CONFLICT (organization_id, name) DO NOTHING;

-- Default Traffic Channels
INSERT INTO traffic_channels (organization_id, name) VALUES
  ('your-organization-id', 'Website'),
  ('your-organization-id', 'Referral'),
  ('your-organization-id', 'Social Media'),
  ('your-organization-id', 'Email Campaign'),
  ('your-organization-id', 'Direct'),
  ('your-organization-id', 'Partner'),
  ('your-organization-id', 'Event')
ON CONFLICT (organization_id, name) DO NOTHING;

-- Default Contact Settings
INSERT INTO contact_settings (organization_id, max_rating_scale)
VALUES ('your-organization-id', 10)
ON CONFLICT (organization_id) DO NOTHING;
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify the schema was created correctly

-- 1. Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('contacts', 'contact_stages', 'traffic_channels', 'contact_tags', 'contact_tag_assignments', 'contact_settings')
ORDER BY table_name;

-- 2. Check all indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('contacts', 'contact_stages', 'traffic_channels', 'contact_tags', 'contact_tag_assignments', 'contact_settings')
ORDER BY tablename, indexname;

-- 3. Check all triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('contacts', 'contact_stages', 'traffic_channels', 'contact_tags', 'contact_settings')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
