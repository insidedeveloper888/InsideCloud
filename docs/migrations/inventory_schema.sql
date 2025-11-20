-- ============================================================================
-- InsideCloud Inventory Management Schema
-- ============================================================================
-- This migration adds inventory management tables to InsideCloud Supabase
--
-- Tables Created:
--   - inventory_products: Product master data (SKU, name, category)
--   - inventory_locations: Warehouses/storage locations
--   - inventory_stock_items: Actual stock quantities per location
--   - inventory_stock_movements: IN/OUT/Adjustment history
--   - inventory_suppliers: Supplier master data
--   - inventory_supplier_prices: Supplier price history
--   - inventory_purchase_orders: Purchase order headers
--   - inventory_purchase_order_items: Purchase order line items
--
-- Multi-Tenant: All tables have organization_id for tenant isolation
-- ============================================================================

-- ============================================================================
-- 1. PRODUCTS: Master product catalog
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Product identification
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,           -- CCTV, Lighting, AV系统, 门窗电机, etc.
  unit TEXT,               -- pcs, meters, kg, box, etc.
  description TEXT,
  active BOOLEAN DEFAULT TRUE,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Constraints
  UNIQUE (organization_id, sku)  -- SKU unique within organization
);

-- ============================================================================
-- 2. LOCATIONS: Warehouses and storage locations
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Location details
  name TEXT NOT NULL,      -- "主仓库A", "Site Storage", "Truck 01"
  code TEXT,               -- "MAIN", "SITE-01", "TRUCK-01"
  address TEXT,
  active BOOLEAN DEFAULT TRUE,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Constraints
  UNIQUE (organization_id, code)  -- Code unique within organization
);

-- ============================================================================
-- 3. STOCK ITEMS: Actual inventory quantities per location
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
  location_id UUID REFERENCES inventory_locations(id) ON DELETE SET NULL,

  -- Quantity tracking
  quantity NUMERIC(18,3) NOT NULL DEFAULT 0,
  reserved_quantity NUMERIC(18,3) NOT NULL DEFAULT 0,  -- Reserved for projects/orders
  available_quantity NUMERIC(18,3) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,

  -- Costing
  average_cost NUMERIC(18,2) NOT NULL DEFAULT 0,  -- Weighted average unit cost

  -- Alerts
  low_stock_threshold NUMERIC(18,3) DEFAULT 5,    -- Alert when available < threshold

  -- Scanning
  qr_code TEXT,            -- QR code for mobile scanning

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE (organization_id, product_id, location_id),  -- One stock record per product+location
  CONSTRAINT check_reserved_not_exceed_quantity CHECK (reserved_quantity <= quantity)
);

-- ============================================================================
-- 4. STOCK MOVEMENTS: Transaction history (IN/OUT/Adjustment)
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,
  location_id UUID REFERENCES inventory_locations(id) ON DELETE SET NULL,

  -- Movement details
  movement_type TEXT NOT NULL CHECK (movement_type IN ('stock_in', 'stock_out', 'adjustment')),
  quantity NUMERIC(18,3) NOT NULL,
  unit_cost NUMERIC(18,2) DEFAULT 0,
  total_cost NUMERIC(18,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,

  -- Optional linkage
  project_id UUID,         -- Link to project (if exists)
  reference_type TEXT,     -- "purchase_order", "sales_order", "manual", "return"
  reference_id UUID,       -- ID of the reference document

  -- Additional info
  notes TEXT,
  scan_code TEXT,          -- Scanned QR/barcode

  -- Timing
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL
);

-- ============================================================================
-- 5. SUPPLIERS: Vendor/supplier master data
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Supplier details
  name TEXT NOT NULL,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  active BOOLEAN DEFAULT TRUE,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL
);

