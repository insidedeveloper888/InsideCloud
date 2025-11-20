# Product Access Control - Usage Guide

This guide explains how to use the product access control system that was implemented in the InsideCloud application.

## Overview

The product access control system ensures that organizations only have access to the products they've been granted access to in the database. This is enforced at three levels:

1. **Database**: `organization_product_access` table controls which organizations can access which products
2. **Backend**: Middleware validates access before processing requests
3. **Frontend**: Dynamic UI shows only accessible products

## For Frontend Developers

### Using the API Client Utility

When making API calls to product-specific endpoints, use the `apiFetch` or `apiFetchJSON` utilities instead of the native `fetch`:

```javascript
import { apiFetch, apiFetchJSON } from '../../utils/api_client';

// Example 1: Simple GET request
try {
  const data = await apiFetchJSON(
    `/api/contacts?organization_slug=${orgSlug}`
  );
  console.log('Contacts:', data.data);
} catch (error) {
  if (error.name === 'ProductAccessDeniedError') {
    // Access was denied - user will be notified and redirected automatically
    console.log('Access denied:', error.product);
  } else {
    // Handle other errors
    console.error('Request failed:', error.message);
  }
}

// Example 2: POST request
try {
  const result = await apiFetchJSON('/api/contacts', {
    method: 'POST',
    body: JSON.stringify({
      organization_slug: orgSlug,
      name: 'John Doe',
      email: 'john@example.com'
    })
  });
  console.log('Contact created:', result.data);
} catch (error) {
  // Error handling...
}
```

### Using the Products Hook

The `useOrganizationProducts` hook fetches the list of products an organization has access to:

```javascript
import { useOrganizationProducts } from '../../hooks/useOrganizationProducts';

function MyComponent({ organizationSlug }) {
  const { products, loading, error, refetch } = useOrganizationProducts(organizationSlug);

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product.key}>
          <h3>{product.display_name}</h3>
          <p>{product.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### Product Object Structure

```javascript
{
  id: 1,
  key: "strategic_map",           // Unique product identifier
  name: "Strategic Map",           // Internal name
  display_name: "战略地图",        // Display name (can be localized)
  description: "...",              // Product description
  category: "planning",            // Product category
  icon: "Map",                     // Icon name (maps to React component)
  is_active: true,                 // Whether product is active
  metadata: {                      // Additional product metadata
    version: "2.2.0",
    status: "production"
  },
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z"
}
```

### Checking Product Access

To check if an organization has access to a specific product:

```javascript
import { hasProductAccess } from '../../hooks/useOrganizationProducts';

if (hasProductAccess(organizationSlug, 'strategic_map')) {
  console.log('User has access to strategic map');
} else {
  console.log('User does not have access');
}
```

### 403 Error Handling

When a 403 error occurs (product access denied):

1. **Automatic handling**: The global error handler in the Home component will:
   - Show an alert message to the user
   - Redirect to the dashboard
   - Clear the products cache
   - Trigger a refetch of products

2. **Custom handling**: You can register your own handler:

```javascript
import { onProductAccessDenied } from '../../utils/api_client';

useEffect(() => {
  const unsubscribe = onProductAccessDenied((error) => {
    console.log('Access denied to:', error.product);
    // Custom handling here
  });

  return unsubscribe; // Cleanup on unmount
}, []);
```

## For Backend Developers

### Applying Product Access Middleware

To protect a route with product access control:

```javascript
const { requireProductAccess } = require('./middleware/product_access');

// Koa router
router.get('/api/contacts',
  requireProductAccess('contact_management'),
  contactController.getContacts
);

router.post('/api/contacts',
  requireProductAccess('contact_management'),
  contactController.createContact
);
```

For Vercel serverless functions:

```javascript
const { requireProductAccessVercel } = require('../middleware/product_access');

module.exports = async function handler(req, res) {
  // Apply middleware
  const accessCheck = await requireProductAccessVercel('contact_management');
  const accessResult = await accessCheck(req, res);

  // If accessResult is defined, middleware blocked the request
  if (accessResult) return accessResult;

  // Continue with handler logic
  // ... your code here
};
```

### Product Helper Functions

Available helper functions in `server/product_helper.js`:

```javascript
const {
  getOrganizationProducts,   // Get all products for an organization
  validateProductAccess,      // Check if org has access to a product
  getProductByKey,           // Get product details by key
  getAllProducts,            // Get all products (admin only)
} = require('./product_helper');

// Example usage
const hasAccess = await validateProductAccess('inside-advisory', 'strategic_map');
if (!hasAccess) {
  return res.status(403).json({ msg: 'Access denied' });
}
```

## For Database Administrators

### Granting Product Access

To grant an organization access to a product:

```sql
-- Find organization and product IDs
SELECT id, slug, name FROM organizations WHERE slug = 'inside-advisory';
SELECT id, key, name FROM products WHERE key = 'strategic_map';

