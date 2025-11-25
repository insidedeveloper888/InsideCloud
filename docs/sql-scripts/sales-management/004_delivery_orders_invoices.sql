-- Migration 004: Delivery Orders, Invoices, and Payments
-- Description: Add delivery order and invoice management capabilities

-- ============================================================================
-- DELIVERY ORDERS
-- ============================================================================

-- Main delivery orders table
CREATE TABLE IF NOT EXISTS delivery_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Document identification
  delivery_order_code TEXT NOT NULL,
  delivery_date DATE NOT NULL,

  -- References
  sales_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
  customer_contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  sales_person_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Delivery information
  delivery_address TEXT,
  delivery_contact_name TEXT,
  delivery_contact_phone TEXT,
  shipping_method TEXT,
  tracking_number TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft',

  -- Notes
  notes TEXT,
  internal_notes TEXT,

  -- Flags
  is_deleted BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  updated_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  delivered_at TIMESTAMPTZ,
  delivered_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Constraints
  UNIQUE(organization_id, delivery_order_code)
);

-- Indexes for delivery_orders
CREATE INDEX IF NOT EXISTS idx_delivery_orders_org ON delivery_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_customer ON delivery_orders(customer_contact_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_sales_order ON delivery_orders(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON delivery_orders(status);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_date ON delivery_orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_sales_person ON delivery_orders(sales_person_individual_id);

-- Delivery order items
CREATE TABLE IF NOT EXISTS delivery_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_order_id UUID NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES inventory_products(id) ON DELETE RESTRICT,

  -- Quantities
  quantity NUMERIC(12, 3) NOT NULL,
  unit TEXT,

  -- Optional reference to sales order item
  sales_order_item_id UUID REFERENCES sales_order_items(id) ON DELETE SET NULL,

  -- Notes
  notes TEXT,

  -- Order
  line_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for delivery_order_items
CREATE INDEX IF NOT EXISTS idx_delivery_order_items_do ON delivery_order_items(delivery_order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_order_items_product ON delivery_order_items(product_id);

-- ============================================================================
-- INVOICES
-- ============================================================================

-- Main invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Document identification
  invoice_code TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,

  -- References
  sales_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
  delivery_order_id UUID REFERENCES delivery_orders(id) ON DELETE SET NULL,
  customer_contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  sales_person_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft',

  -- Financial details
  subtotal NUMERIC(15, 2) DEFAULT 0,
  tax_rate NUMERIC(5, 2) DEFAULT 0,
  tax_amount NUMERIC(15, 2) DEFAULT 0,
  discount_amount NUMERIC(15, 2) DEFAULT 0,
  total_amount NUMERIC(15, 2) DEFAULT 0,
  amount_paid NUMERIC(15, 2) DEFAULT 0,
  amount_due NUMERIC(15, 2) DEFAULT 0,

  -- Payment terms
  payment_terms TEXT,

  -- Notes
  notes TEXT,
  terms_and_conditions TEXT,

  -- Flags
  is_deleted BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  updated_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(organization_id, invoice_code)
);

-- Indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_contact_id);
CREATE INDEX IF NOT EXISTS idx_invoices_sales_order ON invoices(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_delivery_order ON invoices(delivery_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_sales_person ON invoices(sales_person_individual_id);

-- Invoice items
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES inventory_products(id) ON DELETE RESTRICT,

  -- Quantities and pricing
  quantity NUMERIC(12, 3) NOT NULL,
  unit TEXT,
  unit_price NUMERIC(15, 2) NOT NULL,
  discount_percent NUMERIC(5, 2) DEFAULT 0,
  discount_amount NUMERIC(15, 2) DEFAULT 0,
  subtotal NUMERIC(15, 2) NOT NULL,

  -- Optional references
  sales_order_item_id UUID REFERENCES sales_order_items(id) ON DELETE SET NULL,
  delivery_order_item_id UUID REFERENCES delivery_order_items(id) ON DELETE SET NULL,

  -- Notes
  notes TEXT,

  -- Order
  line_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for invoice_items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON invoice_items(product_id);

-- Invoice payments
CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Payment details
  payment_date DATE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  payment_method TEXT,
  reference_number TEXT,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL
);

-- Indexes for invoice_payments
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_org ON invoice_payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_date ON invoice_payments(payment_date);

-- ============================================================================
-- EXTEND SETTINGS TABLE
-- ============================================================================

-- Insert default settings for delivery orders
INSERT INTO sales_document_settings (organization_id, document_type, order_code_format, reset_period, current_counter, default_tax_rate, sales_order_visibility, enable_sales_teams)
SELECT
  id as organization_id,
  'delivery_order' as document_type,
  'DO-{YYMM}-{5digits}' as order_code_format,
  'monthly' as reset_period,
  0 as current_counter,
  0.0 as default_tax_rate,
  'organization' as sales_order_visibility,
  false as enable_sales_teams
FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM sales_document_settings
  WHERE organization_id = organizations.id
  AND document_type = 'delivery_order'
);

-- Insert default settings for invoices
INSERT INTO sales_document_settings (organization_id, document_type, order_code_format, reset_period, current_counter, default_tax_rate, sales_order_visibility, enable_sales_teams)
SELECT
  id as organization_id,
  'invoice' as document_type,
  'INV-{YYMM}-{5digits}' as order_code_format,
  'monthly' as reset_period,
  0 as current_counter,
  0.0 as default_tax_rate,
  'organization' as sales_order_visibility,
  false as enable_sales_teams
FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM sales_document_settings
  WHERE organization_id = organizations.id
  AND document_type = 'invoice'
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE delivery_orders IS 'Delivery orders tracking shipments to customers';
COMMENT ON TABLE delivery_order_items IS 'Line items for delivery orders';
COMMENT ON TABLE invoices IS 'Customer invoices with payment tracking';
COMMENT ON TABLE invoice_items IS 'Line items for invoices';
COMMENT ON TABLE invoice_payments IS 'Payment records for invoices';

COMMENT ON COLUMN delivery_orders.status IS 'Order status: draft, ready, in_transit, delivered, cancelled';
COMMENT ON COLUMN invoices.status IS 'Invoice status: draft, sent, partially_paid, paid, overdue, cancelled';
COMMENT ON COLUMN invoices.amount_due IS 'Calculated as total_amount - amount_paid';
