# Inventory Product Setup Guide

This guide explains how to add the Inventory Management product to `public.products` and enable it for all tenants.

## Quick Understanding

In your multi-tenant architecture:
- **`public.products`** - Contains all available products (Document Parser, Inventory, etc.)
- **`public.organization_product_access`** - Controls which organizations can access which products

## Setup Options

### Option 1: SQL Script (Recommended for Quick Setup)

**File:** [quick_enable_inventory_for_all.sql](quick_enable_inventory_for_all.sql)

1. Open Supabase SQL Editor
2. Copy entire script
3. Execute

```sql
-- Creates product + grants access to all orgs in one command
-- See file for complete SQL
```

**Result:**
- Product created/updated in `public.products`
- All organizations get access via `organization_product_access`
- Verification query shows all orgs with access

### Option 2: Detailed SQL with Options

**File:** [setup_inventory_product.sql](setup_inventory_product.sql)

More comprehensive with options for:
- Step-by-step setup with verification
- Enable for specific organization only
- Disable for specific organization
- Complete cleanup/removal

### Option 3: Node.js Script (Best for Automation)

**File:** [scripts/setup-inventory.js](../scripts/setup-inventory.js)

```bash
# Make sure you have .env with Supabase credentials
node scripts/setup-inventory.js
```

**Features:**
- ✅ Checks for existing product
- ✅ Updates if already exists, creates if new
- ✅ Only adds access for organizations that don't have it
- ✅ Detailed console output with emoji indicators
- ✅ Verification and summary

**Requirements:**
```env
# .env file
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Database Schema

### products Table
```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_key VARCHAR UNIQUE NOT NULL,  -- 'inventory'
  product_name VARCHAR NOT NULL,         -- 'Inventory Management'
  description TEXT,
  category VARCHAR,                       -- 'operations'
  icon VARCHAR,                           -- 'Package' (lucide-react)
  status VARCHAR,                         -- 'active', 'beta', 'coming_soon'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### organization_product_access Table
```sql
CREATE TABLE public.organization_product_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  product_id UUID REFERENCES public.products(id),
  is_enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(organization_id, product_id)
);
```

## Product Configuration

### Inventory Product Details
```javascript
{
  product_key: 'inventory',
  product_name: 'Inventory Management',
  description: 'Complete inventory management system with stock tracking, purchase orders, suppliers, and warehouse management.',
  category: 'operations',
  icon: 'Package',  // lucide-react icon name
  status: 'active'
}
```

## Verification Queries

### Check Product Exists
```sql
SELECT * FROM public.products WHERE product_key = 'inventory';
```

### Check Organization Access
```sql
SELECT
  o.slug AS organization,
  p.product_name AS product,
  opa.is_enabled AS enabled
FROM public.organization_product_access opa
JOIN public.organizations o ON opa.organization_id = o.id
JOIN public.products p ON opa.product_id = p.id
WHERE p.product_key = 'inventory'
ORDER BY o.slug;
```

### Count Total Access
```sql
SELECT
  COUNT(*) AS total_orgs,
  COUNT(CASE WHEN opa.is_enabled THEN 1 END) AS enabled,
  COUNT(CASE WHEN NOT opa.is_enabled THEN 1 END) AS disabled
FROM public.organization_product_access opa
WHERE product_id = (SELECT id FROM public.products WHERE product_key = 'inventory');
```

## Common Operations

### Enable for New Organization
```sql
INSERT INTO public.organization_product_access (
  id, organization_id, product_id, is_enabled, settings, created_at, updated_at
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM organizations WHERE slug = 'new-org-slug'),
  (SELECT id FROM products WHERE product_key = 'inventory'),
  true,
  '{}'::jsonb,
  NOW(),
  NOW()
);
```

### Disable for Specific Organization
```sql
UPDATE public.organization_product_access
SET is_enabled = false, updated_at = NOW()
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'org-slug')
  AND product_id = (SELECT id FROM products WHERE product_key = 'inventory');
```

### Re-enable for Organization
```sql
UPDATE public.organization_product_access
SET is_enabled = true, updated_at = NOW()
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'org-slug')
  AND product_id = (SELECT id FROM products WHERE product_key = 'inventory');
```

## Frontend Integration

The Inventory product is already integrated in the frontend:

### Routes
- Main route: `/inventory`
- Component: `src/products/inventory/index.jsx`

### Dashboard
- Appears in product cards (if enabled for org)
- Navigation tab in admin panel
- Icon: Package (lucide-react)

### Access Control
Frontend checks `organization_product_access.is_enabled` to determine if user can access the product.

## Troubleshooting

### Product not showing in frontend?
1. Check product exists:
   ```sql
   SELECT * FROM products WHERE product_key = 'inventory';
   ```

2. Check organization has access:
   ```sql
   SELECT * FROM organization_product_access
   WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'your-org')
     AND product_id = (SELECT id FROM products WHERE product_key = 'inventory');
   ```

3. Check `is_enabled = true`

### New organizations not getting access?
- Run the Node.js script: `node scripts/setup-inventory.js`
- OR run SQL to grant access (see "Enable for New Organization" above)
- Consider adding trigger or signup code to auto-grant access

## Best Practices

1. **Use product_key for lookups** - More stable than IDs
2. **Always verify after setup** - Run verification queries
3. **Use transactions for bulk operations** - Wrap in BEGIN/COMMIT
4. **Don't delete product records** - Disable via `is_enabled` instead
5. **Use settings JSON for future config** - Store product-specific settings

## Related Documentation

- [Purchase Order Status Flow](PURCHASE_ORDER_STATUS_FLOW.md)
- [Manual Product Insert Guide](sql_manual_insert_guide.sql)
- [Clear Inventory Data](clear_inventory_data.sql)
- [Delete All Inventory (All Tenants)](delete_all_inventory_all_tenants.sql)
