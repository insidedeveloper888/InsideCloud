# Product Status System - Complete Guide

## Overview

The product status system allows you to control product lifecycle states and display different UX for each state in the dashboard.

## Product Statuses

### 1. **`active`** - Production Ready
- **Meaning**: Fully available, production-ready product
- **Access Control**: Respects `organization_product_access` table
- **Dashboard UX**: Normal clickable card with hover effects
- **Navigation**: Appears in navigation if organization has access (admin only)

### 2. **`coming_soon`** - Not Yet Available
- **Meaning**: Product shown to build anticipation, not accessible yet
- **Access Control**: **Shown to ALL organizations** (no access check)
- **Dashboard UX**: Disabled card with "Coming Soon" overlay, no click interaction
- **Navigation**: Does NOT appear in navigation
- **Use Case**: Marketing, roadmap transparency, setting expectations

### 3. **`beta`** - Experimental/Testing
- **Meaning**: Available but experimental, may have bugs
- **Access Control**: Respects `organization_product_access` table
- **Dashboard UX**: Clickable card with "Beta" badge
- **Navigation**: Appears in navigation if organization has access
- **Use Case**: Early access, testing with select customers

### 4. **`deprecated`** - Being Phased Out
- **Meaning**: Product being retired, may be removed soon
- **Access Control**: Respects `organization_product_access` table
- **Dashboard UX**: Disabled card with "Deprecated" overlay
- **Navigation**: Does NOT appear in navigation
- **Use Case**: Graceful product sunset, migration period

## Database Schema

### Column: `products.status`

```sql
ALTER TABLE products
ADD COLUMN status TEXT DEFAULT 'active'
CHECK (status IN ('active', 'coming_soon', 'beta', 'deprecated'));
```

**Default**: `active` (backward compatible)

### Semantics

Three independent flags control product visibility and access:

| Flag | Purpose | Controls |
|------|---------|----------|
| `is_active` | Soft delete | Product exists in system (false = deleted) |
| `status` | Lifecycle state | Product maturity/availability |
| `organization_product_access.is_enabled` | Access control | Organization can use this product |

**Logic:**
```
Display in dashboard:
  is_active = true
  AND (
    (status = 'coming_soon') OR
    (status IN ('active', 'beta', 'deprecated') AND organization has access)
  )

Allow interaction:
  status IN ('active', 'beta')
  AND organization has access

Show in navigation:
  status IN ('active', 'beta')
  AND organization has access
  AND user is admin
```

## How to Add "Coming Soon" Products

### Step 1: Run Migration

```sql
-- Add status column
ALTER TABLE products
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
CHECK (status IN ('active', 'coming_soon', 'beta', 'deprecated'));
```

### Step 2: Insert Coming Soon Product

```sql
INSERT INTO products (
  id,
  key,
  name,
  description,
  category,
  icon,
  status,  -- Set to 'coming_soon'
  is_active,
  metadata,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'work_specification',
  '工作规格',
  'Define job specifications and role responsibilities',
  'hr',
  'SheetIcon',
  'coming_soon',  -- Coming Soon!
  true,
  '{"version": "1.0.0", "planned_release": "2025-12"}',
  NOW(),
  NOW()
)
ON CONFLICT (key) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();
```

### Step 3: Verify in Dashboard

Restart your dev server:
```bash
npm run start:server
```

Visit dashboard - you should see the "Coming Soon" product with overlay!

### Step 4: Launch When Ready

```sql
-- Change status to active
UPDATE products
SET status = 'active', updated_at = NOW()
WHERE key = 'work_specification';

-- Grant access to organizations
INSERT INTO organization_product_access (
  organization_id,
  product_id,
  is_enabled,
  granted_at
)
SELECT
  o.id,
  p.id,
  true,
  NOW()
FROM organizations o
CROSS JOIN products p
WHERE p.key = 'work_specification'
  AND o.is_active = true
ON CONFLICT (organization_id, product_id) DO UPDATE SET
  is_enabled = true,
  updated_at = NOW();
```

