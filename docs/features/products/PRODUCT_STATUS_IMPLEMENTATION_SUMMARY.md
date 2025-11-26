# Product Status Feature - Implementation Summary

## What Was Implemented

Added product lifecycle status support to show "Coming Soon", "Beta", and "Deprecated" products in the dashboard with appropriate UX.

## Database Changes

### New Column: `products.status`

```sql
ALTER TABLE products
ADD COLUMN status TEXT DEFAULT 'active'
CHECK (status IN ('active', 'coming_soon', 'beta', 'deprecated'));
```

**Statuses:**
- `active` - Production ready (default)
- `coming_soon` - Show to all orgs, not accessible
- `beta` - Accessible with "Beta" badge
- `deprecated` - Show with disabled overlay

## Backend Changes

### 1. New Helper Function: `getDashboardProducts()`

**File**: `server/product_helper.js`

**Logic:**
- Returns Active/Beta/Deprecated products where org has access
- Returns ALL Coming Soon products (no access check)
- Combines and deduplicates
- Sorts by status priority

### 2. New API Endpoint: `/api/products/dashboard`

**File**: `server/server.js` (lines 1495-1534)

**Route**: `GET /api/products/dashboard?organization_slug={slug}`

**Purpose**: Returns products for dashboard display (includes coming_soon)

**Includes:**
- OPTIONS handler for CORS (line 1495)
- GET handler (line 1503)

### 3. Updated Existing Functions

**File**: `server/product_helper.js`

All database queries now include `status` column:
- `getOrganizationProducts()` (line 40)
- `getProductByKey()` (line 154)
- `getAllProducts()` (line 186)

## Frontend Changes

### 1. Dashboard Component with Status Handling

**File**: `src/pages/home/index.js` (lines 114-171)

**Features:**
- Detects product status
- Applies different styling for each status
- Shows "Coming Soon" overlay for coming_soon products
- Shows "Beta" badge for beta products
- Shows "Deprecated" overlay for deprecated products
- Disables click interaction for coming_soon and deprecated

### 2. Updated Hook

**File**: `src/hooks/useOrganizationProducts.js` (line 51)

Changed endpoint from `/api/products` to `/api/products/dashboard`

## Documentation Created

### 1. `docs/product-status-enhancement.sql`
- Complete migration script
- Example coming_soon products
- Verification queries

### 2. `docs/PRODUCT_STATUS_GUIDE.md`
- Complete guide for all 4 statuses
- Database schema explanation
- How to add coming_soon products
- API endpoints documentation
- Frontend implementation examples
- Common scenarios (launch, beta, deprecate)
- Best practices

## How to Use

### Step 1: Run Migration

```bash
# In Supabase SQL Editor or via psql
psql -h your-host -U postgres -d postgres -f docs/product-status-enhancement.sql
```

### Step 2: Add Coming Soon Products

```sql
INSERT INTO products (
  id, key, name, status, icon, ...
) VALUES (
  gen_random_uuid(),
  'work_specification',
  '工作规格',
  'coming_soon',  -- This makes it "Coming Soon"
  'SheetIcon',
  ...
);
```

### Step 3: Restart Dev Server

```bash
npm run start:server
```

### Step 4: View Dashboard

Visit your dashboard - coming_soon products will appear with "Coming Soon" overlay!

## Key Design Decisions

### 1. Separate Dashboard Endpoint

**Why:**
- `/api/products` - For access control (only accessible products)
- `/api/products/dashboard` - For display (includes coming_soon)
- Clean separation of concerns

### 2. Coming Soon Products Shown to All

**Why:**
- No need to create `organization_product_access` records
- Marketing/roadmap transparency
- Simpler to manage

**Logic:**
```javascript
if (status === 'coming_soon') {
  // Show to everyone, no access check
} else {
  // Check organization_product_access
}
```

### 3. Status Priority Ordering

**Order in dashboard:**
1. Active products (full functionality)
2. Beta products (with badge)
3. Coming soon products (disabled)
4. Deprecated products (disabled)

## Files Modified

### Created (3 files)
1. `docs/product-status-enhancement.sql` - Migration script
2. `docs/PRODUCT_STATUS_GUIDE.md` - Complete guide
3. `docs/PRODUCT_STATUS_IMPLEMENTATION_SUMMARY.md` - This file

### Modified (3 files)
1. `server/product_helper.js` - Added `getDashboardProducts()`, updated queries
2. `server/server.js` - Added `/api/products/dashboard` endpoint
3. `src/pages/home/index.js` - Enhanced dashboard with status handling
4. `src/hooks/useOrganizationProducts.js` - Changed to dashboard endpoint

## Testing Checklist

- [ ] Run migration script
- [ ] Add a coming_soon product via SQL
- [ ] Restart dev server
- [ ] Verify coming_soon product shows in dashboard
- [ ] Verify "Coming Soon" overlay appears
- [ ] Verify clicking does nothing
- [ ] Verify active products still work normally
- [ ] Test changing status from coming_soon → active
- [ ] Test beta status shows badge
- [ ] Build succeeds: ✅ (537.52 kB)

## Migration Path

### Existing Products
All existing products default to `status = 'active'`:
- ✅ strategic_map → active
- ✅ document_parser → active
- ✅ contact_management → active

No breaking changes!

### Future Products

**Recommended workflow:**
1. Create product with `status = 'coming_soon'`
2. Show in dashboard (builds anticipation)
3. Develop the feature
4. Beta test: `UPDATE products SET status = 'beta'` + grant access to select orgs
5. General launch: `UPDATE products SET status = 'active'` + grant access to all
6. Eventually: `UPDATE products SET status = 'deprecated'` (if retiring)

## Example Coming Soon Products

The migration includes two examples:

1. **Work Specification (工作规格)**
   - Key: `work_specification`
   - Icon: `SheetIcon`
   - Category: `hr`
   - Metadata: `{"planned_release": "2025-12"}`

2. **Promotion System (晋升机制)**
   - Key: `promotion_system`
   - Icon: `PromotionIcon`
   - Category: `hr`
   - Metadata: `{"planned_release": "2026-01"}`

These will show in all dashboards with "Coming Soon" overlay!

## Summary

✅ **Database**: Added `status` column with 4 states
✅ **Backend**: New dashboard endpoint returns coming_soon products
✅ **Frontend**: Enhanced UX for each status
✅ **Documentation**: Complete guides created
✅ **Build**: Verified successful (537.52 kB)

**Status**: Ready to use! Run migration and add your first coming_soon product.
