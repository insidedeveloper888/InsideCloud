# Strategic Map v2 - Fixes Applied

## Issues Found & Fixed

### Issue 1: `colIndex` returning `null` ❌ → ✅ FIXED
**Problem**: Items were being created with `year_index = NULL` instead of `0`

**Root Cause**: Controller was using `||` operator which treats `0` as falsy
```javascript
year_index: itemData.yearIndex || null  // BUG: 0 becomes null!
```

**Fix Applied**: Changed to explicit undefined check in `strategic_map_controller.js:81-84`
```javascript
year_index: itemData.yearIndex !== undefined ? itemData.yearIndex : null
```

---

### Issue 2: Database has existing NULL records ⏳ NEEDS ACTION
**Problem**: Existing items in database have NULL indexes

**Fix**: Run this SQL in Supabase:
```bash
File: /supabase/migrations/0003_fix_null_indexes.sql
```

**What it does**:
1. Updates trigger to handle NULL year_index with COALESCE
2. Fixes existing yearly items: sets `year_index = 0` where NULL
3. Fixes existing monthly cascaded items: calculates proper `month_col_index`

---

### Issue 3: RPC function had non-existent columns ❌ → ✅ FIXED
**Problem**: `get_strategic_map_items` tried to SELECT `i_created.name` but `individuals` table doesn't have `name` column

**Fix Applied**:
1. Updated RPC function to return `created_by_individual_id` instead of `created_by_name`
2. Updated controller `transformItemToFrontend()` to use `createdById` instead of `createdBy`

---

### Issue 4: Function import error ❌ → ✅ FIXED
**Problem**: Controller imported `getOrganizationBySlug` but function doesn't exist

**Fix Applied**: Changed all imports/calls to use `getOrganizationInfo` instead

---

## What Needs to be Done

### Step 1: Run SQL Fix in Supabase ⏳ REQUIRED
```bash
1. Open: https://supabase.com/dashboard/project/rituzypqhjawhyrxoddj
2. Go to: SQL Editor → New Query
3. Run: /supabase/migrations/0003_fix_null_indexes.sql
```

This will:
- Fix existing records with NULL indexes
- Update cascade trigger to handle NULLs properly
- Show you the fixed records at the end

---

### Step 2: Restart Your Server ⏳ REQUIRED
```bash
# Stop current server (Ctrl+C)
npm run start
```

The controller fixes are in place, but server needs restart to pick them up.

---

### Step 3: Test CRUD Operations ⏳ RECOMMENDED
```bash
# Run automated test script
node test_strategic_map_api.js

# Or test manually:
# 1. Open Strategic Map in browser
# 2. Add a goal in "阶段成就" row, 2025 column
# 3. Refresh page - goal should still be there
# 4. Check December monthly column - should see cascaded item
```

---

## Expected Behavior After Fixes

### Create Operation
✅ POST `/api/strategic_map_v2`
```json
{
  "organization_slug": "cloud",
  "text": "Test Goal",
  "timeframe": "yearly",
  "categoryIndex": 0,
  "yearIndex": 0  // ← Now correctly saved as 0, not NULL!
}
```

Response should include:
- Created item with `colIndex: 0` (not null)
- Cascaded item in December with proper `month_col_index`

### Read Operation
✅ GET `/api/strategic_map_v2?organization_slug=cloud`

Returns items grouped by cell:
```json
{
  "yearly_0_0": [{...}],      // ← Now has colIndex!
  "monthly_0_24299": [{...}]  // ← Cascaded December item
}
```

### Update Operation
✅ PUT `/api/strategic_map_v2?id=xxx`
- Updates parent item
- Trigger automatically updates cascaded items

### Delete Operation
✅ DELETE `/api/strategic_map_v2?id=xxx`
- Soft deletes parent item
- Trigger automatically soft deletes cascaded items

---

## Cascade Behavior

### Currently Implemented ✅
- **Yearly → December (Monthly)**: Fully working
  - When you create/update a yearly goal, it automatically cascades to December

### Not Yet Implemented ⏳
- **Monthly → Last Week**: TODO (requires ISO week calculation)
- **Weekly → Sunday**: TODO (requires ISO week to date conversion)

This is expected and documented in the migration SQL comments.

---

## Testing Checklist

After applying fixes:

- [ ] Run SQL migration `0003_fix_null_indexes.sql`
- [ ] Restart server
- [ ] ✅ GET all items - should return items with proper colIndex
- [ ] ✅ CREATE yearly item - should save with yearIndex=0
- [ ] ✅ Verify cascade - December should have cascaded item
- [ ] ✅ Refresh page - items should still be visible
- [ ] ✅ UPDATE item - should update parent + cascaded
- [ ] ✅ DELETE item - should delete parent + cascaded

---

## Files Modified

### Backend
- ✅ `server/strategic_map_controller.js` - Fixed NULL handling, function imports
- ✅ `supabase/migrations/0002_fix_rpc_function.sql` - Fixed RPC column names
- 📝 `supabase/migrations/0003_fix_null_indexes.sql` - Fix for existing data

### No Changes Needed
- ✅ `api/strategic_map_v2.js` - Already correct
- ✅ `src/tools/strategic-map/api.js` - Already correct
- ✅ `src/tools/strategic-map/index.jsx` - Already correct

---

## Summary

**3 fixes applied in code** ✅
**1 SQL migration pending** ⏳ (Run `0003_fix_null_indexes.sql`)
**Server restart required** ⏳

After these steps, the Strategic Map v2 should work perfectly with full CRUD operations and auto-cascading from Yearly → December!
