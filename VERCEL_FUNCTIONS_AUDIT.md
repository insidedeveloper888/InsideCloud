# Vercel Serverless Functions Audit

**Current Limit**: 12 functions on Hobby plan
**Current Count**: 15 functions (3 over limit)

## ✅ ACTIVELY USED Functions (11 total)

These are called by your frontend and MUST be kept:

### Core Features
1. **`api/organization.js`** ✅ NEW
   - Used by: Strategic Map v2 for realtime sync
   - Purpose: Fetch organization ID by slug
   - Location: `src/tools/strategic-map/index.jsx:309`

2. **`api/strategic_map_v2.js`** ✅ NEW
   - Used by: Strategic Map v2 tool (GET, POST, PUT, DELETE)
   - Purpose: CRUD operations for strategic map items with auto-cascade
   - Locations: `src/tools/strategic-map/api.js` (multiple lines)

3. **`api/strategic_map_v2_batch.js`** ✅ NEW
   - Used by: Strategic Map v2 batch operations
   - Purpose: Batch create/update/delete items
   - Location: `src/tools/strategic-map/api.js:290`

### Admin Features
4. **`api/admin/organizations.js`** ✅
   - Used by: Home page admin panel
   - Purpose: Manage organizations (create, list)
   - Locations: `src/pages/home/index.js:418,451`

5. **`api/get_audit_logs.js`** ✅
   - Used by: Home page audit log viewer
   - Purpose: Fetch audit logs for organizations
   - Location: `src/pages/home/index.js:274`

6. **`api/get_supabase_members.js`** ✅
   - Used by: Home page member management
   - Purpose: Fetch organization members from Supabase
   - Location: `src/pages/home/index.js:116`

7. **`api/get_organization_config.js`** ✅
   - Used by: Organization selector and home page
   - Purpose: Fetch org configuration (theme, settings)
   - Locations: `src/pages/home/index.js:653`, `src/components/organizationSelector/index.js:69`

8. **`api/get_bitable_tables.js`** ✅
   - Used by: Bitable tables component
   - Purpose: Fetch Lark bitable tables
   - Location: `src/components/bitableTables/index.js:15`

### Lark Authentication (Referenced in Config)
9. **`api/get_user_access_token.js`** ✅
   - Used by: Lark authentication flow
   - Referenced in: `src/config/client_config.js:5`

10. **`api/get_sign_parameters.js`** ✅
    - Used by: Lark JSAPI signature
    - Referenced in: `src/config/client_config.js:6`

11. **`api/get_organization_members.js`** ✅
    - Used by: Organization member listing (Lark)
    - Referenced in: `src/config/client_config.js:7`

## ⚠️ POTENTIALLY UNUSED Functions (2 total)

These are referenced in config but may not be actively used:

12. **`api/get_departments.js`** ⚠️
    - Referenced in: `src/config/client_config.js:8`
    - No direct usage found in current codebase
    - **Recommendation**: Keep if using Lark department features, otherwise DELETE

13. **`api/get_department_users.js`** ⚠️
    - Referenced in: `src/config/client_config.js:9`
    - No direct usage found in current codebase
    - **Recommendation**: Keep if using Lark department features, otherwise DELETE

## ❌ CONFIRMED UNUSED Functions (1 total)

These can be safely deleted:

14. **`api/strategic_map.js`** ❌ DELETE THIS
    - **OLD VERSION**: Replaced by strategic_map_v2.js
    - No references found in codebase
    - **Action**: Safe to delete immediately

## 📋 Helper Files (Not Counted as Functions)

These are imported by other functions, not exposed as endpoints:

- **`api/_utils.js`** - Utility functions (auth, CORS, responses)
- **`api/supabase_helper.js`** - Supabase client helper

---

## Recommended Actions to Get Under 12 Functions

### Option 1: Delete Old Strategic Map (Quick Fix)
Delete `api/strategic_map.js` → **14 functions → still 2 over limit**

### Option 2: Remove Unused Department APIs (If Not Needed)
If you're not using Lark department features:
- Delete `api/get_departments.js`
- Delete `api/get_department_users.js`
- Delete `api/strategic_map.js`

**Result**: 11 functions → ✅ Under limit!

### Option 3: Consolidate Lark APIs (Advanced)
Combine all Lark-related endpoints into one function with route handling:
- Merge `get_user_access_token.js`, `get_sign_parameters.js`, `get_organization_members.js`, `get_departments.js`, `get_department_users.js`
- Into a single `api/lark.js` with query parameter routing

**Result**: Could get down to 7 functions total

---

## Files to Delete (Recommended)

```bash
# Safe to delete (100% confirmed unused)
rm api/strategic_map.js

# Delete if not using Lark departments
rm api/get_departments.js
rm api/get_department_users.js
```

After deletion, commit and push:
```bash
git add -A
git commit -m "Remove unused API endpoints to meet Vercel function limit"
git push
```
