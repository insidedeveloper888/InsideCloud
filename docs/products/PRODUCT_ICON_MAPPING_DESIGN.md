# Product Icon Mapping - Design Documentation

## Design Questions & Answers

### Q1: Why do we need `display_name` when we already have `name`?

**Answer: We DON'T need `display_name`!**

Your existing schema already uses the `name` field for the display name:
```json
{
  "key": "strategic_map",
  "name": "战略地图"  // ← This is already the display name
}
```

The initial implementation incorrectly proposed adding a redundant `display_name` field. This was overthinking a common pattern where:
- `name` = internal identifier (e.g., "Strategic Map")
- `display_name` = localized name (e.g., "战略地图")

However, your simpler approach is better: just use `name` for what users see.

**Final Decision: Use `name` field only, no `display_name` field needed.**

---

### Q2: What values should the `icon` column store?

**Answer: Store the React component name as a string.**

Since you have custom SVG components in `src/components/ui/icons/`:
- `ContactBookIcon.jsx`
- `DocumentIcon.jsx`
- `TargetIcon.jsx`
- `PromotionIcon.jsx`
- `SheetIcon.jsx`

The `icon` column should store the component name:

```sql
-- strategic_map
icon: "TargetIcon"

-- document_parser
icon: "DocumentIcon"

-- contact_management
icon: "ContactBookIcon"
```

**Why this approach?**
1. ✅ Clear and self-documenting
2. ✅ Easy to validate that the component exists
3. ✅ Simple database updates if you rename components
4. ✅ No confusion about which icon to use

---

### Q3: How do backend and frontend enforce correct icon display?

## Frontend Icon Enforcement

### In Dashboard (Product Cards)

The dashboard uses your **custom SVG icon components**:

```javascript
// src/pages/home/index.js - DashboardContent component

import { TargetIcon, DocumentIcon, ContactBookIcon, SheetIcon, PromotionIcon } from '../../components/ui/icons';

const DashboardContent = ({ onNavigate, organizationSlug }) => {
  const { products } = useOrganizationProducts(organizationSlug);

  // Icon mapping: database icon name (string) -> React component
  const iconMap = {
    'TargetIcon': TargetIcon,
    'DocumentIcon': DocumentIcon,
    'ContactBookIcon': ContactBookIcon,
    'SheetIcon': SheetIcon,
    'PromotionIcon': PromotionIcon,
  };

  return (
    <div className="grid ...">
      {products.map((product) => {
        // Get icon component by name from database
        // Falls back to TargetIcon if icon not found
        const IconComponent = iconMap[product.icon] || TargetIcon;

        return (
          <div key={product.key}>
            <IconComponent size={56} />
            <h3>{product.name}</h3>  {/* Use name, not display_name */}
          </div>
        );
      })}
    </div>
  );
};
```

**How it works:**
1. Database stores: `product.icon = "TargetIcon"`
2. Frontend imports all custom icon components
3. Mapping object: `iconMap["TargetIcon"]` → `TargetIcon` component
4. Renders: `<TargetIcon size={56} />`
5. If icon not found, falls back to `TargetIcon` as default

---

### In Navigation Sidebar (Admin)

The navigation uses **lucide-react icons** for consistency with other nav items:

```javascript
// src/pages/home/index.js - navItems

import { Map, FileText, Users, LayoutDashboard } from 'lucide-react';

const navItems = useMemo(() => {
  // Admin users see system tabs + dynamic products
  const systemTabs = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'General' },
    { key: 'account', label: 'Account', icon: UserCircle2, section: 'General' },
    // ... other system tabs
  ];

  // Icon mapping for products in navigation
  // Maps custom icon component names to lucide-react icons
  const productIconMap = {
    'TargetIcon': Map,          // Strategic Map → Map icon
    'DocumentIcon': FileText,   // Document Parser → FileText icon
    'ContactBookIcon': Users,   // Contact Management → Users icon
  };

  // Add product tabs dynamically
  const productTabs = (navProducts || []).map(product => ({
    key: product.key,
    label: product.name,  // Use name field directly
    icon: productIconMap[product.icon] || LayoutDashboard,
    section: 'Product',
  }));

  return [...systemTabs, ...productTabs];
}, [isAdmin, navProducts]);
```

**Why different icons for navigation?**
- Navigation already uses lucide-react icons consistently
- Keeps visual style consistent in sidebar
- Your custom SVG icons are used in the dashboard for larger display

---

## Backend Enforcement

### Database Schema

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,           -- Display name (e.g., "战略地图")
  description TEXT,
  category TEXT,
  icon TEXT,                     -- Component name (e.g., "TargetIcon")
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Sample Data After Migration

