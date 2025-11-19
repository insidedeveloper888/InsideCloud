/**
 * Contact Management (名单管理) Database Schema
 * PostgreSQL migration for Supabase
 *
 * Created: 2025-11-18
 * Version: 1.0.0
 */

-- ============================================================================
-- TABLE: contact_stages (Customizable opportunity stages per organization)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contact_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Stage Information
  name TEXT NOT NULL,
  color TEXT DEFAULT '#2196F3', -- Hex color code
  order_index INT DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT contact_stages_org_name_unique UNIQUE (organization_id, name)
);

CREATE INDEX idx_contact_stages_org ON contact_stages(organization_id);

-- ============================================================================
-- TABLE: traffic_channels (Customizable traffic sources per organization)
-- ============================================================================

CREATE TABLE IF NOT EXISTS traffic_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Channel Information
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT traffic_channels_org_name_unique UNIQUE (organization_id, name)
);

CREATE INDEX idx_traffic_channels_org ON traffic_channels(organization_id);

-- ============================================================================
-- TABLE: contacts (Main contact table with all fields)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contacts (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-Tenant Context
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Contact Type
  contact_type TEXT NOT NULL CHECK (contact_type IN ('customer', 'supplier', 'coi', 'internal')),

  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', NULL)),

  -- Contact Information
  email TEXT,
  phone_1 TEXT NOT NULL,
  phone_2 TEXT,

  -- Business Information
  company_name TEXT,
  industry TEXT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('company', 'individual')),

  -- Contact Person (for company entities)
  contact_person_name TEXT,
  contact_person_phone TEXT,

  -- Address Information
  address_line_1 TEXT,
  address_line_2 TEXT,
  postal_code TEXT,
  city TEXT,
  state TEXT,

  -- Source & Assignment
  traffic_source_id UUID REFERENCES traffic_channels(id) ON DELETE SET NULL,
  assigned_department TEXT,
  assigned_to_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Referral System
  referred_by_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Pipeline Status
  current_stage_id UUID REFERENCES contact_stages(id) ON DELETE SET NULL,

  -- Avatar
  avatar_url TEXT,
  avatar_color TEXT DEFAULT '#2196F3',

  -- Lark Integration
  lark_user_id TEXT,
  lark_department_id TEXT,
  is_lark_synced BOOLEAN DEFAULT FALSE,
  last_lark_sync_at TIMESTAMPTZ,

  -- Third-Party Integration Fields (Phase 2)
  bukku_customer_id TEXT,
  is_bukku_synced BOOLEAN DEFAULT FALSE,
  last_bukku_sync_at TIMESTAMPTZ,

  xero_contact_id TEXT,
  is_xero_synced BOOLEAN DEFAULT FALSE,
  last_xero_sync_at TIMESTAMPTZ,

  ghl_contact_id TEXT,
  is_ghl_synced BOOLEAN DEFAULT FALSE,
  last_ghl_sync_at TIMESTAMPTZ,

  sync_source TEXT DEFAULT 'manual',
  external_id TEXT,

  -- Activity Tracking
  last_contact_date TIMESTAMPTZ,
  last_activity_type TEXT,

  -- Notes
  notes TEXT,

  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  updated_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  deleted_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Soft Delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_contacts_org ON contacts(organization_id, is_deleted);
CREATE INDEX idx_contacts_assigned_to ON contacts(assigned_to_individual_id);
CREATE INDEX idx_contacts_stage ON contacts(organization_id, current_stage_id, is_deleted);
CREATE INDEX idx_contacts_email ON contacts(organization_id, email) WHERE is_deleted = FALSE;
CREATE INDEX idx_contacts_phone ON contacts(organization_id, phone_1) WHERE is_deleted = FALSE;
CREATE INDEX idx_contacts_lark_user ON contacts(lark_user_id) WHERE lark_user_id IS NOT NULL;
CREATE INDEX idx_contacts_traffic_source ON contacts(organization_id, traffic_source_id, is_deleted);
CREATE INDEX idx_contacts_referred_by ON contacts(referred_by_contact_id) WHERE referred_by_contact_id IS NOT NULL;
CREATE INDEX idx_contacts_department ON contacts(organization_id, assigned_department, is_deleted);
CREATE INDEX idx_contacts_name ON contacts(organization_id, first_name, last_name, is_deleted);
CREATE INDEX idx_contacts_bukku ON contacts(bukku_customer_id) WHERE bukku_customer_id IS NOT NULL;
CREATE INDEX idx_contacts_xero ON contacts(xero_contact_id) WHERE xero_contact_id IS NOT NULL;
CREATE INDEX idx_contacts_ghl ON contacts(ghl_contact_id) WHERE ghl_contact_id IS NOT NULL;
CREATE INDEX idx_contacts_sync_source ON contacts(organization_id, sync_source, is_deleted);