-- ============================================================================
-- 6. SUPPLIER PRICES: Historical pricing from suppliers
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_supplier_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES inventory_suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,

  -- Pricing
  unit_cost NUMERIC(18,2) NOT NULL,
  currency TEXT DEFAULT 'MYR',

  -- Validity period
  valid_from DATE,
  valid_to DATE,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Constraints
  UNIQUE (organization_id, supplier_id, product_id, valid_from)
);

-- ============================================================================
-- 7. PURCHASE ORDERS: PO headers
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- PO identification
  code TEXT NOT NULL,      -- "PO-2025-001"
  supplier_id UUID NOT NULL REFERENCES inventory_suppliers(id) ON DELETE CASCADE,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'approved', 'ordered', 'partially_received', 'received', 'cancelled')
  ),

  -- Financial
  total_amount NUMERIC(18,2) DEFAULT 0,

  -- Lifecycle tracking
  created_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  approved_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  ordered_at TIMESTAMPTZ,
  expected_delivery_date TIMESTAMPTZ,
  received_at TIMESTAMPTZ,

  -- Additional info
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE (organization_id, code)  -- PO code unique within organization
);

-- ============================================================================
-- 8. PURCHASE ORDER ITEMS: PO line items
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES inventory_purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inventory_products(id) ON DELETE CASCADE,

  -- Order details
  quantity NUMERIC(18,3) NOT NULL,
  unit_cost NUMERIC(18,2) NOT NULL,
  subtotal NUMERIC(18,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,

  -- Receiving tracking
  received_quantity NUMERIC(18,3) DEFAULT 0,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES: For performance optimization
-- ============================================================================

-- Products
CREATE INDEX IF NOT EXISTS idx_inventory_products_org
  ON inventory_products(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_products_sku
  ON inventory_products(organization_id, sku);
CREATE INDEX IF NOT EXISTS idx_inventory_products_category
  ON inventory_products(organization_id, category);

-- Stock Items
CREATE INDEX IF NOT EXISTS idx_inventory_stock_items_org
  ON inventory_stock_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_items_product
  ON inventory_stock_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_items_location
  ON inventory_stock_items(location_id);

-- Stock Movements
CREATE INDEX IF NOT EXISTS idx_inventory_stock_movements_org
  ON inventory_stock_movements(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_movements_product
  ON inventory_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_movements_occurred
  ON inventory_stock_movements(occurred_at DESC);

-- Purchase Orders
CREATE INDEX IF NOT EXISTS idx_inventory_purchase_orders_org
  ON inventory_purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_purchase_orders_supplier
  ON inventory_purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_purchase_orders_status
  ON inventory_purchase_orders(organization_id, status);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'Inventory schema created successfully! 🎉' AS result;
SELECT 'Tables created:' AS info;
SELECT '  - inventory_products' AS tables UNION ALL
SELECT '  - inventory_locations' UNION ALL
SELECT '  - inventory_stock_items' UNION ALL
SELECT '  - inventory_stock_movements' UNION ALL
SELECT '  - inventory_suppliers' UNION ALL
SELECT '  - inventory_supplier_prices' UNION ALL
SELECT '  - inventory_purchase_orders' UNION ALL
SELECT '  - inventory_purchase_order_items';

-- ============================================================================
-- OPTIONAL: Insert sample data for testing
-- ============================================================================
-- Uncomment below to insert sample data after running the schema

/*
-- Get your organization ID first
-- SELECT id, slug FROM organizations;

-- Then insert sample location
INSERT INTO inventory_locations (organization_id, name, code)
VALUES (
  (SELECT id FROM organizations WHERE slug = 'your-org-slug' LIMIT 1),
  '主仓库',
  'MAIN'
) ON CONFLICT (organization_id, code) DO NOTHING;

-- Insert sample supplier
INSERT INTO inventory_suppliers (organization_id, name, contact_email)
VALUES (
  (SELECT id FROM organizations WHERE slug = 'your-org-slug' LIMIT 1),
  '安防科技有限公司',
  'contact@security-tech.com'
) ON CONFLICT DO NOTHING;

SELECT 'Sample data inserted!' AS result;
*/
