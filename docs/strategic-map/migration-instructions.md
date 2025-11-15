# Strategic Map v2 - Backend Migration Instructions

**Status**: Ready for Execution
**Date**: 2025-11-14

---

## Step 1: Execute Database Migration

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/rituzypqhjawhyrxoddj
2. Navigate to **SQL Editor**
3. Click **"New Query"**
4. Copy the entire contents of `/supabase/migrations/0002_strategic_map_tables.sql`
5. Paste into the SQL Editor
6. Click **"Run"** to execute
7. Verify success:
   ```sql
   -- Check if tables exist
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('strategic_map_items', 'strategic_map_audit_log');

   -- Check if functions exist
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name LIKE '%strategic_map%';
   ```

### Option B: Using Supabase CLI

```bash
cd /Users/jackytok/Desktop/InsideCloud

# Install Supabase CLI if not installed
# npm install -g supabase

# Link to your project
supabase link --project-ref rituzypqhjawhyrxoddj

# Run migration
supabase db push --file supabase/migrations/0002_strategic_map_tables.sql
```

### Verification Queries

After migration, run these to verify:

```sql
-- 1. Check table structure
\d strategic_map_items

-- 2. Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'strategic_map_items';

-- 3. Check triggers
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'strategic_map_items';

-- 4. Check RPC functions
SELECT proname, pronargs
FROM pg_proc
WHERE proname LIKE '%strategic_map%';

-- 5. Test RPC function (should return empty array)
SELECT * FROM get_strategic_map_items(
  '<your-org-id>'::uuid,
  NULL
);
```

---

## Step 2: Update API Handler

The current `/api/strategic_map.js` is for the old v1 schema. We need to update it to use our new controller.

### Option A: Replace Entire File

Create a new `/api/strategic_map.js`:

```javascript
const { handleCors, failResponse } = require('./_utils');
const StrategicMapController = require('../server/strategic_map_controller');

const controller = new StrategicMapController(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Strategic Map v2 API Handler
 * Handles GET, POST, PUT, DELETE for strategic map items
 */
module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  const method = req.method;
  const query = req.query || {};
  const body = req.body || {};

  try {
    // GET: Fetch items
    if (method === 'GET') {
      const { organization_slug, timeframe } = query;

      if (!organization_slug) {
        return res.status(400).json(failResponse('organization_slug is required'));
      }

      const result = await controller.getItems(organization_slug, timeframe);
      return res.status(200).json(result);
    }

    // POST: Create item
    if (method === 'POST') {
      const { organization_slug, ...itemData } = body;

      if (!organization_slug) {
        return res.status(400).json(failResponse('organization_slug is required'));
      }

      // Get individual_id from auth (simplified - you may need to enhance this)
      const individualId = req.auth?.individualId || body.individual_id;

      if (!individualId) {
        return res.status(401).json(failResponse('Authentication required'));
      }

      const result = await controller.createItem(organization_slug, itemData, individualId);
      return res.status(200).json(result);
    }

    // PUT: Update item
    if (method === 'PUT') {
      const { id } = query;
      const { organization_slug, ...updates } = body;

      if (!id || !organization_slug) {
        return res.status(400).json(failResponse('id and organization_slug are required'));
      }

      const individualId = req.auth?.individualId || body.individual_id;

      if (!individualId) {
        return res.status(401).json(failResponse('Authentication required'));
      }

      const result = await controller.updateItem(id, organization_slug, updates, individualId);
      return res.status(200).json(result);
    }

    // DELETE: Delete item
    if (method === 'DELETE') {
      const { id, organization_slug } = query;

      if (!id || !organization_slug) {
        return res.status(400).json(failResponse('id and organization_slug are required'));
      }

      const individualId = req.auth?.individualId || query.individual_id;

      if (!individualId) {
        return res.status(401).json(failResponse('Authentication required'));
      }

      const result = await controller.deleteItem(id, organization_slug, individualId);
      return res.status(200).json(result);
    }

    return res.status(405).json(failResponse('Method not allowed'));
  } catch (error) {
    console.error('Strategic Map API error:', error);
    return res.status(500).json(failResponse(error.message || 'Internal server error'));
  }
};
```

