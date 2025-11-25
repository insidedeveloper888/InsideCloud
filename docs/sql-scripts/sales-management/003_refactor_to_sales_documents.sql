-- ============================================================================
-- Migration 003: Refactor to Generalized Sales Document Management
-- ============================================================================
-- This migration:
-- 1. Migrates data from sales_order_settings → sales_document_settings
-- 2. Migrates data from sales_order_status_config → sales_document_status_config
-- 3. Drops old tables
-- 4. Creates new quotations tables
-- 5. Sets up default configurations
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Create new generalized tables
-- ----------------------------------------------------------------------------

-- Sales Document Settings (generalized from sales_order_settings)
CREATE TABLE IF NOT EXISTS public.sales_document_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Document type: 'quotation', 'sales_order', 'invoice', 'delivery_order'
    document_type TEXT NOT NULL,

    -- Running number configuration (per document type)
    order_code_format TEXT DEFAULT 'SO-{YYMM}-{5digits}',
    reset_period TEXT DEFAULT 'monthly', -- 'never', 'daily', 'monthly', 'yearly'
    current_counter INTEGER DEFAULT 0,
    last_reset_date DATE,

    -- Default settings
    default_tax_rate DECIMAL(5,2) DEFAULT 0,

    -- Visibility & access control
    sales_order_visibility TEXT DEFAULT 'organization', -- 'organization', 'assigned_only', 'team_based'
    enable_sales_teams BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one settings record per organization per document type
    UNIQUE(organization_id, document_type)
);

CREATE INDEX idx_sales_document_settings_org ON public.sales_document_settings(organization_id);
CREATE INDEX idx_sales_document_settings_type ON public.sales_document_settings(document_type);


-- Sales Document Status Config (generalized from sales_order_status_config)
CREATE TABLE IF NOT EXISTS public.sales_document_status_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Document type: 'quotation', 'sales_order', 'invoice', 'delivery_order'
    document_type TEXT NOT NULL,

    -- Status configuration
    status_key TEXT NOT NULL, -- e.g., 'draft', 'confirmed', 'delivered'
    status_label TEXT NOT NULL, -- e.g., 'Draft', 'Confirmed', 'Delivered'
    status_color TEXT DEFAULT '#3B82F6', -- Hex color

    -- Semantic flags (meaning varies by document type)
    is_completed_status BOOLEAN DEFAULT FALSE, -- For revenue calculation

    -- Ordering
    sort_order INTEGER DEFAULT 0,

    -- Soft delete
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure unique status keys per organization per document type
    UNIQUE(organization_id, document_type, status_key)
);

CREATE INDEX idx_sales_doc_status_org ON public.sales_document_status_config(organization_id);
CREATE INDEX idx_sales_doc_status_type ON public.sales_document_status_config(document_type);
CREATE INDEX idx_sales_doc_status_active ON public.sales_document_status_config(is_active) WHERE is_active = true;


-- ----------------------------------------------------------------------------
-- STEP 2: Migrate existing data
-- ----------------------------------------------------------------------------

-- Migrate sales_order_settings → sales_document_settings (with document_type = 'sales_order')
INSERT INTO public.sales_document_settings (
    organization_id,
    document_type,
    order_code_format,
    reset_period,
    current_counter,
    last_reset_date,
    default_tax_rate,
    sales_order_visibility,
    enable_sales_teams,
    created_at,
    updated_at
)
SELECT
    organization_id,
    'sales_order' AS document_type,
    order_code_format,
    reset_period,
    current_counter,
    last_reset_date,
    default_tax_rate,
    sales_order_visibility,
    enable_sales_teams,
    created_at,
    updated_at
FROM public.sales_order_settings
ON CONFLICT (organization_id, document_type) DO NOTHING;


-- Migrate sales_order_status_config → sales_document_status_config (with document_type = 'sales_order')
INSERT INTO public.sales_document_status_config (
    organization_id,
    document_type,
    status_key,
    status_label,
    status_color,
    is_completed_status,
    sort_order,
    is_active,
    created_at,
    updated_at
)
SELECT
    organization_id,
    'sales_order' AS document_type,
    status_key,
    status_label,
    status_color,
    is_completed_status,
    sort_order,
    is_active,
    created_at,
    updated_at
FROM public.sales_order_status_config
ON CONFLICT (organization_id, document_type, status_key) DO NOTHING;


-- ----------------------------------------------------------------------------
-- STEP 3: Drop old tables (safe because we migrated data above)
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS public.sales_order_status_config CASCADE;
DROP TABLE IF EXISTS public.sales_order_settings CASCADE;


-- ----------------------------------------------------------------------------
-- STEP 4: Create Quotations tables
-- ----------------------------------------------------------------------------