-- ============================================================================
-- TABLE: contact_stage_history (Track stage transitions for pipeline velocity)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contact_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- Stage Transition
  from_stage_id UUID REFERENCES contact_stages(id) ON DELETE SET NULL,
  to_stage_id UUID REFERENCES contact_stages(id) ON DELETE SET NULL,

  -- Duration in this stage (calculated)
  days_in_stage INT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL
);

CREATE INDEX idx_contact_stage_history_contact ON contact_stage_history(contact_id);
CREATE INDEX idx_contact_stage_history_org ON contact_stage_history(organization_id);
CREATE INDEX idx_contact_stage_history_created ON contact_stage_history(created_at DESC);

-- ============================================================================
-- TABLE: integration_credentials (OAuth & API tokens for third-party integrations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Integration Type
  integration_type TEXT NOT NULL CHECK (
    integration_type IN ('bukku', 'xero', 'ghl', 'lark')
  ),

  -- OAuth Credentials (encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- API Configuration
  api_endpoint TEXT,
  api_version TEXT,

  -- Sync Configuration
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sync_frequency TEXT DEFAULT 'hourly',
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_error TEXT,

  -- Field Mappings
  field_mappings JSONB DEFAULT '{}',
  sync_filters JSONB DEFAULT '{}',

  -- Webhook Configuration
  webhook_url TEXT,
  webhook_secret TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT integration_credentials_unique UNIQUE (organization_id, integration_type)
);

CREATE INDEX idx_integration_credentials_org ON integration_credentials(organization_id);
CREATE INDEX idx_integration_credentials_type ON integration_credentials(integration_type);

-- ============================================================================
-- TABLE: integration_sync_logs (Track sync history and errors)
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_credential_id UUID REFERENCES integration_credentials(id) ON DELETE CASCADE,

  -- Sync Details
  sync_type TEXT NOT NULL, -- 'manual', 'scheduled', 'webhook'
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'success', 'failed')),

  -- Statistics
  records_processed INT DEFAULT 0,
  records_created INT DEFAULT 0,
  records_updated INT DEFAULT 0,
  records_failed INT DEFAULT 0,

  -- Error Information
  error_message TEXT,
  error_details JSONB,

  -- Metadata
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INT
);

CREATE INDEX idx_integration_sync_logs_credential ON integration_sync_logs(integration_credential_id);
CREATE INDEX idx_integration_sync_logs_org ON integration_sync_logs(organization_id);
CREATE INDEX idx_integration_sync_logs_status ON integration_sync_logs(status);
CREATE INDEX idx_integration_sync_logs_started ON integration_sync_logs(started_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all contact tables
ALTER TABLE contact_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Organizations can only see their own data
CREATE POLICY "org_isolation_stages" ON contact_stages
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE individual_id = auth.uid()
  ));

CREATE POLICY "org_isolation_channels" ON traffic_channels
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE individual_id = auth.uid()
  ));

CREATE POLICY "org_isolation_contacts" ON contacts
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE individual_id = auth.uid()
  ));

CREATE POLICY "org_isolation_contact_stage_history" ON contact_stage_history
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE individual_id = auth.uid()
  ));

CREATE POLICY "org_isolation_integration_credentials" ON integration_credentials
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE role_code IN ('owner', 'admin')
    AND individual_id = auth.uid()
  ));

CREATE POLICY "org_isolation_integration_sync_logs" ON integration_sync_logs
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE individual_id = auth.uid()
  ));

-- ============================================================================
-- DEFAULT DATA (SEED)
-- ============================================================================

-- Note: Seed data should be inserted per organization based on configuration
-- This will be handled by the backend during organization creation

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate stage transition duration
CREATE OR REPLACE FUNCTION calculate_stage_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.to_stage_id IS NOT NULL AND NEW.from_stage_id IS NOT NULL THEN
    NEW.days_in_stage := EXTRACT(DAY FROM NOW() - (
      SELECT created_at FROM contact_stage_history
      WHERE contact_id = NEW.contact_id
      AND to_stage_id = NEW.from_stage_id
      ORDER BY created_at DESC
      LIMIT 1
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_stage_duration
BEFORE INSERT ON contact_stage_history
FOR EACH ROW
EXECUTE FUNCTION calculate_stage_duration();

-- Function to update contact updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_timestamp
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION update_contact_timestamp();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- All tables, indexes, policies, and functions have been created
-- The database is now ready for the Contact Management application