### Option B: Keep Old API, Add New Routes

If you want to keep the old v1 API working, create new routes:

```javascript
// In server/server.js, add:
router.get('/api/v2/strategic_map', async (ctx) => {
  const StrategicMapController = require('./strategic_map_controller');
  const controller = new StrategicMapController(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const result = await controller.getItems(ctx.query.organization_slug, ctx.query.timeframe);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, error: error.message };
  }
});

// Similar for POST, PUT, DELETE
```

---

## Step 3: Update Frontend to Use API

Add environment variable to control API usage:

### 1. Add to `.env`:
```bash
REACT_APP_USE_STRATEGIC_MAP_API=true
```

### 2. Update `/src/tools/strategic-map/index.jsx`:

Add at the top of the component:

```javascript
const USE_API = process.env.REACT_APP_USE_STRATEGIC_MAP_API === 'true';
const API_BASE = process.env.REACT_APP_API_BASE || '';
```

### 3. Update Data Loading:

```javascript
// Load data (dual-mode)
const loadData = useCallback(async () => {
  if (USE_API) {
    try {
      const response = await axios.get(
        `${API_BASE}/api/strategic_map?organization_slug=${organizationSlug}`
      );
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to load data');
      }
    } catch (error) {
      console.error('API load failed, falling back to localStorage:', error);
      return loadFromLocalStorage();
    }
  } else {
    return loadFromLocalStorage();
  }
}, [organizationSlug]);

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}
```

### 4. Update Item Creation:

```javascript
const handleAddItem = useCallback(async (timeframe, rowIndex, colIndex, text) => {
  if (USE_API) {
    try {
      const response = await axios.post(`${API_BASE}/api/strategic_map`, {
        organization_slug: organizationSlug,
        text,
        status: 'neutral',
        timeframe,
        categoryIndex: rowIndex,
        ...getColIndexFields(timeframe, colIndex)
      });

      if (response.data.success) {
        // Refresh data to get cascaded items
        const refreshedData = await loadData();
        setData(refreshedData);
      }
    } catch (error) {
      console.error('API save failed:', error);
      // Fallback to localStorage
      saveToLocalStorage(timeframe, rowIndex, colIndex, text);
    }
  } else {
    saveToLocalStorage(timeframe, rowIndex, colIndex, text);
  }
}, [organizationSlug, loadData]);

function getColIndexFields(timeframe, colIndex) {
  switch (timeframe) {
    case 'yearly':
      return { yearIndex: colIndex };
    case 'monthly':
      return { monthColIndex: colIndex };
    case 'weekly':
      return { weekNumber: colIndex };
    case 'daily':
      return { dailyDateKey: colIndex };
  }
}
```

---

## Step 4: Create Data Migration Tool

Create `/src/tools/strategic-map/components/DataMigrationTool.jsx`:

