-- ============================================================================
-- SALES MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0.0
-- Created: 2025-11-22
-- Purpose: Complete database schema for Sales Management (销售管理) system
--
-- This file contains all tables, constraints, indexes, and triggers needed
-- for the Sales Management feature. Execute this entire file on a fresh
-- database to set up the complete system.
-- ============================================================================

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- 1. Sales Order Settings Table
-- Organization-level configuration for sales order behavior
CREATE TABLE IF NOT EXISTS sales_order_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Running Number Configuration
  order_code_format TEXT NOT NULL DEFAULT 'SO-{YYMM}-{5digits}',
  -- Format tokens: {YYYY}, {YY}, {MM}, {DD}, {Xdigits} where X is 1-10
  -- Examples:
  --   'SO-{YYMM}-{5digits}' -> SO-2512-00001
  --   'INV-{YYYY}-{6digits}' -> INV-2025-000001
  --   '{YY}{MM}{DD}-{4digits}' -> 251222-0001
  next_order_number INTEGER NOT NULL DEFAULT 1,
  -- Auto-increment counter, resets based on format (monthly, yearly, or never)
  reset_period TEXT NOT NULL DEFAULT 'monthly' CHECK (reset_period IN ('never', 'daily', 'monthly', 'yearly')),
  last_order_date DATE,
  -- Track last order date to determine if counter should reset

  -- Tax Configuration
  default_tax_rate NUMERIC(5,2) DEFAULT 0.00,
  tax_inclusive BOOLEAN DEFAULT FALSE,

  -- Visibility & Permission Settings
  sales_order_visibility TEXT NOT NULL DEFAULT 'organization' CHECK (
    sales_order_visibility IN ('organization', 'assigned_only', 'team_based')
  ),
  -- 'organization' = Everyone can view all orders
  -- 'assigned_only' = Sales person can only view their assigned orders
  -- 'team_based' = Sales person + their team lead can view

  -- Team Structure Settings
  enable_sales_teams BOOLEAN DEFAULT FALSE,
  -- When true, sales persons can be organized into teams with team leads

  -- Future Integration Flags (for accounting software sync)
  integration_enabled BOOLEAN DEFAULT FALSE,
  integration_source TEXT,  -- 'sql_accounting', 'autocount', 'xero', etc.
  integration_config JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One settings record per organization
  UNIQUE(organization_id)
);

-- 2. Sales Teams Table
-- Organize sales persons into teams with team leads
CREATE TABLE IF NOT EXISTS sales_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Team information
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',

  -- Team lead
  team_lead_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  UNIQUE(organization_id, name)
);

-- 3. Sales Team Members Table
-- Many-to-many relationship between teams and individuals
CREATE TABLE IF NOT EXISTS sales_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_team_id UUID NOT NULL REFERENCES sales_teams(id) ON DELETE CASCADE,
  individual_id UUID NOT NULL REFERENCES individuals(id) ON DELETE CASCADE,

  -- Member role in team (for display purposes)
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'lead')),

  -- Audit fields
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(sales_team_id, individual_id)
);

-- 4. Sales Orders Table
-- Main sales order headers
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Order Identification
  order_code TEXT NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Customer & Sales Person
  customer_contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  sales_person_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')
  ),

  -- Financial Calculations
  subtotal NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  tax_rate NUMERIC(5,2) DEFAULT 0.00,
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(18,2) NOT NULL DEFAULT 0.00,

  -- Additional Information
  notes TEXT,

  -- Soft Delete
  is_deleted BOOLEAN DEFAULT FALSE,

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  updated_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,
  confirmed_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Constraints
  UNIQUE(organization_id, order_code)
);

-- 5. Sales Order Items Table
-- Line items for each sales order
CREATE TABLE IF NOT EXISTS sales_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inventory_products(id) ON DELETE RESTRICT,

  -- Order Details
  quantity NUMERIC(18,3) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(18,2) NOT NULL CHECK (unit_price >= 0),
  discount_percent NUMERIC(5,2) DEFAULT 0.00 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  subtotal NUMERIC(18,2) GENERATED ALWAYS AS (quantity * unit_price - discount_amount) STORED,

  -- Additional Information
  notes TEXT,
  line_order INTEGER DEFAULT 0,
  -- For maintaining order of items in UI

  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Sales Order Settings indexes
CREATE INDEX IF NOT EXISTS idx_sales_order_settings_org ON sales_order_settings(organization_id);

-- Sales Teams indexes
CREATE INDEX IF NOT EXISTS idx_sales_teams_org ON sales_teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_teams_lead ON sales_teams(team_lead_individual_id);
CREATE INDEX IF NOT EXISTS idx_sales_teams_active ON sales_teams(organization_id, is_active) WHERE is_active = TRUE;

