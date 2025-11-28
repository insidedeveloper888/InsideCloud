# Database Schema Pattern (Multi-Tenant)

> **Critical**: EVERY new table MUST follow this pattern

---

## 🚫 NEVER VIOLATE: Multi-Tenant Schema Rules

### Rule 1: ALWAYS Include organization_id

```sql
CREATE TABLE your_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,  -- ⚠️ REQUIRED
  -- ... other fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Missing `organization_id` = Security vulnerability**

---

### Rule 2: ALWAYS Add Composite Unique Constraints

```sql
-- Example: Each organization can have unique item codes
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,

  -- ⚠️ CRITICAL: Unique per organization, not globally
  CONSTRAINT products_code_unique_per_org UNIQUE (organization_id, code)
);
```

**Why**: Prevent conflicts between organizations using same codes.

---

### Rule 3: ALWAYS Add Indexes

```sql
-- Minimum required indexes
CREATE INDEX idx_your_table_org ON your_table(organization_id);
CREATE INDEX idx_your_table_created ON your_table(created_at);

-- Add more for frequently queried fields
CREATE INDEX idx_products_code ON products(organization_id, code);  -- Composite index
CREATE INDEX idx_products_name ON products(organization_id, name) WHERE is_deleted = false;  -- Partial index
```

**Why**: Queries filtering by organization_id must be fast.

---

## 📋 Complete Table Template

```sql
-- ================================================================
-- Table: your_table_name
-- Purpose: [Brief description]
-- Multi-Tenant: YES (filtered by organization_id)
-- ================================================================

CREATE TABLE your_table_name (
  -- ===== Primary Key =====
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ===== Multi-Tenant =====
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- ===== Core Fields =====
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',

  -- ===== Audit Fields =====
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),

  -- ===== Constraints =====
  CONSTRAINT your_table_name_status_check CHECK (status IN ('active', 'inactive', 'archived')),
  CONSTRAINT your_table_unique_per_org UNIQUE (organization_id, name)
);

-- ===== Indexes =====
CREATE INDEX idx_your_table_org ON your_table_name(organization_id);
CREATE INDEX idx_your_table_created ON your_table_name(created_at DESC);
CREATE INDEX idx_your_table_status ON your_table_name(organization_id, status) WHERE is_deleted = false;

-- ===== Triggers =====

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_your_table_updated_at
  BEFORE UPDATE ON your_table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===== Row-Level Security (RLS) =====
ALTER TABLE your_table_name ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their organization's data
CREATE POLICY tenant_isolation ON your_table_name
  FOR ALL
  USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );

-- Policy: Service role can access all (for backend operations)
CREATE POLICY service_role_all ON your_table_name
  FOR ALL
  USING (auth.role() = 'service_role');

-- ===== Comments =====
COMMENT ON TABLE your_table_name IS 'Multi-tenant table for [purpose]';
COMMENT ON COLUMN your_table_name.organization_id IS 'FK to organizations - REQUIRED for all queries';
COMMENT ON COLUMN your_table_name.status IS 'active | inactive | archived';

-- ===== Grants =====
GRANT SELECT, INSERT, UPDATE, DELETE ON your_table_name TO authenticated;
GRANT SELECT ON your_table_name TO anon;
```

---

## 🔗 Relationship Tables (Many-to-Many)

```sql
-- Example: Projects ↔ Team Members (many-to-many)
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,  -- ⚠️ REQUIRED
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  individual_id UUID NOT NULL REFERENCES individuals(id) ON DELETE CASCADE,
  role_code VARCHAR(50) NOT NULL,  -- 'manager', 'member', 'viewer'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- ===== Constraints =====
  CONSTRAINT project_members_unique UNIQUE (organization_id, project_id, individual_id),
  CONSTRAINT project_members_role_check CHECK (role_code IN ('manager', 'member', 'viewer'))
);

-- ===== Indexes =====
CREATE INDEX idx_project_members_org ON project_members(organization_id);
CREATE INDEX idx_project_members_project ON project_members(organization_id, project_id);
CREATE INDEX idx_project_members_individual ON project_members(organization_id, individual_id);

-- ===== RLS =====
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON project_members
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);
```

---

## 📝 Settings Tables (One per Organization)

```sql
-- Example: Sales Management Settings
CREATE TABLE sales_order_settings (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,  -- ⚠️ Primary Key!

  -- Running number format
  code_format VARCHAR(100) DEFAULT 'SO-{YYMM}-{5digits}',
  next_number INTEGER DEFAULT 1,

  -- Default values
  default_status VARCHAR(50) DEFAULT 'draft',
  default_currency VARCHAR(3) DEFAULT 'MYR',

  -- Visibility
  visibility_mode VARCHAR(50) DEFAULT 'organization',  -- 'organization' | 'assigned_only' | 'team_based'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== Indexes =====
-- No additional index needed (organization_id is PK)

-- ===== Triggers =====
CREATE TRIGGER trigger_sales_settings_updated
  BEFORE UPDATE ON sales_order_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===== RLS =====
ALTER TABLE sales_order_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON sales_order_settings
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

-- ===== Default Row Insertion =====
-- Create trigger to auto-create settings row when new organization created
CREATE OR REPLACE FUNCTION create_default_sales_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO sales_order_settings (organization_id)
  VALUES (NEW.id)
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_sales_settings
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_default_sales_settings();
```

---

## 🔄 Audit/History Tables

```sql
-- Example: Track changes to critical tables
CREATE TABLE audit_sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),  -- ⚠️ REQUIRED

  -- Reference to original record
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id),

  -- What changed
  action VARCHAR(20) NOT NULL,  -- 'INSERT', 'UPDATE', 'DELETE'
  changed_fields JSONB,  -- {"total_amount": {"old": 1000, "new": 1200}}
  old_data JSONB,  -- Complete snapshot before change
  new_data JSONB,  -- Complete snapshot after change

  -- Who & When
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id),

  CONSTRAINT audit_action_check CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- ===== Indexes =====