```sql
-- strategic_map
{
  "id": "ef8ea45e-fb40-4138-b2f6-4b30271e98be",
  "key": "strategic_map",
  "name": "战略地图",
  "icon": "TargetIcon",
  "category": "planning",
  "is_active": true
}

-- document_parser
{
  "id": "45216e94-0edc-49cc-bbac-57e67c2d838e",
  "key": "document_parser",
  "name": "Document Parser",
  "icon": "DocumentIcon",
  "category": "analytics",
  "is_active": true
}

-- contact_management (NEW)
{
  "id": "<generated-uuid>",
  "key": "contact_management",
  "name": "名单管理",
  "icon": "ContactBookIcon",
  "category": "crm",
  "is_active": true
}
```

---

## Migration Flow

### What Happens When You Run the Migration

```sql
-- 1. Add icon column
ALTER TABLE products ADD COLUMN IF NOT EXISTS icon TEXT;

-- 2. Update existing products
UPDATE products SET icon = 'TargetIcon' WHERE key = 'strategic_map';
UPDATE products SET icon = 'DocumentIcon' WHERE key = 'document_parser';

-- 3. Insert new product
INSERT INTO products (key, name, icon, ...)
VALUES ('contact_management', '名单管理', 'ContactBookIcon', ...);

-- 4. Grant access to all organizations
INSERT INTO organization_product_access (organization_id, product_id, ...)
SELECT o.id, p.id, ... FROM organizations o CROSS JOIN products p
WHERE p.key = 'contact_management';
```

---

## Validation & Error Handling

### Frontend Validation

```javascript
// Dashboard validates icon exists in iconMap
const IconComponent = iconMap[product.icon] || TargetIcon;  // Fallback

// If database has invalid icon:
// Database: { icon: "UnknownIcon" }
// Renders: <TargetIcon /> (fallback)
```

### Adding New Icons

**1. Create the SVG component:**
```bash
# Create src/components/ui/icons/NewProductIcon.jsx
export function NewProductIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} ...>
      {/* SVG content */}
    </svg>
  );
}
```

**2. Export from index:**
```javascript
// src/components/ui/icons/index.js
export { NewProductIcon } from './NewProductIcon';
```

**3. Add to iconMap:**
```javascript
// src/pages/home/index.js
const iconMap = {
  'TargetIcon': TargetIcon,
  'DocumentIcon': DocumentIcon,
  'ContactBookIcon': ContactBookIcon,
  'NewProductIcon': NewProductIcon,  // ← Add here
};
```

**4. Use in database:**
```sql
INSERT INTO products (key, name, icon, ...)
VALUES ('new_product', 'New Product', 'NewProductIcon', ...);
```

---

## Common Mistakes to Avoid

### ❌ Wrong: Using generic icon names
```sql
-- DON'T DO THIS
UPDATE products SET icon = 'Map' WHERE key = 'strategic_map';
UPDATE products SET icon = 'FileText' WHERE key = 'document_parser';
```
**Problem:** Doesn't map to your custom SVG components

### ✅ Correct: Using component names
```sql
-- DO THIS
UPDATE products SET icon = 'TargetIcon' WHERE key = 'strategic_map';
UPDATE products SET icon = 'DocumentIcon' WHERE key = 'document_parser';
```
**Why:** Directly maps to your components in `src/components/ui/icons/`

---

### ❌ Wrong: Creating duplicate display_name field
```sql
-- DON'T DO THIS
ALTER TABLE products ADD COLUMN display_name TEXT;
UPDATE products SET display_name = '战略地图' WHERE key = 'strategic_map';
```
**Problem:** Redundant, `name` already serves this purpose

### ✅ Correct: Using existing name field
```sql
-- DO THIS
UPDATE products SET name = '战略地图' WHERE key = 'strategic_map';
```
**Why:** Simpler, matches your existing schema

---

## Summary

### Database Schema
- ✅ `name` field: Display name (e.g., "战略地图")
- ✅ `icon` field: Component name (e.g., "TargetIcon")
- ❌ No `display_name` field needed (redundant)

### Frontend Implementation
- ✅ Dashboard: Uses custom SVG components via `iconMap`
- ✅ Navigation: Uses lucide-react icons via `productIconMap`
- ✅ Fallback: Defaults to `TargetIcon` if icon not found

### Adding New Products
1. Create SVG component in `src/components/ui/icons/`
2. Export from `index.js`
3. Add to `iconMap` in `DashboardContent`
4. Insert into database with component name in `icon` field

### Icon Mapping Pattern
```
Database: "TargetIcon" (string)
    ↓
Frontend: iconMap["TargetIcon"]
    ↓
Component: TargetIcon (React component)
    ↓
Renders: <TargetIcon size={56} />
```

This design provides:
- Clear connection between database and components
- Type-safe lookups (can add TypeScript validation)
- Easy to debug (icon name matches component name)
- Simple to extend (add new icons by adding to iconMap)