-- Grant access
INSERT INTO organization_product_access (organization_id, product_id, is_enabled)
VALUES (1, 1, true)
ON CONFLICT (organization_id, product_id)
DO UPDATE SET is_enabled = true, updated_at = NOW();
```

### Revoking Product Access

To revoke access:

```sql
UPDATE organization_product_access
SET is_enabled = false, updated_at = NOW()
WHERE organization_id = 1 AND product_id = 1;
```

### Adding a New Product

To add a new product to the system:

```sql
INSERT INTO products (
  key,
  name,
  display_name,
  description,
  category,
  icon,
  metadata,
  is_active
) VALUES (
  'new_product',                    -- Unique key (used in code)
  'New Product',                    -- Internal name
  'New Product Display',            -- Display name
  'Description of the product',     -- Description
  'category_name',                  -- Category
  'LayoutDashboard',                -- Icon name
  '{"version": "1.0.0"}',          -- Metadata (JSONB)
  true                              -- Active status
);

-- Auto-grant to all active organizations (optional)
INSERT INTO organization_product_access (organization_id, product_id, is_enabled)
SELECT o.id, p.id, true
FROM organizations o
CROSS JOIN products p
WHERE o.is_active = true
  AND p.key = 'new_product'
ON CONFLICT (organization_id, product_id) DO NOTHING;
```

### Viewing Current Access

```sql
-- See all products accessible to an organization
SELECT
  p.key,
  p.display_name,
  p.category,
  opa.is_enabled,
  opa.updated_at
FROM organization_product_access opa
JOIN products p ON p.id = opa.product_id
JOIN organizations o ON o.id = opa.organization_id
WHERE o.slug = 'inside-advisory'
  AND opa.is_enabled = true
  AND p.is_active = true;

-- See which organizations have access to a product
SELECT
  o.slug,
  o.name,
  opa.is_enabled,
  opa.updated_at
FROM organization_product_access opa
JOIN organizations o ON o.id = opa.organization_id
JOIN products p ON p.id = opa.product_id
WHERE p.key = 'strategic_map'
  AND opa.is_enabled = true;
```

## Testing

### Testing Access Control

1. **Frontend**:
   - Log in as different organizations
   - Check that only granted products appear in dashboard
   - Try navigating to products without access (should redirect)

2. **Backend**:
   - Make API requests without organization_slug (should return 400)
   - Make requests for products without access (should return 403)
   - Verify middleware is applied to all product routes

3. **Database**:
   - Revoke access to a product
   - Verify user sees error and is redirected
   - Re-grant access
   - Verify product reappears (may need page refresh)

## Common Issues

### Products not showing in dashboard

1. Check database: `SELECT * FROM organization_product_access WHERE organization_id = X;`
2. Check `is_enabled = true` and `is_active = true`
3. Clear browser cache and localStorage
4. Check browser console for errors

### 403 errors when accessing a product

1. Verify organization has access in database
2. Check that organization_slug is being passed in requests
3. Verify middleware is applied to the route
4. Check backend logs for detailed error messages

### Products cache not updating

```javascript
import { clearProductsCache } from '../../hooks/useOrganizationProducts';

// Clear cache manually
clearProductsCache();

// Or use refetch from the hook
const { refetch } = useOrganizationProducts(orgSlug);
refetch();
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                                                              │
│  ┌──────────────────┐      ┌─────────────────────────┐     │
│  │  Dashboard       │      │ Product Component       │     │
│  │                  │      │ (Strategic Map, etc)    │     │
│  │  - useOrg        │      │                         │     │
│  │    Products()    │──────│ - apiFetch()            │     │
│  │  - Dynamic       │      │ - 403 handling          │     │
│  │    rendering     │      │                         │     │
│  └──────────────────┘      └─────────────────────────┘     │
│                                      │                       │
└──────────────────────────────────────┼───────────────────────┘
                                       │
                                       │ HTTP Request
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Route                                           │  │
│  │  /api/contacts                                       │  │
│  │                                                      │  │
│  │  1. requireProductAccess('contact_management')      │  │
│  │     │                                                │  │
│  │     ├─► Extract organization_slug from request      │  │
│  │     ├─► validateProductAccess(slug, product_key)    │  │
│  │     ├─► Query database for access                   │  │
│  │     └─► Return 403 if denied, continue if allowed   │  │
│  │                                                      │  │
│  │  2. Route handler (contactController.getContacts)   │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                      │                       │
└──────────────────────────────────────┼───────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database (Supabase)                     │
│                                                              │
│  ┌────────────────┐  ┌──────────────────────────────┐      │
│  │ organizations  │  │ organization_product_access  │      │
│  ├────────────────┤  ├──────────────────────────────┤      │
│  │ id             │◄─┤ organization_id              │      │
│  │ slug           │  │ product_id                   │──┐   │
│  │ name           │  │ is_enabled                   │  │   │
│  │ is_active      │  │ updated_at                   │  │   │
│  └────────────────┘  └──────────────────────────────┘  │   │
│                                                         │   │
│  ┌────────────────┐                                    │   │
│  │ products       │◄───────────────────────────────────┘   │
│  ├────────────────┤                                        │
│  │ id             │                                        │
│  │ key            │                                        │
│  │ display_name   │                                        │
│  │ category       │                                        │
│  │ icon           │                                        │
│  │ is_active      │                                        │
│  └────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

## Summary

The product access control system provides:

- **Database-driven configuration**: Add/remove products and control access via SQL
- **Backend enforcement**: Middleware validates access on every request
- **Frontend filtering**: Users only see products they have access to
- **Graceful error handling**: 403 errors trigger user-friendly messages and redirects
- **Cache management**: Automatic cache invalidation when access changes
- **Type safety**: Consistent product objects across the application

For questions or issues, check the backend logs and database access records first.
