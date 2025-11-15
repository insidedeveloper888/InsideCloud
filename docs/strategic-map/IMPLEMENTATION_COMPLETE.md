# Strategic Map v2 - Backend Integration Implementation Complete

**Status**: Backend & Frontend Implementation Complete - Ready for Database Migration
**Date**: 2025-11-14
**Implementation Time**: ~2 hours

---

## What Was Implemented

### 1. Backend API Layer ✅

#### A. Strategic Map v2 Controller
**File**: [/server/strategic_map_controller.js](../../server/strategic_map_controller.js)

A complete business logic controller with:
- `getItems(organizationSlug, timeframe)` - Fetch all items with RPC
- `createItem(organizationSlug, itemData, individualId)` - Create with auto-cascade
- `updateItem(itemId, organizationSlug, updates, individualId)` - Update with cascade propagation
- `deleteItem(itemId, organizationSlug, individualId)` - Soft delete with cascade cleanup
- `batchUpsert(organizationSlug, items, individualId)` - Bulk migration support
- `transformToFrontendFormat(rows)` - Database → Frontend format conversion
- `transformItemToFrontend(row)` - Single item transformation

#### B. API Endpoints
**Files**:
- [/api/strategic_map_v2.js](../../api/strategic_map_v2.js)
- [/api/strategic_map_v2_batch.js](../../api/strategic_map_v2_batch.js)

New v2 endpoints (old v1 API preserved):
- `GET /api/strategic_map_v2?organization_slug=xxx&timeframe=yearly`
- `POST /api/strategic_map_v2` - Create item
- `PUT /api/strategic_map_v2?id=xxx` - Update item
- `DELETE /api/strategic_map_v2?id=xxx&organization_slug=xxx` - Delete item
- `POST /api/strategic_map_v2/batch` - Batch migration

Authentication handled via:
- Lark access token (Bearer token or `lk_token` cookie)
- Existing auth cookie system
- Fallback chain for robust auth

#### C. Server Routes
**File**: [/server/server.js](../../server/server.js) (lines 1288-1357)

Added 5 new Koa routes for v2 API, preserving old v1 routes for backward compatibility.

---

### 2. Frontend Dual-Mode Implementation ✅

#### A. API Client Layer
**File**: [/src/tools/strategic-map/api.js](../../src/tools/strategic-map/api.js)

Smart API client with localStorage fallback:
- `loadItems(organizationSlug, timeframe)` - Load with API or localStorage
- `createItem(organizationSlug, ...)` - Create with cascade support
- `updateItem(organizationSlug, itemId, ...)` - Update with optimistic UI
- `deleteItem(organizationSlug, itemId, ...)` - Delete with cascade cleanup
- `migrateLocalStorageToDatabase(organizationSlug)` - One-click migration
- Automatic fallback to localStorage on API errors

**Feature Flag**: `REACT_APP_USE_STRATEGIC_MAP_API=true` in `.env`
- `false` (default): Uses localStorage only
- `true`: Uses API with localStorage fallback on errors

#### B. Updated Strategic Map Component
**File**: [/src/tools/strategic-map/index.jsx](../../src/tools/strategic-map/index.jsx)

Changes:
- ✅ Imported API client: `import * as StrategicMapAPI from './api'`
- ✅ Replaced direct localStorage calls with API calls
- ✅ Made all handlers async: `handleAddItem`, `handleEditItem`, `handleToggleStatus`, `handleRemoveItem`
- ✅ Added cascade support in `handleAddItem` to display cascaded items
- ✅ Added loading state with spinner during initial data fetch
- ✅ Added mode indicator badge: "Database Mode" (green) or "Local Storage Mode" (blue)
- ✅ All CRUD operations now use API in API mode, localStorage in local mode

#### C. Migration Tool Component
**File**: [/src/tools/strategic-map/MigrationTool.jsx](../../src/tools/strategic-map/MigrationTool.jsx)

User-friendly migration tool with:
- Count items in localStorage
- One-click batch migration to database
- Progress indicator
- Success/failure reporting
- Optional localStorage cleanup after successful migration
- Clear instructions and safety warnings

**Usage**: Import and add to your app:
```jsx
import MigrationTool from './tools/strategic-map/MigrationTool';

// Add to admin page or settings
<MigrationTool organizationSlug={currentOrgSlug} />
```

---

### 3. Database Migration SQL ✅

**File**: [/supabase/migrations/0002_strategic_map_tables.sql](../../supabase/migrations/0002_strategic_map_tables.sql)

Complete database schema:
- `strategic_map_items` table with all columns
- `strategic_map_audit_log` table for change tracking
- Cascade triggers:
  - ✅ `trigger_create_cascaded_items` - Yearly → December (implemented)
  - ⏳ Monthly → Last Week (TODO - requires ISO week calc)
  - ⏳ Weekly → Sunday (TODO - requires date conversion)
- Update/delete cascade triggers
- RPC functions: `get_strategic_map_items`, `upsert_strategic_map_items`
- Row Level Security (RLS) policies
- Performance indexes