## API Endpoints

### 1. `/api/products/dashboard` (New!)

**Purpose**: Returns products for dashboard display

**Query**: `GET /api/products/dashboard?organization_slug={slug}`

**Returns:**
- Active/Beta/Deprecated products where org has access
- **ALL** Coming Soon products (no access check)

**Use Case**: Dashboard component

**Example Response:**
```json
{
  "code": 0,
  "msg": "Success",
  "data": [
    {
      "key": "strategic_map",
      "name": "战略地图",
      "status": "active",
      "icon": "TargetIcon",
      "category": "planning"
    },
    {
      "key": "work_specification",
      "name": "工作规格",
      "status": "coming_soon",
      "icon": "SheetIcon",
      "category": "hr"
    }
  ]
}
```

### 2. `/api/products` (Existing)

**Purpose**: Returns products for access control validation

**Query**: `GET /api/products?organization_slug={slug}`

**Returns:**
- Only products where org has access (Active/Beta/Deprecated)
- Does NOT include Coming Soon products

**Use Case**: Navigation tabs, access validation

## Frontend Implementation

### Dashboard Component

```javascript
const DashboardContent = ({ onNavigate, organizationSlug }) => {
  // Fetches from /api/products/dashboard
  const { products, loading, error } = useOrganizationProducts(organizationSlug);

  return (
    <div className="grid grid-cols-5 gap-6">
      {products.map((product) => {
        const isComingSoon = product.status === 'coming_soon';
        const isBeta = product.status === 'beta';
        const isActive = product.status === 'active';

        return (
          <div
            className={isComingSoon ? 'opacity-60' : 'cursor-pointer hover:-translate-y-2'}
            onClick={() => {
              if (isActive || isBeta) {
                onNavigate(product.key);
              }
            }}
          >
            <IconComponent />
            <h3>{product.name}</h3>

            {/* Beta Badge */}
            {isBeta && <Badge>Beta</Badge>}

            {/* Coming Soon Overlay */}
            {isComingSoon && (
              <div className="absolute inset-0 backdrop-blur">
                <div className="bg-gradient-to-r from-primary-500 to-purple-600">
                  Coming Soon
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
```

### Navigation Tabs (Admin)

```javascript
const navItems = useMemo(() => {
  // System tabs...

  // Product tabs (only active and beta)
  const productTabs = navProducts
    .filter(p => ['active', 'beta'].includes(p.status))
    .map(product => ({
      key: product.key,
      label: product.name,
      icon: iconMap[product.icon],
    }));

  return [...systemTabs, ...productTabs];
}, [navProducts]);
```

## Backend Implementation

### Helper Function: `getDashboardProducts()`

```javascript
async function getDashboardProducts(orgSlug) {
  // Get products with access (active, beta, deprecated)
  const accessProducts = await supabase
    .from('products')
    .select('..., organization_product_access!inner(is_enabled)')
    .eq('organization_product_access.organization_id', org.id)
    .eq('organization_product_access.is_enabled', true)
    .in('status', ['active', 'beta', 'deprecated']);

  // Get all coming_soon products (no access check)
  const comingSoonProducts = await supabase
    .from('products')
    .select('...')
    .eq('is_active', true)
    .eq('status', 'coming_soon');

  // Combine and deduplicate
  const allProducts = [...accessProducts, ...comingSoonProducts];
  return Array.from(new Map(allProducts.map(p => [p.key, p])).values());
}
```

## Common Scenarios

### Scenario 1: Add Coming Soon Product

```sql
-- 1. Insert product with coming_soon status
INSERT INTO products (key, name, status, ...)
VALUES ('new_product', 'New Product', 'coming_soon', ...);

-- 2. No access records needed!
-- Coming soon products shown to all orgs automatically
```