-- Sales Team Members indexes
CREATE INDEX IF NOT EXISTS idx_sales_team_members_team ON sales_team_members(sales_team_id);
CREATE INDEX IF NOT EXISTS idx_sales_team_members_individual ON sales_team_members(individual_id);

-- Sales Orders indexes
CREATE INDEX IF NOT EXISTS idx_sales_orders_org ON sales_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_contact_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_sales_person ON sales_orders(sales_person_individual_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(organization_id, status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON sales_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_orders_deleted ON sales_orders(is_deleted);
CREATE INDEX IF NOT EXISTS idx_sales_orders_code ON sales_orders(organization_id, order_code);

-- Sales Order Items indexes
CREATE INDEX IF NOT EXISTS idx_sales_order_items_order ON sales_order_items(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product ON sales_order_items(product_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE sales_order_settings IS 'Organization-level configuration for sales order module (running numbers, visibility, teams)';
COMMENT ON TABLE sales_teams IS 'Sales team structure with team leads for hierarchical visibility';
COMMENT ON TABLE sales_team_members IS 'Many-to-many relationship between sales teams and individuals';
COMMENT ON TABLE sales_orders IS 'Sales order headers with customer, sales person, and financial totals';
COMMENT ON TABLE sales_order_items IS 'Line items for sales orders with product, quantity, price, and discount';

COMMENT ON COLUMN sales_order_settings.order_code_format IS 'Format template with tokens like SO-{YYMM}-{5digits}';
COMMENT ON COLUMN sales_order_settings.reset_period IS 'When to reset the order number counter (never, daily, monthly, yearly)';
COMMENT ON COLUMN sales_order_settings.sales_order_visibility IS 'Controls who can view sales orders (organization, assigned_only, team_based)';
COMMENT ON COLUMN sales_order_settings.enable_sales_teams IS 'Enable sales team structure with team leads';

COMMENT ON COLUMN sales_orders.order_code IS 'Unique order identifier generated from order_code_format';
COMMENT ON COLUMN sales_orders.status IS 'Order lifecycle: draft, confirmed, processing, shipped, delivered, cancelled';
COMMENT ON COLUMN sales_orders.customer_contact_id IS 'Reference to contacts table where contact_type = customer';

COMMENT ON COLUMN sales_order_items.discount_percent IS 'Percentage discount (0-100), used to calculate discount_amount';
COMMENT ON COLUMN sales_order_items.subtotal IS 'Auto-calculated as quantity * unit_price - discount_amount';
COMMENT ON COLUMN sales_order_items.line_order IS 'Display order in UI, allows users to reorder items';

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

-- Apply triggers to all tables
CREATE TRIGGER update_sales_order_settings_updated_at BEFORE UPDATE ON sales_order_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_teams_updated_at BEFORE UPDATE ON sales_teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON sales_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_order_items_updated_at BEFORE UPDATE ON sales_order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if order counter should reset
CREATE OR REPLACE FUNCTION should_reset_order_counter(
  p_reset_period TEXT,
  p_last_order_date DATE,
  p_current_date DATE
)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_reset_period = 'never' OR p_last_order_date IS NULL THEN
    RETURN FALSE;
  END IF;

  CASE p_reset_period
    WHEN 'daily' THEN
      RETURN p_last_order_date <> p_current_date;
    WHEN 'monthly' THEN
      RETURN EXTRACT(YEAR FROM p_last_order_date) <> EXTRACT(YEAR FROM p_current_date)
          OR EXTRACT(MONTH FROM p_last_order_date) <> EXTRACT(MONTH FROM p_current_date);
    WHEN 'yearly' THEN
      RETURN EXTRACT(YEAR FROM p_last_order_date) <> EXTRACT(YEAR FROM p_current_date);
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- DEFAULT DATA (OPTIONAL)
-- ============================================================================

-- Uncomment and customize these INSERTs for your organization
-- Replace 'your-organization-id' with actual UUID

/*
-- Default Sales Order Settings
INSERT INTO sales_order_settings (organization_id, order_code_format, reset_period, default_tax_rate)
VALUES (
  'your-organization-id',
  'SO-{YYMM}-{5digits}',
  'monthly',
  6.00  -- 6% SST for Malaysia
)
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
  AND table_name IN (
    'sales_order_settings',
    'sales_teams',
    'sales_team_members',
    'sales_orders',
    'sales_order_items'
  )
ORDER BY table_name;

-- 2. Check all indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN (
  'sales_order_settings',
  'sales_teams',
  'sales_team_members',
  'sales_orders',
  'sales_order_items'
)
ORDER BY tablename, indexname;

-- 3. Check all triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN (
  'sales_order_settings',
  'sales_teams',
  'sales_orders',
  'sales_order_items'
)
ORDER BY event_object_table, trigger_name;

-- 4. Check helper function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'should_reset_order_counter';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