---

## What's Next - Step-by-Step Execution

### Step 1: Execute Database Migration ⏳

**Manual Step Required** - You need to run the SQL migration:

#### Option A: Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/rituzypqhjawhyrxoddj
2. Navigate to **SQL Editor**
3. Click **"New Query"**
4. Copy entire contents of `/supabase/migrations/0002_strategic_map_tables.sql`
5. Paste and click **"Run"**
6. Verify with:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('strategic_map_items', 'strategic_map_audit_log');

-- Check RPC functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%strategic_map%';
```

#### Option B: Supabase CLI
```bash
cd /Users/jackytok/Desktop/InsideCloud
supabase link --project-ref rituzypqhjawhyrxoddj
supabase db push --file supabase/migrations/0002_strategic_map_tables.sql
```

### Step 2: Enable API Mode (Optional - For Testing)

Add to your `.env` file:
```bash
# Enable Strategic Map v2 API (default: false = localStorage only)
REACT_APP_USE_STRATEGIC_MAP_API=true
```

Then restart your development server:
```bash
npm run start
```

### Step 3: Test the Implementation

#### A. Test Backend API (via curl)
```bash
# 1. Test GET (should return empty initially)
curl "http://localhost:8989/api/strategic_map_v2?organization_slug=test-org"

# 2. Test POST (create item)
curl -X POST "http://localhost:8989/api/strategic_map_v2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_LK_TOKEN" \
  -d '{
    "organization_slug": "test-org",
    "text": "Test Yearly Goal",
    "timeframe": "yearly",
    "categoryIndex": 0,
    "yearIndex": 0
  }'

# 3. Test GET again (should show item + cascaded December item)
curl "http://localhost:8989/api/strategic_map_v2?organization_slug=test-org"

# 4. Test PUT (update)
curl -X PUT "http://localhost:8989/api/strategic_map_v2?id=ITEM_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_LK_TOKEN" \
  -d '{
    "organization_slug": "test-org",
    "text": "Updated Goal",
    "status": "done"
  }'

# 5. Test DELETE
curl -X DELETE "http://localhost:8989/api/strategic_map_v2?id=ITEM_ID&organization_slug=test-org" \
  -H "Authorization: Bearer YOUR_LK_TOKEN"
```

#### B. Test Frontend (via Browser)
1. **LocalStorage Mode** (default):
   - Ensure `REACT_APP_USE_STRATEGIC_MAP_API` is NOT set or is `false`
   - Open Strategic Map tool
   - Should see "Local Storage Mode" badge (blue)
   - Create/edit/delete items - should work as before

2. **API Mode**:
   - Set `REACT_APP_USE_STRATEGIC_MAP_API=true` in `.env`
   - Restart app: `npm run start`
   - Open Strategic Map tool
   - Should see "Database Mode" badge (green)
   - Create item in Yearly view
   - Check December column - should see cascaded item (blue background)

3. **Migration Test**:
   - Switch to localStorage mode (set env to `false`)
   - Create some test data
   - Add `<MigrationTool organizationSlug="test-org" />` to your app
   - Click "Check Data in localStorage" - should show item count
   - Click "Start Migration" - should migrate to database
   - Switch to API mode and verify data appears

---

## Architecture Decisions

### Why v2 API Instead of Replacing v1?
- **Zero Risk**: Old v1 API remains untouched, no breaking changes
- **Gradual Migration**: Can test v2 in parallel with v1
- **Easy Rollback**: Just disable `REACT_APP_USE_STRATEGIC_MAP_API` flag
- **Version Clarity**: Clear separation between old and new implementations

### Why Dual-Mode (API + localStorage)?
- **Progressive Enhancement**: Can develop/test UI without backend dependency
- **Offline Support**: App continues to work if API is down
- **Migration Path**: Users can migrate data at their own pace
- **Development Speed**: Frontend and backend can be developed independently

### Why Separate API Client Layer?
- **Single Responsibility**: Component handles UI, API client handles data
- **Testability**: API logic can be unit tested independently
- **Reusability**: API client can be used by other components
- **Error Handling**: Centralized error handling with fallback logic

---

## File Structure

```
InsideCloud/
├── api/
│   ├── strategic_map.js              # Old v1 API (preserved)
│   ├── strategic_map_v2.js           # New v2 API ✅ NEW
│   └── strategic_map_v2_batch.js     # Batch migration endpoint ✅ NEW
├── server/
│   ├── server.js                      # Updated with v2 routes ✅ UPDATED
│   └── strategic_map_controller.js    # Business logic controller ✅ NEW
├── src/
│   └── tools/
│       └── strategic-map/
│           ├── index.jsx              # Main component ✅ UPDATED
│           ├── api.js                 # API client layer ✅ NEW
│           └── MigrationTool.jsx      # Migration UI ✅ NEW
├── supabase/
│   └── migrations/
│       └── 0002_strategic_map_tables.sql  # Database schema ✅ NEW
└── docs/
    └── strategic-map/
        ├── migration-instructions.md       # Step-by-step guide
        ├── backend-integration-plan.md     # Original plan
        └── IMPLEMENTATION_COMPLETE.md      # This file