```javascript
import React, { useState } from 'react';
import axios from 'axios';

const DataMigrationTool = ({ organizationSlug }) => {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);

  const handleMigrate = async () => {
    setStatus('migrating');

    try {
      // 1. Load from localStorage
      const localData = JSON.parse(
        localStorage.getItem(`strategic_map_${organizationSlug}`) || '{}'
      );

      // 2. Transform to API format
      const items = [];
      Object.entries(localData).forEach(([cellKey, cellItems]) => {
        const [timeframe, categoryIndex, colIndex] = cellKey.split('_');

        cellItems.forEach(item => {
          items.push({
            text: item.text,
            status: item.status,
            timeframe,
            category_index: parseInt(categoryIndex),
            ...getColIndexFields(timeframe, parseInt(colIndex))
          });
        });
      });

      // 3. Batch upload
      const response = await axios.post('/api/strategic_map/batch', {
        organization_slug: organizationSlug,
        items
      });

      setResult(response.data);
      setStatus('success');

      // 4. Clear localStorage on success
      if (response.data.data.failed === 0) {
        localStorage.removeItem(`strategic_map_${organizationSlug}`);
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setStatus('error');
      setResult({ error: error.message });
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Data Migration Tool</h3>
      <p className="text-sm mb-4">
        Migrate your Strategic Map data from localStorage to database.
      </p>

      <button
        onClick={handleMigrate}
        disabled={status === 'migrating'}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {status === 'migrating' ? 'Migrating...' : 'Start Migration'}
      </button>

      {result && (
        <div className="mt-4">
          {status === 'success' && (
            <div className="text-green-600">
              ✅ Migration successful!
              <br />
              Created: {result.data.created}
              <br />
              Failed: {result.data.failed}
            </div>
          )}
          {status === 'error' && (
            <div className="text-red-600">
              ❌ Migration failed: {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function getColIndexFields(timeframe, colIndex) {
  switch (timeframe) {
    case 'yearly':
      return { year_index: colIndex };
    case 'monthly':
      return { month_col_index: colIndex };
    case 'weekly':
      return { week_number: colIndex };
    case 'daily':
      return { daily_date_key: colIndex };
  }
}

export default DataMigrationTool;
```

---

## Step 5: Testing Checklist

### Backend Testing:

```bash
# 1. Test GET (empty result initially)
curl "http://localhost:8989/api/strategic_map?organization_slug=test-org"

# 2. Test POST (create item)
curl -X POST "http://localhost:8989/api/strategic_map" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_slug": "test-org",
    "text": "Test Goal",
    "timeframe": "yearly",
    "categoryIndex": 0,
    "yearIndex": 0
  }'

# 3. Test GET again (should show item + cascaded Dec item)
curl "http://localhost:8989/api/strategic_map?organization_slug=test-org"

# 4. Test PUT (update item)
curl -X PUT "http://localhost:8989/api/strategic_map?id=<item-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_slug": "test-org",
    "text": "Updated Goal",
    "status": "done"
  }'

# 5. Test DELETE
curl -X DELETE "http://localhost:8989/api/strategic_map?id=<item-id>&organization_slug=test-org"
```

### Frontend Testing:

1. Set `REACT_APP_USE_STRATEGIC_MAP_API=false` - Test localStorage mode
2. Create some test data
3. Set `REACT_APP_USE_STRATEGIC_MAP_API=true` - Test API mode
4. Use migration tool to migrate data
5. Verify data appears in API mode
6. Test create/edit/delete operations
7. Verify cascades work (Yearly → Dec, etc.)

---

## Rollback Plan

If issues occur:

1. **Immediate**: Set `REACT_APP_USE_STRATEGIC_MAP_API=false` to revert to localStorage
2. **Database**: Drop tables and functions:
   ```sql
   DROP TABLE IF EXISTS strategic_map_items CASCADE;
   DROP TABLE IF EXISTS strategic_map_audit_log CASCADE;
   DROP FUNCTION IF EXISTS get_strategic_map_items CASCADE;
   DROP FUNCTION IF EXISTS upsert_strategic_map_items CASCADE;
   ```
3. **Restore data**: localStorage data is preserved, no data loss

---

## Support

If you encounter issues:

1. Check Supabase logs: https://supabase.com/dashboard/project/rituzypqhjawhyrxoddj/logs
2. Check server logs: `npm run start:server` console output
3. Check browser console: Network tab + Console logs
4. Reference: `/docs/strategic-map/backend-integration-plan.md`

---

**Status**: Ready for execution
**Estimated Time**: 1-2 hours for complete migration
**Risk Level**: Low (localStorage fallback available)
