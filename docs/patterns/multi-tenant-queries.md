# Multi-Tenant Database Query Pattern

> **Critical Security Pattern**: Prevents data leaks between organizations

---

## The Golden Rule

```
⚠️ EVERY database query MUST filter by organization_id
```

**No exceptions**. Missing this filter = **security vulnerability**.

---

## Pattern Templates

### 1. SELECT Query (Fetch List)

```javascript
const { data, error } = await supabase
  .from('your_table')
  .select('*')
  .eq('organization_id', organizationId)  // ⚠️ REQUIRED
  .order('created_at', { ascending: false });
```

### 2. SELECT with ID (Fetch Single Item)

```javascript
const { data, error } = await supabase
  .from('your_table')
  .select('*')
  .eq('id', itemId)
  .eq('organization_id', organizationId)  // ⚠️ REQUIRED (prevent cross-org access)
  .single();
```

### 3. INSERT Query (Create)

```javascript
const { data, error } = await supabase
  .from('your_table')
  .insert({
    ...itemData,
    organization_id: organizationId  // ⚠️ REQUIRED (set ownership)
  })
  .select()
  .single();
```

### 4. UPDATE Query

```javascript
const { data, error } = await supabase
  .from('your_table')
  .update(updates)
  .eq('id', itemId)
  .eq('organization_id', organizationId)  // ⚠️ REQUIRED (prevent cross-org update)
  .select()
  .single();
```

### 5. DELETE Query

```javascript
const { error } = await supabase
  .from('your_table')
  .delete()
  .eq('id', itemId)
  .eq('organization_id', organizationId);  // ⚠️ REQUIRED (prevent cross-org delete)
```

### 6. JOIN Query (with Related Tables)

```javascript
const { data, error } = await supabase
  .from('sales_orders')
  .select(`
    *,
    customer:contacts(id, name),
    line_items:sales_order_items(*)
  `)
  .eq('organization_id', organizationId)  // ⚠️ Filter parent table
  .eq('line_items.organization_id', organizationId);  // ⚠️ Filter joined table too
```

---

## How to Get organization_id

### Backend (Koa / Vercel)

```javascript
// Step 1: Get slug from query parameter
const organizationSlug = req.query.organization_slug || ctx.query.organization_slug;

if (!organizationSlug) {
  return res.status(400).json({ error: 'organization_slug required' });
}

// Step 2: Validate organization exists and get ID
const { data: org, error: orgError } = await supabase
  .from('organizations')
  .select('id')
  .eq('slug', organizationSlug)
  .single();

if (orgError || !org) {
  return res.status(404).json({ error: 'Organization not found' });
}

const organizationId = org.id;  // ← Use this in all queries
```

### Frontend (React)

```javascript
import { useOrganization } from '@/contexts/OrganizationContext';

function MyComponent() {
  const { organizationSlug } = useOrganization();

  // Include in all API calls
  const url = `${API_URL}/api/resource?organization_slug=${organizationSlug}`;
}
```

---

## Testing Multi-Tenant Isolation

### Manual Test Checklist

1. **Create 2 test organizations**:
   ```sql
   INSERT INTO organizations (slug, name) VALUES
     ('org-a', 'Organization A'),
     ('org-b', 'Organization B');
   ```

2. **Create data in Org A**:
   ```bash
   curl -X POST "http://localhost:8989/api/items?organization_slug=org-a" \
     -d '{"name": "Item from Org A"}'
   ```

3. **Try to fetch from Org B**:
   ```bash
   curl "http://localhost:8989/api/items?organization_slug=org-b"
   ```

4. **Expected result**: Empty array `[]` (NOT Org A's data)

5. **Try to access Org A's item with Org B credentials**:
   ```bash
   curl "http://localhost:8989/api/items/[org-a-item-id]?organization_slug=org-b"
   ```

6. **Expected result**: 404 Not Found (NOT Org A's data)

---

## Common Mistakes & Fixes

### ❌ Mistake 1: Forgot organization_id filter

```javascript
// BAD - Will return ALL organizations' data!
const { data } = await supabase
  .from('contacts')
  .select('*');
```

```javascript
// GOOD
const { data } = await supabase
  .from('contacts')
  .select('*')
  .eq('organization_id', organizationId);
```

---

### ❌ Mistake 2: Filtered only parent, not joined table

```javascript
// BAD - line_items from other orgs can leak
const { data } = await supabase
  .from('sales_orders')
  .select('*, line_items:sales_order_items(*)')
  .eq('organization_id', organizationId);  // ← Only filters sales_orders!
```

```javascript
// GOOD
const { data } = await supabase
  .from('sales_orders')
  .select('*, line_items:sales_order_items(*)')
  .eq('organization_id', organizationId)
  .eq('line_items.organization_id', organizationId);  // ← Also filters joined table
```

---

### ❌ Mistake 3: Using wrong organization_id variable

```javascript
// BAD - Hardcoded or using wrong variable
const { data } = await supabase
  .from('contacts')
  .select('*')
  .eq('organization_id', '123');  // ← Hardcoded UUID!
```

```javascript
// GOOD - Use validated organizationId from request
const organizationId = org.id;  // From validation step
const { data } = await supabase
  .from('contacts')
  .select('*')
  .eq('organization_id', organizationId);
```

---

### ❌ Mistake 4: UPDATE without organization filter

```javascript
// BAD - Can accidentally update another org's data!
const { data } = await supabase
  .from('contacts')
  .update({ name: 'Hacked!' })
  .eq('id', itemId);  // ← Missing organization_id check
```

```javascript
// GOOD - Double filter by ID + organization
const { data } = await supabase
  .from('contacts')
  .update({ name: 'Valid Update' })
  .eq('id', itemId)
  .eq('organization_id', organizationId);  // ← Prevents cross-org update
```

---

## Database-Level Protection (Row-Level Security)

In addition to application-level filtering, enable RLS policies:

```sql
-- Enable RLS on table
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation ON your_table
  FOR ALL
  USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
  );
```

**Note**: This is **defense-in-depth**. Still add `.eq('organization_id')` in queries!

---

## Debugging Data Leaks

If you suspect a data leak:

1. **Add logging to all queries**:
   ```javascript
   console.log(`🔍 Query: ${table} with org_id=${organizationId}`);
   const { data } = await supabase.from(table).select('*').eq('organization_id', organizationId);
   console.log(`✅ Returned ${data?.length || 0} rows`);
   ```

2. **Check for missing filters**:
   ```bash
   # Search for queries without organization_id filter
   grep -r "supabase.from" server/ | grep -v "organization_id"
   ```

3. **Verify in database**:
   ```sql
   -- Check if all rows have organization_id
   SELECT
     COUNT(*) as total,
     COUNT(organization_id) as with_org_id
   FROM your_table;

   -- If total != with_org_id, you have orphaned data!
   ```

---

## Related Patterns

- **API Design**: `/docs/patterns/api-design.md`
- **Database Schema**: `/docs/patterns/database-schema.md`
- **Session Validation**: `/docs/patterns/session-validation.md`

---

Last Updated: 2025-11-28