-- Sales Quotations
CREATE TABLE IF NOT EXISTS public.sales_quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Quotation info
    quotation_code TEXT NOT NULL, -- Generated: QT-2511-00001
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE, -- Quotation expiry

    -- Customer & sales person
    customer_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    sales_person_individual_id UUID REFERENCES public.individuals(id) ON DELETE SET NULL,

    -- Status (links to sales_document_status_config where document_type='quotation')
    status TEXT DEFAULT 'draft',

    -- Amounts
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,

    -- Notes
    notes TEXT,
    terms_and_conditions TEXT,

    -- Conversion tracking
    converted_to_sales_order_id UUID REFERENCES public.sales_orders(id) ON DELETE SET NULL,
    converted_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.individuals(id) ON DELETE SET NULL,

    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,

    -- Ensure unique quotation codes per organization
    UNIQUE(organization_id, quotation_code)
);

CREATE INDEX idx_sales_quotations_org ON public.sales_quotations(organization_id);
CREATE INDEX idx_sales_quotations_customer ON public.sales_quotations(customer_contact_id);
CREATE INDEX idx_sales_quotations_sales_person ON public.sales_quotations(sales_person_individual_id);
CREATE INDEX idx_sales_quotations_status ON public.sales_quotations(status);
CREATE INDEX idx_sales_quotations_date ON public.sales_quotations(quotation_date DESC);
CREATE INDEX idx_sales_quotations_deleted ON public.sales_quotations(is_deleted) WHERE is_deleted = false;


-- Sales Quotation Items
CREATE TABLE IF NOT EXISTS public.sales_quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_quotation_id UUID NOT NULL REFERENCES public.sales_quotations(id) ON DELETE CASCADE,

    -- Product reference
    product_id UUID REFERENCES public.inventory_products(id) ON DELETE SET NULL,

    -- Item details
    sku TEXT,
    product_name TEXT NOT NULL,
    description TEXT,

    -- Quantity & pricing
    quantity DECIMAL(15,3) NOT NULL DEFAULT 1,
    unit TEXT,
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    tax_percentage DECIMAL(5,2) DEFAULT 0,

    -- Calculated
    line_total DECIMAL(15,2) NOT NULL DEFAULT 0, -- (quantity * unit_price * (1 - discount/100) * (1 + tax/100))

    -- Ordering
    line_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_quotation_items_quotation ON public.sales_quotation_items(sales_quotation_id);
CREATE INDEX idx_sales_quotation_items_product ON public.sales_quotation_items(product_id);


-- ----------------------------------------------------------------------------
-- STEP 5: Set up default quotation statuses for all existing organizations
-- ----------------------------------------------------------------------------

-- Insert default quotation statuses for each organization that has sales orders
INSERT INTO public.sales_document_status_config (
    organization_id,
    document_type,
    status_key,
    status_label,
    status_color,
    is_completed_status,
    sort_order,
    is_active
)
SELECT DISTINCT
    organization_id,
    'quotation' AS document_type,
    status_key,
    status_label,
    status_color,
    CASE
        WHEN status_key = 'accepted' THEN true
        ELSE false
    END AS is_completed_status,
    sort_order,
    true AS is_active
FROM (
    SELECT DISTINCT organization_id FROM public.sales_document_settings WHERE document_type = 'sales_order'
) orgs
CROSS JOIN (
    VALUES
        ('draft', 'Draft', '#6B7280', 0),
        ('sent', 'Sent', '#3B82F6', 1),
        ('accepted', 'Accepted', '#10B981', 2),
        ('rejected', 'Rejected', '#EF4444', 3),
        ('expired', 'Expired', '#9CA3AF', 4)
) AS statuses(status_key, status_label, status_color, sort_order)
ON CONFLICT (organization_id, document_type, status_key) DO NOTHING;


-- Insert default quotation settings for each organization that has sales orders
INSERT INTO public.sales_document_settings (
    organization_id,
    document_type,
    order_code_format,
    reset_period,
    current_counter,
    default_tax_rate,
    sales_order_visibility,
    enable_sales_teams
)
SELECT DISTINCT
    organization_id,
    'quotation' AS document_type,
    'QT-{YYMM}-{5digits}' AS order_code_format,
    'monthly' AS reset_period,
    0 AS current_counter,
    default_tax_rate,
    sales_order_visibility,
    enable_sales_teams
FROM public.sales_document_settings
WHERE document_type = 'sales_order'
ON CONFLICT (organization_id, document_type) DO NOTHING;


-- ============================================================================
-- Migration Complete!
-- ============================================================================
-- ✅ Old tables removed: sales_order_settings, sales_order_status_config
-- ✅ New tables created: sales_document_settings, sales_document_status_config
-- ✅ Data migrated for existing sales orders
-- ✅ Quotations tables created: sales_quotations, sales_quotation_items
-- ✅ Default quotation statuses & settings created for all organizations
-- ============================================================================
