# API Design Pattern (Backend)

> **When to use**: Adding any new API endpoint to the project

---

## Pre-Check

Before starting, verify:
- [ ] Read `.clinerules` Section 2 (Dual Deployment Architecture)
- [ ] Have `organization_slug` parameter ready
- [ ] Know the resource name (e.g., "products", "contacts", "orders")
- [ ] Understand multi-tenant isolation requirements

---

## Implementation Checklist

### Step 1: Create API Handler (Vercel Production)

**File**: `server/api_handlers/{resource}.js`

**Template**:

```javascript
const { handleCors } = require('../api/_utils');
const { supabase } = require('./supabase_client');

/**
 * Unified handler for {resource} API
 * Supports: GET (list + by ID), POST (create), PUT (update), DELETE
 */
module.exports = async function handler(req, res) {
  // STEP 1: Handle CORS preflight
  if (handleCors(req, res)) return;

  // STEP 2: Extract organization slug (REQUIRED for multi-tenancy)
  const organizationSlug = req.query.organization_slug;
  if (!organizationSlug) {
    return res.status(400).json({
      success: false,
      error: 'organization_slug is required'
    });
  }

  // STEP 3: Validate organization exists
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', organizationSlug)
    .single();

  if (orgError || !org) {
    return res.status(404).json({
      success: false,
      error: 'Organization not found'
    });
  }

  const organizationId = org.id;

  // STEP 4: Route by HTTP method
  try {
    if (req.method === 'GET') {
      // Check if requesting single item by ID
      const idMatch = req.url.match(/\/([^/?]+)(?:\?|$)/);
      if (idMatch && idMatch[1] !== '{resource}') {
        return await getById(req, res, organizationId, idMatch[1]);
      }
      return await getList(req, res, organizationId);
    }

    if (req.method === 'POST') {
      return await create(req, res, organizationId);
    }

    if (req.method === 'PUT') {
      const idMatch = req.url.match(/\/([^/?]+)(?:\?|$)/);
      if (!idMatch) {
        return res.status(400).json({ error: 'Item ID required for update' });
      }
      return await update(req, res, organizationId, idMatch[1]);
    }

    if (req.method === 'DELETE') {
      const idMatch = req.url.match(/\/([^/?]+)(?:\?|$)/);
      if (!idMatch) {
        return res.status(400).json({ error: 'Item ID required for delete' });
      }
      return await deleteItem(req, res, organizationId, idMatch[1]);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error(`Error in {resource} API:`, error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ===== CRUD Operations =====

async function getList(req, res, organizationId) {
  const { data, error } = await supabase
    .from('{table_name}')
    .select('*')
    .eq('organization_id', organizationId)  // ⚠️ CRITICAL: Tenant filter
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
}

async function getById(req, res, organizationId, itemId) {
  const { data, error } = await supabase
    .from('{table_name}')
    .select('*')
    .eq('id', itemId)
    .eq('organization_id', organizationId)  // ⚠️ CRITICAL: Tenant filter
    .single();

  if (error) {
    return res.status(404).json({ error: 'Item not found' });
  }

  return res.status(200).json(data);
}

async function create(req, res, organizationId) {
  const itemData = req.body;

  // Add organization_id to data
  const { data, error } = await supabase
    .from('{table_name}')
    .insert({
      ...itemData,
      organization_id: organizationId  // ⚠️ CRITICAL: Set tenant
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(data);
}

async function update(req, res, organizationId, itemId) {
  const updates = req.body;

  const { data, error } = await supabase
    .from('{table_name}')
    .update(updates)
    .eq('id', itemId)
    .eq('organization_id', organizationId)  // ⚠️ CRITICAL: Tenant filter
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
}

async function deleteItem(req, res, organizationId, itemId) {
  const { error } = await supabase
    .from('{table_name}')
    .delete()
    .eq('id', itemId)
    .eq('organization_id', organizationId);  // ⚠️ CRITICAL: Tenant filter

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
```

---

### Step 2: Add Koa Routes (Development Server)

**File**: `server/server.js`

**Location**: Find the section with other routes (search for `router.get('/api/`)

**Template**:

```javascript
// ===== {Resource} API Routes =====

// CORS preflight handler (REQUIRED!)
router.options('/api/{resource}', async (ctx) => {
  serverUtil.configAccessControl(ctx);
  ctx.status = 200;
});

router.options('/api/{resource}/:id', async (ctx) => {
  serverUtil.configAccessControl(ctx);
  ctx.status = 200;
});

// GET list
router.get('/api/{resource}', async (ctx) => {
  serverUtil.configAccessControl(ctx);

  const organizationSlug = ctx.query.organization_slug;
  if (!organizationSlug) {
    ctx.body = { code: -1, msg: 'organization_slug required' };
    return;
  }

  // Validate organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', organizationSlug)
    .single();

  if (orgError || !org) {
    ctx.body = { code: -1, msg: 'Organization not found' };
    return;
  }

  // Fetch data with tenant filter
  const { data, error } = await supabase
    .from('{table_name}')
    .select('*')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false });

  if (error) {
    ctx.body = { code: -1, msg: error.message };
    return;
  }

  ctx.body = { code: 0, data };
});

// GET by ID
router.get('/api/{resource}/:id', async (ctx) => {
  serverUtil.configAccessControl(ctx);

  const organizationSlug = ctx.query.organization_slug;
  const itemId = ctx.params.id;

  // ... same validation + tenant filtering logic

  ctx.body = { code: 0, data };
});

// POST create
router.post('/api/{resource}', async (ctx) => {
  serverUtil.configAccessControl(ctx);

  const organizationSlug = ctx.query.organization_slug;
  const itemData = ctx.request.body;

  // ... same validation + tenant filtering logic

  ctx.body = { code: 0, data };
});

// PUT update
router.put('/api/{resource}/:id', async (ctx) => {
  serverUtil.configAccessControl(ctx);

  // ... same pattern

  ctx.body = { code: 0, data };
});

// DELETE
router.delete('/api/{resource}/:id', async (ctx) => {
  serverUtil.configAccessControl(ctx);

  // ... same pattern

  ctx.body = { code: 0, msg: 'Deleted successfully' };
});
```

---

### Step 3: Register Route in Vercel Router

**File**: `api/[...path].js`

**Location**: Find the `routes` object

**Add**:

```javascript
// Import handler at top of file
const {resource}Handler = require('../server/api_handlers/{resource}');

// Add to routes object
const routes = {
  '/api/{resource}': {resource}Handler,
  // ... other routes
};
```

---

### Step 4: Test Both Environments

**Development (Koa)**:
```bash
# Start server
pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start

# Test
curl "http://localhost:8989/api/{resource}?organization_slug=test-org"
```

**Production (Vercel)**:
```bash
# Deploy
vercel --prod

# Test
curl "https://your-app.vercel.app/api/{resource}?organization_slug=test-org"
```

---

## Common Mistakes & Fixes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Missing OPTIONS handler | CORS error in browser console | Add `router.options()` for BOTH base path AND `/:id` path |
| Missing organization filter | Users see other org's data | Add `.eq('organization_id', orgId)` to ALL queries |
| Only implemented in Koa | Works in dev, 404 in prod | Create handler in `server/api_handlers/` |
| Only implemented in Vercel | 404 in dev, works in prod | Add routes to `server/server.js` |
| Hardcoded table name | Can't reuse pattern | Use variable `{table_name}` |

---

## Checklist Summary

Before marking API task as complete:

- [ ] Handler created: `server/api_handlers/{resource}.js`
- [ ] Routes added to: `server/server.js`
- [ ] Route registered in: `api/[...path].js`
- [ ] OPTIONS handlers added (CORS)
- [ ] All queries have `organization_id` filter
- [ ] Tested in dev (localhost:8989)
- [ ] Tested in prod (Vercel)
- [ ] No console errors in browser
- [ ] Multi-tenant isolation verified (test with 2 different orgs)

---

## Related Patterns

- **Database Queries**: `/docs/patterns/multi-tenant-queries.md`
- **Error Handling**: `/docs/patterns/error-handling.md`
- **Authentication**: `/docs/patterns/session-validation.md`

---

Last Updated: 2025-11-28