**Result:**
- ✅ Shows in all dashboards
- ✅ Disabled with overlay
- ❌ Not in navigation
- ❌ Not accessible

### Scenario 2: Launch Beta to Select Customers

```sql
-- 1. Change status to beta
UPDATE products SET status = 'beta' WHERE key = 'new_product';

-- 2. Grant access to specific organizations
INSERT INTO organization_product_access (organization_id, product_id, is_enabled)
VALUES
  (org1_id, product_id, true),
  (org2_id, product_id, true);
```

**Result:**
- ✅ Shows in dashboards for org1 and org2 only
- ✅ Shows "Beta" badge
- ✅ Clickable and functional
- ✅ Appears in navigation for admins

### Scenario 3: General Availability Launch

```sql
-- 1. Change status to active
UPDATE products SET status = 'active' WHERE key = 'new_product';

-- 2. Grant access to all organizations
INSERT INTO organization_product_access (organization_id, product_id, is_enabled)
SELECT o.id, p.id, true
FROM organizations o
CROSS JOIN products p
WHERE p.key = 'new_product'
ON CONFLICT DO UPDATE SET is_enabled = true;
```

**Result:**
- ✅ Shows in all dashboards
- ✅ Fully functional
- ✅ No "Beta" badge
- ✅ Appears in navigation for all admins

### Scenario 4: Deprecate Product

```sql
-- 1. Change status to deprecated
UPDATE products SET status = 'deprecated' WHERE key = 'old_product';

-- 2. Keep access records (let existing users finish)
-- Or revoke access to new organizations
UPDATE organization_product_access
SET is_enabled = false
WHERE product_id = (SELECT id FROM products WHERE key = 'old_product')
  AND organization_id IN (SELECT id FROM organizations WHERE created_at > NOW() - INTERVAL '30 days');
```

**Result:**
- ✅ Shows "Deprecated" overlay
- ✅ Existing orgs can still access (migration period)
- ❌ New orgs cannot access
- ❌ Not in navigation

## Metadata Best Practices

Store additional info in `metadata` JSONB column:

```sql
-- Coming Soon product
metadata: {
  "planned_release": "2025-12",
  "priority": "high",
  "beta_testers": ["org1", "org2"]
}

-- Beta product
metadata: {
  "beta_start": "2025-11-01",
  "known_issues": ["issue-123", "issue-456"],
  "feedback_url": "https://feedback.example.com"
}

-- Deprecated product
metadata: {
  "deprecated_since": "2025-10-01",
  "removal_date": "2026-01-01",
  "migration_guide": "https://docs.example.com/migration"
}
```

## Verification Queries

```sql
-- View all products by status
SELECT key, name, status, COUNT(opa.id) as org_count
FROM products p
LEFT JOIN organization_product_access opa ON opa.product_id = p.id AND opa.is_enabled = true
WHERE p.is_active = true
GROUP BY p.id, p.key, p.name, p.status
ORDER BY
  CASE p.status
    WHEN 'active' THEN 1
    WHEN 'beta' THEN 2
    WHEN 'coming_soon' THEN 3
    WHEN 'deprecated' THEN 4
  END;

-- Check specific organization's dashboard
SELECT
  p.key,
  p.name,
  p.status,
  COALESCE(opa.is_enabled, false) as has_access
FROM products p
LEFT JOIN organization_product_access opa
  ON opa.product_id = p.id
  AND opa.organization_id = (SELECT id FROM organizations WHERE slug = 'cloud')
WHERE p.is_active = true
ORDER BY p.status, p.key;
```

## Summary

✅ **`status` column** controls product lifecycle
✅ **Coming soon products** show to everyone (no access records needed)
✅ **Active/Beta products** respect access control
✅ **Dashboard endpoint** returns appropriate products
✅ **Frontend handles** different states with UX
✅ **Clean separation** between display and access logic

This system gives you maximum flexibility to manage product rollouts, beta testing, and deprecation while maintaining a great user experience!