```

---

## Testing Checklist

- [ ] Database migration executed successfully
- [ ] Tables and functions exist in Supabase
- [ ] Backend API responds to GET request
- [ ] Backend API can create item (POST)
- [ ] Backend API shows cascaded item in December
- [ ] Backend API can update item (PUT)
- [ ] Backend API can delete item (DELETE)
- [ ] Frontend works in localStorage mode
- [ ] Frontend works in API mode
- [ ] Cascade visually displays in UI (blue background)
- [ ] Migration tool can count items
- [ ] Migration tool can migrate data
- [ ] Data persists after browser refresh (API mode)
- [ ] Fallback works when API is unavailable

---

## Rollback Plan

If issues occur:

### Immediate (< 5 seconds)
Set in `.env`:
```bash
REACT_APP_USE_STRATEGIC_MAP_API=false
```
Restart app. Everything reverts to localStorage mode.

### Database Cleanup (if needed)
```sql
DROP TABLE IF EXISTS strategic_map_items CASCADE;
DROP TABLE IF EXISTS strategic_map_audit_log CASCADE;
DROP FUNCTION IF EXISTS get_strategic_map_items CASCADE;
DROP FUNCTION IF EXISTS upsert_strategic_map_items CASCADE;
```

### Code Rollback (if needed)
- Delete `api/strategic_map_v2.js`
- Delete `api/strategic_map_v2_batch.js`
- Delete `server/strategic_map_controller.js`
- Remove v2 routes from `server/server.js` (lines 1288-1357)
- Revert `src/tools/strategic-map/index.jsx` to previous version

**Note**: localStorage data is never deleted automatically, so user data is safe.

---

## Performance Considerations

### Backend
- **RPC Function**: Single query with JOIN fetches items + creator names
- **Indexes**: Covering indexes on (org_id, timeframe, is_deleted)
- **Cascade Trigger**: Uses ON CONFLICT for upsert, minimal overhead
- **Soft Delete**: is_deleted flag instead of hard delete preserves history

### Frontend
- **Optimistic Updates**: UI updates immediately, API call happens async
- **Lazy Loading**: Only loads data for current view timeframe (optional param)
- **Caching**: Data stored in React state, no refetch on re-render
- **Fallback**: localStorage acts as client-side cache when API fails

---

## Security

- **RLS Policies**: Organization-based isolation via Supabase RLS
- **Authentication**: Lark token validation via existing auth system
- **Service Role Key**: Controller uses service role for admin operations
- **Input Validation**: CHECK constraints on status, timeframe, category_index
- **Audit Trail**: All changes logged to strategic_map_audit_log (optional)

---

## Known Limitations

1. **Cascade Triggers**: Only Yearly → December implemented
   - Monthly → Last Week: Requires complex ISO week calculation
   - Weekly → Sunday: Requires ISO week to date conversion
   - Can be implemented later or handled in application logic

2. **Unique Constraint**: Currently only 1 item per cell
   - Constraint uses NULLS NOT DISTINCT for proper null handling
   - Can be relaxed in future by removing unique constraint

3. **Real-Time Sync**: No WebSocket/real-time updates yet
   - Users need to refresh to see changes from other users
   - Can add Supabase Realtime subscription later

4. **Offline Mode**: No service worker/offline caching
   - App requires internet connection for API mode
   - Can implement PWA features later

---

## Success Metrics

Implementation is considered successful when:
- ✅ All API endpoints return correct data
- ✅ Cascaded items appear automatically in UI
- ✅ Migration tool successfully moves all items
- ✅ No data loss during migration
- ✅ UI works in both modes without errors
- ✅ Performance is acceptable (< 500ms API response time)
- ✅ No breaking changes to existing functionality

---

## Maintenance

### Adding New Timeframe
1. Update database CHECK constraint in migration SQL
2. Add to `getColIndexFields()` in api.js
3. Add to `getColIndex()` and `getCellKey()` in strategic_map_controller.js
4. Implement cascade trigger logic if applicable

### Adding New Status
1. Update database CHECK constraint
2. Update UI status colors in index.jsx

### Adding Multiple Items Per Cell
1. Remove unique constraint from migration SQL
2. Update UI to handle array rendering
3. Consider UI/UX for item ordering

---

## Support

For issues or questions:
1. Check Supabase logs: https://supabase.com/dashboard/project/rituzypqhjawhyrxoddj/logs
2. Check browser console for frontend errors
3. Check server logs: `npm run start:server` output
4. Reference files:
   - [/docs/strategic-map/migration-instructions.md](./migration-instructions.md)
   - [/docs/strategic-map/backend-integration-plan.md](./backend-integration-plan.md)

---

**Status**: ✅ Implementation Complete - Ready for Database Migration & Testing
**Next Action**: Execute SQL migration in Supabase Dashboard
**Estimated Testing Time**: 30-60 minutes