CREATE INDEX idx_audit_sales_org ON audit_sales_orders(organization_id);
CREATE INDEX idx_audit_sales_order ON audit_sales_orders(sales_order_id);
CREATE INDEX idx_audit_sales_changed_at ON audit_sales_orders(changed_at DESC);

-- ===== Trigger to Auto-Populate =====
CREATE OR REPLACE FUNCTION audit_sales_order_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_sales_orders (organization_id, sales_order_id, action, new_data, changed_by)
    VALUES (NEW.organization_id, NEW.id, 'INSERT', row_to_json(NEW), NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_sales_orders (organization_id, sales_order_id, action, old_data, new_data, changed_fields, changed_by)
    VALUES (
      NEW.organization_id,
      NEW.id,
      'UPDATE',
      row_to_json(OLD),
      row_to_json(NEW),
      jsonb_diff(row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb),  -- Custom function
      NEW.updated_by
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_sales_orders (organization_id, sales_order_id, action, old_data, changed_by)
    VALUES (OLD.organization_id, OLD.id, 'DELETE', row_to_json(OLD), OLD.deleted_by);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_sales_orders
  AFTER INSERT OR UPDATE OR DELETE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION audit_sales_order_changes();
```

---

## 🧪 Migration File Template

```sql
-- Migration: [YYYYMMDDHHMMSS]_create_your_table.sql
-- Description: Add [feature name] table
-- Author: [Your Name]
-- Date: [YYYY-MM-DD]

-- ================================================================
-- 1. Create Table
-- ================================================================

CREATE TABLE IF NOT EXISTS your_table (
  -- [Copy from Complete Table Template above]
);

-- ================================================================
-- 2. Create Indexes
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_your_table_org ON your_table(organization_id);
-- [Add more indexes]

-- ================================================================
-- 3. Create Triggers
-- ================================================================

-- [Add triggers if needed]

-- ================================================================
-- 4. Enable RLS
-- ================================================================

ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON your_table
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

CREATE POLICY service_role_all ON your_table
  FOR ALL
  USING (auth.role() = 'service_role');

-- ================================================================
-- 5. Insert Default Data (Optional)
-- ================================================================

-- Example: Insert default settings for existing organizations
INSERT INTO your_settings_table (organization_id)
SELECT id FROM organizations
ON CONFLICT (organization_id) DO NOTHING;

-- ================================================================
-- 6. Grants
-- ================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON your_table TO authenticated;

-- ================================================================
-- 7. Rollback Script (for reference)
-- ================================================================

-- Uncomment below to rollback this migration:
-- DROP TABLE IF EXISTS your_table CASCADE;
```

---

## 🚨 Common Mistakes & Fixes

### ❌ Mistake 1: Forgot organization_id

```sql
-- BAD
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(255)
);
```

```sql
-- GOOD
CREATE TABLE products (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255)
);
```

---

### ❌ Mistake 2: Global Unique Constraint

```sql
-- BAD - Product code must be unique globally
CREATE TABLE products (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code VARCHAR(50) UNIQUE  -- ❌ Wrong!
);
-- Result: Org A uses code "PROD-001", Org B cannot use same code
```

```sql
-- GOOD - Product code unique per organization
CREATE TABLE products (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code VARCHAR(50) NOT NULL,
  CONSTRAINT products_code_unique_per_org UNIQUE (organization_id, code)
);
-- Result: Both Org A and Org B can use "PROD-001"
```

---

### ❌ Mistake 3: Missing ON DELETE CASCADE

```sql
-- BAD
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id)  -- Missing CASCADE
);
-- Result: Cannot delete organization if it has projects
```

```sql
-- GOOD
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);
-- Result: Deleting organization auto-deletes all its projects
```

---

### ❌ Mistake 4: No Indexes on organization_id

```sql
-- BAD
CREATE TABLE products (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255)
);
-- No index created!
-- Result: Slow queries when filtering by organization
```

```sql
-- GOOD
CREATE INDEX idx_products_org ON products(organization_id);
-- Result: Fast queries
```

---

## ✅ Validation Checklist

Before running migration, verify:

- [ ] Table has `organization_id UUID NOT NULL` field
- [ ] Foreign key has `ON DELETE CASCADE`
- [ ] Index created on `organization_id`
- [ ] Unique constraints are composite with `organization_id`
- [ ] RLS enabled with tenant_isolation policy
- [ ] Trigger for `updated_at` added (if needed)
- [ ] Migration file saved in `/docs/sql-scripts/{module}/`
- [ ] Tested with 2 organizations (no data leak)

---

## 📚 Related Documentation

- **Multi-Tenant Queries**: `/docs/patterns/multi-tenant-queries.md`
- **API Design**: `/docs/patterns/api-design.md`
- **Migration Guide**: `/docs/tasks/add-database-table.md` (TODO)

---

Last Updated: 2025-11-28
