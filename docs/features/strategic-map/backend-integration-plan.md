# Strategic Map v2 - Backend Integration Plan

**Document Version**: 1.0
**Created**: 2025-11-14
**Status**: Planning Phase
**Target Completion**: TBD

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Database Design](#database-design)
4. [Backend API Design](#backend-api-design)
5. [Frontend Migration Strategy](#frontend-migration-strategy)
6. [Implementation Phases](#implementation-phases)
7. [Testing Strategy](#testing-strategy)
8. [Rollback Plan](#rollback-plan)

---

## 1. Executive Summary

### Objective
Migrate Strategic Map v2 from localStorage-only persistence to full backend integration with Supabase PostgreSQL, enabling multi-device sync, collaborative features, and robust data management.

### Key Deliverables
1. **Database Schema**: PostgreSQL tables, indexes, triggers for cascading logic
2. **Backend APIs**: RESTful endpoints for CRUD operations
3. **Frontend Migration**: Replace localStorage with API calls
4. **Data Migration**: Tool to migrate existing localStorage data to database
5. **Offline Support**: localStorage as cache layer for offline functionality

### Success Criteria
- ✅ All Strategic Map features work identically with database backend
- ✅ Cascading logic handled by PostgreSQL triggers
- ✅ Multi-device sync: changes on one device appear on others
- ✅ Performance: API response time < 300ms for typical operations
- ✅ Zero data loss during migration
- ✅ Backward compatibility during rollout

---

## 2. Current State Analysis

### Current Data Model (LocalStorage)

**Storage Key Pattern**:
```
strategic_map_{organizationSlug}
```

**Data Structure**:
```javascript
{
  // Cell key format: {timeframe}_{rowIndex}_{colIndex}
  "yearly_0_2": [
    {
      id: "1731596847123_k9x2p4q",  // timestamp_random
      text: "Achieve 50% revenue growth\nExpand to 3 new markets",
      status: "neutral",  // "neutral" | "done" | "fail"
      timeframe: "yearly",
      rowIndex: 0,  // Category index (0-5)
      colIndex: 2   // Year index or column identifier
    },
    {
      id: "1731596850456_m5t7r9w",
      text: "Launch new product line",
      status: "done",
      timeframe: "yearly",
      rowIndex: 0,
      colIndex: 2
    }
  ],
  "monthly_1_24306": [  // monthColIndex = year * 12 + monthIndex
    {
      id: "1731596920789_p2q8s1v",
      text: "Complete Q1 sales targets",
      status: "neutral",
      timeframe: "monthly",
      rowIndex: 1,
      colIndex: 24306  // 2025 * 12 + 6 (June 2025)
    }
  ],
  "weekly_2_45": [  // ISO week number
    {
      id: "1731597001234_w4x6y8z",
      text: "Finalize partnership contracts",
      status: "fail",
      timeframe: "weekly",
      rowIndex: 2,
      colIndex: 45  // ISO week 45
    }
  ],
  "daily_3_20251115": [  // YYYYMMDD format
    {
      id: "1731597088901_a3b5c7d",
      text: "Review quarterly reports",
      status: "done",
      timeframe: "daily",
      rowIndex: 3,
      colIndex: 20251115  // November 15, 2025
    }
  ]
}
```

### Current Limitations

1. **Single Device Only**: Data stored in browser localStorage, not synced across devices
2. **No Collaboration**: Multiple users in same organization can't see each other's updates
3. **No History/Audit**: Can't track who made changes or when
4. **No Cascade Persistence**: Cascaded items are computed on-the-fly, not stored
5. **No Offline Sync**: Changes made offline are lost if browser data is cleared
6. **Limited Scale**: localStorage has ~5-10MB limit per domain

### Current Features to Preserve

1. ✅ **Auto-Cascading**: Year → Dec, Month → Last Week, Week → Sunday
2. ✅ **Multi-line Goals**: Text with `\n` characters
3. ✅ **Status Tracking**: neutral → done → fail → neutral
4. ✅ **Auto-Expansion**: Today's year/month/week auto-expands
5. ✅ **Inline Editing**: Double-click to edit with Shift+Enter support
6. ✅ **Read-Only Cascades**: Cascaded cells can't be directly edited
7. ✅ **Organization Isolation**: Each org has separate data

---

## 3. Database Design

### Schema Overview

```sql
--=============================================
-- STRATEGIC MAP TABLES
--=============================================

-- Main table: Strategic Map Items
CREATE TABLE strategic_map_items (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-Tenant Context
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by_individual_id UUID NOT NULL REFERENCES individuals(id) ON DELETE RESTRICT,

  -- Item Content
  text TEXT NOT NULL,  -- Goal text (multi-line supported)
  status VARCHAR(20) NOT NULL DEFAULT 'neutral' CHECK (status IN ('neutral', 'done', 'fail')),

  -- Position & Hierarchy
  timeframe VARCHAR(20) NOT NULL CHECK (timeframe IN ('yearly', 'monthly', 'weekly', 'daily')),
  category_index INTEGER NOT NULL CHECK (category_index BETWEEN 0 AND 5),  -- 6 categories (0-5)

  -- Timeframe-Specific Identifiers
  year_index INTEGER,           -- For yearly: 0-based index in years array
  month_col_index INTEGER,      -- For monthly: year * 12 + monthIndex
  week_number INTEGER,          -- For weekly: ISO week number (1-53)
  daily_date_key INTEGER,       -- For daily: YYYYMMDD format

  -- Cascade Tracking
  parent_item_id UUID REFERENCES strategic_map_items(id) ON DELETE CASCADE,
  is_cascaded BOOLEAN NOT NULL DEFAULT FALSE,
  cascade_level INTEGER NOT NULL DEFAULT 0,  -- 0=original, 1=1st cascade, 2=2nd cascade, etc.

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by_individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,

  -- Indexes for Performance
  CONSTRAINT strategic_map_items_unique_position
    UNIQUE (organization_id, timeframe, category_index, year_index, month_col_index, week_number, daily_date_key)
    WHERE is_deleted = FALSE
);

-- Indexes
CREATE INDEX idx_strategic_map_org_timeframe ON strategic_map_items(organization_id, timeframe, is_deleted);
CREATE INDEX idx_strategic_map_org_year ON strategic_map_items(organization_id, year_index) WHERE timeframe = 'yearly';
CREATE INDEX idx_strategic_map_org_month ON strategic_map_items(organization_id, month_col_index) WHERE timeframe = 'monthly';
CREATE INDEX idx_strategic_map_org_week ON strategic_map_items(organization_id, week_number) WHERE timeframe = 'weekly';
CREATE INDEX idx_strategic_map_org_daily ON strategic_map_items(organization_id, daily_date_key) WHERE timeframe = 'daily';
CREATE INDEX idx_strategic_map_parent ON strategic_map_items(parent_item_id) WHERE parent_item_id IS NOT NULL;
CREATE INDEX idx_strategic_map_created_by ON strategic_map_items(created_by_individual_id);

-- Audit Log Table (Optional but Recommended)
CREATE TABLE strategic_map_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id UUID REFERENCES strategic_map_items(id) ON DELETE SET NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'status_change')),
  actor_individual_id UUID NOT NULL REFERENCES individuals(id) ON DELETE SET NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_strategic_map_audit_org_item ON strategic_map_audit_log(organization_id, item_id);
CREATE INDEX idx_strategic_map_audit_created_at ON strategic_map_audit_log(created_at DESC);
```

### Cascade Logic Triggers

```sql
--=============================================
-- CASCADE TRIGGERS
--=============================================

-- Function: Auto-create cascaded items
CREATE OR REPLACE FUNCTION create_cascaded_items()
RETURNS TRIGGER AS $$
DECLARE
  v_target_timeframe VARCHAR(20);
  v_target_category_index INTEGER;
  v_target_col_index INTEGER;
  v_new_item_id UUID;
BEGIN
  -- Only cascade on INSERT or UPDATE of original items (not cascaded ones)
  IF NEW.is_cascaded = TRUE THEN
    RETURN NEW;
  END IF;

  -- Determine cascade target based on timeframe
  CASE NEW.timeframe
    -- Yearly → Monthly (December)
    WHEN 'yearly' THEN
      v_target_timeframe := 'monthly';
      v_target_category_index := NEW.category_index;

      -- Calculate December column index: (year_index year) * 12 + 11
      -- Need to extract year from year_index
      -- Assuming year = currentYear + year_index
      v_target_col_index := (EXTRACT(YEAR FROM NOW())::INTEGER + NEW.year_index) * 12 + 11;

      -- Insert cascaded item in December
      INSERT INTO strategic_map_items (
        organization_id,
        created_by_individual_id,
        text,
        status,
        timeframe,
        category_index,
        month_col_index,
        parent_item_id,
        is_cascaded,
        cascade_level
      ) VALUES (
        NEW.organization_id,
        NEW.created_by_individual_id,
        NEW.text,
        NEW.status,
        v_target_timeframe,
        v_target_category_index,
        v_target_col_index,
        NEW.id,
        TRUE,
        NEW.cascade_level + 1
      )
      ON CONFLICT (organization_id, timeframe, category_index, year_index, month_col_index, week_number, daily_date_key)
      WHERE is_deleted = FALSE
      DO UPDATE SET
        text = EXCLUDED.text,
        status = EXCLUDED.status,
        updated_at = NOW(),
        updated_by_individual_id = EXCLUDED.created_by_individual_id;

    -- Monthly → Weekly (Last week of month)
    WHEN 'monthly' THEN
      -- TODO: Implement last week calculation
      -- Challenge: Need to determine last ISO week that overlaps with month
      RETURN NEW;

    -- Weekly → Daily (Sunday)
    WHEN 'weekly' THEN
      -- TODO: Implement Sunday calculation for given ISO week
      RETURN NEW;

    ELSE
      -- Daily items don't cascade further
      RETURN NEW;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Create cascaded items after insert/update
CREATE TRIGGER trigger_create_cascaded_items
AFTER INSERT OR UPDATE ON strategic_map_items
FOR EACH ROW
WHEN (NEW.is_deleted = FALSE)
EXECUTE FUNCTION create_cascaded_items();

-- Function: Delete cascaded items when parent is deleted
CREATE OR REPLACE FUNCTION delete_cascaded_items()
RETURNS TRIGGER AS $$
BEGIN
  -- Soft delete all child cascaded items
  UPDATE strategic_map_items
  SET
    is_deleted = TRUE,
    deleted_at = NOW(),
    deleted_by_individual_id = NEW.deleted_by_individual_id
  WHERE parent_item_id = OLD.id
    AND is_deleted = FALSE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Delete cascaded items when parent is deleted
CREATE TRIGGER trigger_delete_cascaded_items
AFTER UPDATE ON strategic_map_items
FOR EACH ROW
WHEN (NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE)
EXECUTE FUNCTION delete_cascaded_items();
```

### RPC Functions for Complex Queries

```sql
--=============================================
-- RPC FUNCTIONS
--=============================================

-- Get all items for a specific timeframe and organization
CREATE OR REPLACE FUNCTION get_strategic_map_items(
  p_organization_id UUID,
  p_timeframe VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  text TEXT,
  status VARCHAR(20),
  timeframe VARCHAR(20),
  category_index INTEGER,
  year_index INTEGER,
  month_col_index INTEGER,
  week_number INTEGER,
  daily_date_key INTEGER,
  parent_item_id UUID,
  is_cascaded BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by_name TEXT,
  updated_by_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    smi.id,
    smi.text,
    smi.status,
    smi.timeframe,
    smi.category_index,
    smi.year_index,
    smi.month_col_index,
    smi.week_number,
    smi.daily_date_key,
    smi.parent_item_id,
    smi.is_cascaded,
    smi.created_at,
    smi.updated_at,
    i_created.name AS created_by_name,
    i_updated.name AS updated_by_name
  FROM strategic_map_items smi
  LEFT JOIN individuals i_created ON smi.created_by_individual_id = i_created.id
  LEFT JOIN individuals i_updated ON smi.updated_by_individual_id = i_updated.id
  WHERE smi.organization_id = p_organization_id
    AND smi.is_deleted = FALSE
    AND (p_timeframe IS NULL OR smi.timeframe = p_timeframe)
  ORDER BY smi.timeframe, smi.category_index, smi.year_index, smi.month_col_index, smi.week_number, smi.daily_date_key;
END;
$$ LANGUAGE plpgsql;

-- Batch create/update items
CREATE OR REPLACE FUNCTION upsert_strategic_map_items(
  p_organization_id UUID,
  p_individual_id UUID,
  p_items JSONB  -- Array of items to upsert
)
RETURNS TABLE (
  id UUID,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_item JSONB;
  v_new_id UUID;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      INSERT INTO strategic_map_items (
        organization_id,
        created_by_individual_id,
        text,
        status,
        timeframe,
        category_index,
        year_index,
        month_col_index,
        week_number,
        daily_date_key
      ) VALUES (
        p_organization_id,
        p_individual_id,
        v_item->>'text',
        COALESCE(v_item->>'status', 'neutral'),
        v_item->>'timeframe',
        (v_item->>'category_index')::INTEGER,
        (v_item->>'year_index')::INTEGER,
        (v_item->>'month_col_index')::INTEGER,
        (v_item->>'week_number')::INTEGER,
        (v_item->>'daily_date_key')::INTEGER
      )
      ON CONFLICT (organization_id, timeframe, category_index, year_index, month_col_index, week_number, daily_date_key)
      WHERE is_deleted = FALSE
      DO UPDATE SET
        text = EXCLUDED.text,
        status = EXCLUDED.status,
        updated_at = NOW(),
        updated_by_individual_id = p_individual_id
      RETURNING strategic_map_items.id INTO v_new_id;

      RETURN QUERY SELECT v_new_id, TRUE, NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT NULL::UUID, FALSE, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Backend API Design

### API Endpoints

#### 1. GET /api/strategic_map

**Purpose**: Fetch all strategic map items for an organization

**Query Parameters**:
- `organization_slug` (required): Organization identifier
- `timeframe` (optional): Filter by timeframe ('yearly', 'monthly', 'weekly', 'daily')

**Response**:
```json
{
  "success": true,
  "data": {
    "yearly_0_2": [
      {
        "id": "uuid-here",
        "text": "Achieve 50% revenue growth\nExpand to 3 new markets",
        "status": "neutral",
        "timeframe": "yearly",
        "categoryIndex": 0,
        "yearIndex": 2,
        "isCascaded": false,
        "parentItemId": null,
        "createdAt": "2025-11-14T10:30:00Z",
        "updatedAt": "2025-11-14T10:30:00Z",
        "createdBy": "John Doe",
        "updatedBy": "John Doe"
      }
    ],
    "monthly_1_24306": [...],
    "weekly_2_45": [...],
    "daily_3_20251115": [...]
  },
  "metadata": {
    "totalItems": 48,
    "organizationId": "uuid-here",
    "fetchedAt": "2025-11-14T12:00:00Z"
  }
}
```

#### 2. POST /api/strategic_map

**Purpose**: Create a new strategic map item

**Request Body**:
```json
{
  "organization_slug": "acme-corp",
  "text": "Launch new product line",
  "status": "neutral",
  "timeframe": "yearly",
  "categoryIndex": 0,
  "yearIndex": 2
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "text": "Launch new product line",
    "status": "neutral",
    "timeframe": "yearly",
    "categoryIndex": 0,
    "yearIndex": 2,
    "isCascaded": false,
    "createdAt": "2025-11-14T12:05:00Z"
  },
  "cascadedItems": [
    {
      "id": "uuid-cascaded",
      "text": "Launch new product line",
      "timeframe": "monthly",
      "monthColIndex": 24311,  // December of that year
      "isCascaded": true,
      "parentItemId": "uuid-here"
    }
  ]
}
```

#### 3. PUT /api/strategic_map/:id

**Purpose**: Update an existing item

**Request Body**:
```json
{
  "organization_slug": "acme-corp",
  "text": "Launch new product line (updated)",
  "status": "done"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "text": "Launch new product line (updated)",
    "status": "done",
    "updatedAt": "2025-11-14T12:10:00Z",
    "updatedBy": "Jane Smith"
  },
  "cascadedItems": [
    {
      "id": "uuid-cascaded",
      "text": "Launch new product line (updated)",
      "status": "done",
      "isCascaded": true
    }
  ]
}
```

#### 4. DELETE /api/strategic_map/:id

**Purpose**: Soft delete an item (and its cascaded children)

**Query Parameters**:
- `organization_slug` (required)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "deletedAt": "2025-11-14T12:15:00Z",
    "deletedBy": "John Doe"
  },
  "cascadedItemsDeleted": 1
}
```

#### 5. POST /api/strategic_map/batch

**Purpose**: Batch create/update multiple items (for data migration)

**Request Body**:
```json
{
  "organization_slug": "acme-corp",
  "items": [
    {
      "text": "Goal 1",
      "timeframe": "yearly",
      "categoryIndex": 0,
      "yearIndex": 0
    },
    {
      "text": "Goal 2",
      "timeframe": "monthly",
      "categoryIndex": 1,
      "monthColIndex": 24305
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "created": 2,
    "updated": 0,
    "failed": 0,
    "items": [
      { "id": "uuid-1", "success": true },
      { "id": "uuid-2", "success": true }
    ]
  }
}
```

### Backend Implementation (Koa + Vercel)

**File Structure**:
```
server/
├── server.js                    # Koa routes (development)
├── strategic_map_controller.js  # Shared business logic
└── strategic_map_helper.js      # Database queries

api/
└── strategic_map.js             # Vercel serverless function (production)

lib/
└── strategic_map_service.js     # Shared utilities
```

**Example Controller** (`server/strategic_map_controller.js`):
```javascript
const { createClient } = require('@supabase/supabase-js');
const { getOrganizationBySlug } = require('./organization_helper');

class StrategicMapController {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get all strategic map items for an organization
   */
  async getItems(organizationSlug, timeframe = null, individualId) {
    // 1. Validate organization
    const org = await getOrganizationBySlug(organizationSlug);
    if (!org) {
      throw new Error('Organization not found');
    }

    // 2. Call RPC function
    const { data, error } = await this.supabase.rpc('get_strategic_map_items', {
      p_organization_id: org.id,
      p_timeframe: timeframe
    });

    if (error) throw error;

    // 3. Transform to frontend format
    return this.transformToFrontendFormat(data);
  }

  /**
   * Create new strategic map item
   */
  async createItem(organizationSlug, itemData, individualId) {
    // 1. Validate organization
    const org = await getOrganizationBySlug(organizationSlug);
    if (!org) {
      throw new Error('Organization not found');
    }

    // 2. Insert item
    const { data, error } = await this.supabase
      .from('strategic_map_items')
      .insert({
        organization_id: org.id,
        created_by_individual_id: individualId,
        text: itemData.text,
        status: itemData.status || 'neutral',
        timeframe: itemData.timeframe,
        category_index: itemData.categoryIndex,
        year_index: itemData.yearIndex,
        month_col_index: itemData.monthColIndex,
        week_number: itemData.weekNumber,
        daily_date_key: itemData.dailyDateKey
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Fetch cascaded items created by trigger
    const cascadedItems = await this.getCascadedItems(data.id);

    return {
      item: data,
      cascadedItems
    };
  }

  /**
   * Update strategic map item
   */
  async updateItem(itemId, organizationSlug, updates, individualId) {
    // Validate organization ownership
    const org = await getOrganizationBySlug(organizationSlug);
    if (!org) {
      throw new Error('Organization not found');
    }

    const { data, error } = await this.supabase
      .from('strategic_map_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by_individual_id: individualId
      })
      .eq('id', itemId)
      .eq('organization_id', org.id)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) throw error;

    // Fetch updated cascaded items
    const cascadedItems = await this.getCascadedItems(itemId);

    return {
      item: data,
      cascadedItems
    };
  }

  /**
   * Soft delete strategic map item
   */
  async deleteItem(itemId, organizationSlug, individualId) {
    const org = await getOrganizationBySlug(organizationSlug);
    if (!org) {
      throw new Error('Organization not found');
    }

    const { data, error } = await this.supabase
      .from('strategic_map_items')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by_individual_id: individualId
      })
      .eq('id', itemId)
      .eq('organization_id', org.id)
      .select()
      .single();

    if (error) throw error;

    // Count cascaded items deleted (by trigger)
    const { count } = await this.supabase
      .from('strategic_map_items')
      .select('id', { count: 'exact', head: true })
      .eq('parent_item_id', itemId)
      .eq('is_deleted', true);

    return {
      item: data,
      cascadedItemsDeleted: count
    };
  }

  /**
   * Get cascaded items for a parent item
   */
  async getCascadedItems(parentItemId) {
    const { data, error } = await this.supabase
      .from('strategic_map_items')
      .select('*')
      .eq('parent_item_id', parentItemId)
      .eq('is_deleted', false);

    if (error) throw error;
    return data;
  }

  /**
   * Transform database rows to frontend format
   * Converts flat rows into nested object keyed by cell position
   */
  transformToFrontendFormat(rows) {
    const result = {};

    rows.forEach(row => {
      // Generate cell key: {timeframe}_{categoryIndex}_{colIndex}
      let cellKey;
      switch (row.timeframe) {
        case 'yearly':
          cellKey = `yearly_${row.category_index}_${row.year_index}`;
          break;
        case 'monthly':
          cellKey = `monthly_${row.category_index}_${row.month_col_index}`;
          break;
        case 'weekly':
          cellKey = `weekly_${row.category_index}_${row.week_number}`;
          break;
        case 'daily':
          cellKey = `daily_${row.category_index}_${row.daily_date_key}`;
          break;
      }

      if (!result[cellKey]) {
        result[cellKey] = [];
      }

      result[cellKey].push({
        id: row.id,
        text: row.text,
        status: row.status,
        timeframe: row.timeframe,
        rowIndex: row.category_index,
        colIndex: this.getColIndex(row),
        isCascaded: row.is_cascaded,
        parentItemId: row.parent_item_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by_name,
        updatedBy: row.updated_by_name
      });
    });

    return result;
  }

  getColIndex(row) {
    switch (row.timeframe) {
      case 'yearly': return row.year_index;
      case 'monthly': return row.month_col_index;
      case 'weekly': return row.week_number;
      case 'daily': return row.daily_date_key;
    }
  }
}

module.exports = StrategicMapController;
```

---

## 5. Frontend Migration Strategy

### Phase 1: Dual-Mode Operation

Keep both localStorage and API functionality, with feature flag to switch:

```javascript
// src/tools/strategic-map/index.jsx

const USE_API = process.env.REACT_APP_USE_STRATEGIC_MAP_API === 'true';

const StrategicMapV2Preview = ({ organizationSlug }) => {
  const [data, setData] = useState({});

  // Load data (localStorage OR API)
  const loadData = useCallback(async () => {
    if (USE_API) {
      // API mode
      try {
        const response = await axios.get(
          `/api/strategic_map?organization_slug=${organizationSlug}`
        );
        return response.data.data;
      } catch (error) {
        console.error('Failed to load from API:', error);
        // Fallback to localStorage
        return loadFromLocalStorage();
      }
    } else {
      // LocalStorage mode (current)
      return loadFromLocalStorage();
    }
  }, [organizationSlug]);

  // Save data (localStorage OR API)
  const handleAddItem = useCallback(async (timeframe, rowIndex, colIndex, text) => {
    const newItem = {
      id: generateId(),
      text,
      status: 'neutral',
      timeframe,
      rowIndex,
      colIndex
    };

    if (USE_API) {
      // API mode
      try {
        const response = await axios.post('/api/strategic_map', {
          organization_slug: organizationSlug,
          text: newItem.text,
          status: newItem.status,
          timeframe: newItem.timeframe,
          categoryIndex: rowIndex,
          ...getColIndexFields(timeframe, colIndex)
        });

        // Update local state with API response (includes cascaded items)
        const { item, cascadedItems } = response.data.data;
        setData(prev => {
          const updated = { ...prev };
          // Add main item
          const cellKey = getCellKey(timeframe, rowIndex, colIndex);
          updated[cellKey] = [...(updated[cellKey] || []), transformApiItem(item)];

          // Add cascaded items
          cascadedItems.forEach(cascaded => {
            const cascadeKey = getCellKey(cascaded.timeframe, cascaded.categoryIndex, getColFromItem(cascaded));
            updated[cascadeKey] = [...(updated[cascadeKey] || []), transformApiItem(cascaded)];
          });

          return updated;
        });
      } catch (error) {
        console.error('Failed to save to API:', error);
        // Fallback to localStorage
        saveToLocalStorage(newItem);
      }
    } else {
      // LocalStorage mode (current)
      saveToLocalStorage(newItem);
    }
  }, [organizationSlug]);

  // Similar dual-mode pattern for edit, delete, toggle status...
};
```

### Phase 2: Data Migration Tool

Create admin tool to migrate localStorage data to database:

```javascript
// src/tools/strategic-map/utils/dataMigration.js

/**
 * Migrate all organizations' Strategic Map data from localStorage to database
 */
export async function migrateAllOrganizations() {
  const results = [];

  // Get all Strategic Map keys from localStorage
  const allKeys = Object.keys(localStorage);
  const strategicMapKeys = allKeys.filter(key => key.startsWith('strategic_map_'));

  for (const key of strategicMapKeys) {
    const organizationSlug = key.replace('strategic_map_', '');

    try {
      const result = await migrateOrganization(organizationSlug);
      results.push({ organizationSlug, success: true, ...result });
    } catch (error) {
      results.push({ organizationSlug, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * Migrate single organization's data
 */
export async function migrateOrganization(organizationSlug) {
  // 1. Load from localStorage
  const localData = JSON.parse(localStorage.getItem(`strategic_map_${organizationSlug}`) || '{}');

  // 2. Transform to API format
  const items = [];
  Object.entries(localData).forEach(([cellKey, cellItems]) => {
    const [timeframe, categoryIndex, colIndex] = cellKey.split('_');

    cellItems.forEach(item => {
      items.push({
        text: item.text,
        status: item.status,
        timeframe,
        categoryIndex: parseInt(categoryIndex),
        ...getColIndexFields(timeframe, parseInt(colIndex))
      });
    });
  });

  // 3. Batch upload to API
  const response = await axios.post('/api/strategic_map/batch', {
    organization_slug: organizationSlug,
    items
  });

  // 4. Verify migration
  const { created, updated, failed } = response.data.data;

  if (failed === 0) {
    // Success - clear localStorage
    localStorage.removeItem(`strategic_map_${organizationSlug}`);
  }

  return { created, updated, failed };
}

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

### Phase 3: Real-Time Sync (Optional)

Use Supabase Realtime for collaborative features:

```javascript
// src/tools/strategic-map/hooks/useRealtimeSync.js

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export function useRealtimeSync(organizationId, onUpdate) {
  useEffect(() => {
    const supabase = createClient(
      process.env.REACT_APP_SUPABASE_URL,
      process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY
    );

    // Subscribe to changes
    const subscription = supabase
      .channel('strategic_map_changes')
      .on(
        'postgres_changes',
        {
          event: '*',  // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'strategic_map_items',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          console.log('Realtime change:', payload);
          onUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [organizationId, onUpdate]);
}

// Usage in StrategicMapV2Preview
const handleRealtimeUpdate = useCallback((payload) => {
  if (payload.eventType === 'INSERT') {
    // Refresh data to show new item
    loadData();
  } else if (payload.eventType === 'UPDATE') {
    // Update specific item in state
    setData(prev => {
      // Update logic...
    });
  } else if (payload.eventType === 'DELETE') {
    // Remove item from state
    setData(prev => {
      // Delete logic...
    });
  }
}, []);

useRealtimeSync(organizationId, handleRealtimeUpdate);
```

---

## 6. Implementation Phases

### Phase 1: Database Setup (Week 1)

**Tasks**:
1. Create database migration file
2. Execute SQL schema in Supabase
3. Test cascade triggers manually
4. Create RPC functions
5. Verify indexes for performance

**Deliverables**:
- ✅ `migrations/0002_strategic_map_tables.sql`
- ✅ Database schema deployed to Supabase
- ✅ Test data inserted and cascades verified

### Phase 2: Backend API Development (Week 2-3)

**Tasks**:
1. Implement StrategicMapController
2. Create Koa routes in `server/server.js`
3. Create Vercel serverless function `api/strategic_map.js`
4. Write unit tests for controller
5. Test cascade behavior via API
6. Document API endpoints

**Deliverables**:
- ✅ `server/strategic_map_controller.js`
- ✅ `api/strategic_map.js`
- ✅ API documentation in `/docs/api/`
- ✅ Postman collection for testing

### Phase 3: Frontend Dual-Mode Implementation (Week 4-5)

**Tasks**:
1. Create `USE_API` feature flag
2. Implement dual-mode data loading
3. Implement dual-mode CRUD operations
4. Test both modes (localStorage and API)
5. Create data migration tool UI
6. Test migration with sample data

**Deliverables**:
- ✅ Dual-mode Strategic Map v2
- ✅ Migration tool accessible to admins
- ✅ Migration tested with 100+ items

### Phase 4: Testing & QA (Week 6)

**Tasks**:
1. End-to-end testing (all timeframes)
2. Cascade verification (Year → Month → Week → Day)
3. Multi-user testing (collaboration)
4. Performance testing (1000+ items)
5. Browser compatibility testing
6. Mobile responsiveness testing

**Deliverables**:
- ✅ Test report documenting all scenarios
- ✅ Performance benchmarks
- ✅ Bug fixes for discovered issues

### Phase 5: Migration & Rollout (Week 7)

**Tasks**:
1. Announce migration to users (1 week notice)
2. Provide migration tool in admin panel
3. Monitor migration progress
4. Switch `USE_API` to true for all users
5. Keep localStorage as fallback for 1 month
6. Final localStorage cleanup after verification

**Deliverables**:
- ✅ All organizations migrated to database
- ✅ Zero data loss verified
- ✅ Performance metrics meet targets

### Phase 6: Real-Time Features (Optional - Week 8+)

**Tasks**:
1. Implement Supabase Realtime subscription
2. Add UI indicators for collaborative editing
3. Conflict resolution for simultaneous edits
4. Test with multiple users editing same cell

**Deliverables**:
- ✅ Real-time sync working
- ✅ Collaborative editing indicators
- ✅ Conflict resolution tested

---

## 7. Testing Strategy

### Unit Tests

**Backend** (`server/__tests__/strategic_map_controller.test.js`):
```javascript
describe('StrategicMapController', () => {
  describe('createItem', () => {
    it('should create yearly item and cascade to December', async () => {
      const controller = new StrategicMapController(supabaseUrl, supabaseKey);

      const result = await controller.createItem('test-org', {
        text: 'Test Goal',
        timeframe: 'yearly',
        categoryIndex: 0,
        yearIndex: 2
      }, individualId);

      expect(result.item).toMatchObject({
        text: 'Test Goal',
        timeframe: 'yearly'
      });

      expect(result.cascadedItems).toHaveLength(1);
      expect(result.cascadedItems[0]).toMatchObject({
        text: 'Test Goal',
        timeframe: 'monthly',
        isCascaded: true
      });
    });
  });
});
```

### Integration Tests

**API Tests** (`api/__tests__/strategic_map.test.js`):
```javascript
describe('Strategic Map API', () => {
  it('should handle full CRUD cycle with cascades', async () => {
    // Create
    const createResponse = await request(app)
      .post('/api/strategic_map')
      .send({
        organization_slug: 'test-org',
        text: 'Integration Test Goal',
        timeframe: 'yearly',
        categoryIndex: 0,
        yearIndex: 0
      });

    expect(createResponse.status).toBe(200);
    const itemId = createResponse.body.data.item.id;

    // Read
    const readResponse = await request(app)
      .get('/api/strategic_map')
      .query({ organization_slug: 'test-org' });

    expect(readResponse.status).toBe(200);
    expect(readResponse.body.data).toHaveProperty('yearly_0_0');

    // Update
    const updateResponse = await request(app)
      .put(`/api/strategic_map/${itemId}`)
      .send({
        organization_slug: 'test-org',
        text: 'Updated Goal',
        status: 'done'
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.item.text).toBe('Updated Goal');

    // Delete
    const deleteResponse = await request(app)
      .delete(`/api/strategic_map/${itemId}`)
      .query({ organization_slug: 'test-org' });

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data.deletedAt).toBeDefined();
  });
});
```

### Frontend Tests

**Component Tests** (`src/tools/strategic-map/__tests__/index.test.jsx`):
```javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StrategicMapV2Preview from '../index';

describe('StrategicMapV2Preview', () => {
  it('should create goal and auto-cascade to December', async () => {
    render(<StrategicMapV2Preview organizationSlug="test-org" />);

    // Find yearly view input for category 0, year 0
    const input = screen.getByRole('textbox', { name: /category 0 year 0/i });

    // Type goal and submit
    await userEvent.type(input, 'Test Goal{Enter}');

    // Verify item appears
    expect(screen.getByText('Test Goal')).toBeInTheDocument();

    // Expand monthly view
    const yearHeader = screen.getByText('2025');
    await userEvent.click(yearHeader);

    // Verify December has cascaded goal
    await waitFor(() => {
      expect(screen.getByText('Dec')).toBeInTheDocument();
    });

    // Find December column, should contain cascaded goal
    const decColumn = screen.getByTestId('monthly-cell-0-11');
    expect(within(decColumn).getByText('Test Goal')).toBeInTheDocument();
  });
});
```

---

## 8. Rollback Plan

### Scenario 1: API Issues During Rollout

**Trigger**: API errors > 5% of requests, response time > 1s

**Action**:
1. Set `REACT_APP_USE_STRATEGIC_MAP_API=false` to revert to localStorage
2. Investigate and fix API issues
3. Re-enable API after verification

**Recovery Time**: < 5 minutes (feature flag change)

### Scenario 2: Data Corruption During Migration

**Trigger**: Users report missing or incorrect data after migration

**Action**:
1. Pause migration for all pending organizations
2. Restore affected organization data from localStorage backup
3. Investigate and fix migration logic
4. Re-migrate affected organizations

**Prevention**:
- Keep localStorage data for 1 month after migration
- Implement migration verification step
- Provide manual "Restore from localStorage" button in UI

### Scenario 3: Database Performance Issues

**Trigger**: Database query time > 500ms, timeouts

**Action**:
1. Enable database query logging
2. Analyze slow queries
3. Add missing indexes
4. Optimize RPC functions
5. Consider database scaling (Supabase plan upgrade)

**Temporary Mitigation**:
- Enable API response caching (Redis)
- Reduce data fetch frequency
- Implement pagination for large datasets

---

## Appendix A: Column Index Calculations

### Yearly
```
yearIndex = array index in years array (0-based)
Example: [2025, 2026, 2027] → 2026 has yearIndex = 1
```

### Monthly
```
monthColIndex = (year * 12) + monthIndex
Example: June 2025 = (2025 * 12) + 5 = 24305
```

### Weekly
```
weekNumber = ISO week number (1-53)
Example: Week 45 of 2025 = 45
```

### Daily
```
dailyDateKey = YYYYMMDD integer
Example: November 15, 2025 = 20251115
```

---

## Appendix B: Migration Checklist

- [ ] Database schema created and deployed
- [ ] Cascade triggers tested and verified
- [ ] RPC functions created
- [ ] Backend API implemented (Koa + Vercel)
- [ ] API endpoints tested with Postman
- [ ] Frontend dual-mode implemented
- [ ] Feature flag `USE_API` added
- [ ] Data migration tool created
- [ ] Migration tested with sample data
- [ ] End-to-end testing completed
- [ ] Performance benchmarks met
- [ ] User documentation updated
- [ ] Migration announcement sent
- [ ] Production migration completed
- [ ] LocalStorage backup maintained (1 month)
- [ ] Real-time sync implemented (optional)
- [ ] Final verification and cleanup

---

**Document Status**: Planning Phase
**Next Steps**: Review with development team, estimate timeline, begin Phase 1
**Estimated Total Effort**: 6-8 weeks
**Team Size**: 2 developers (1 backend, 1 frontend)
