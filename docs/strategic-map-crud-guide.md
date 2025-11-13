# Strategic Map (战略地图) - CRUD Operations Guide

## Overview

The Strategic Map (战略地图) is a strategic planning tool that allows organizations and individuals to track goals and achievements across different timeframes (yearly, monthly, weekly, daily) and strategic categories.

## Architecture

### Frontend Component
- **Location**: `src/components/StrategicMap/index.jsx`
- **Framework**: React with Material-UI
- **State Management**: React hooks (useState, useEffect, useCallback)

### Backend API
- **Location**: `api/strategic_map.js`
- **Server Route**: `/api/strategic_map` (GET, POST, DELETE)
- **Database**: Supabase (PostgreSQL)

### Database Table
- **Table Name**: `strategic_map_items`
- **Product Reference**: Links to `products` table where `key = 'strategic_map'`

## Data Model

### Strategic Categories (Rows)
The strategic map uses 6 categories (row_index 0-5):
1. **阶段成就** (Phase Achievements) - row_index: 0
2. **财务盈利** (Financial Profitability) - row_index: 1
3. **客户市场** (Customer Market) - row_index: 2
4. **内部系统** (Internal Systems) - row_index: 3
5. **人才资本** (Human Capital) - row_index: 4
6. **学习成长** (Learning & Growth) - row_index: 5

### Timeframes
- **Yearly** (`yearly`): 5-year view (e.g., 2020-2024)
- **Monthly** (`monthly`): 12 months per year
- **Weekly** (`weekly`): 52 weeks per year
- **Daily** (`daily`): 365 days per year

### Scopes
- **Company** (`company`): Organization-wide goals (individual_id is null)
- **Individual** (`individual`): Personal goals (individual_id is set)

### Status Values
- `neutral`: Default status (gray dot)
- `done`: Completed (green dot)
- `fail`: Failed (red dot)
- Status cycles: neutral → done → fail → neutral

## Database Schema

### `strategic_map_items` Table

```sql
Columns:
- id: UUID (Primary Key)
- organization_id: UUID (Foreign Key → organizations.id)
- product_id: UUID (Foreign Key → products.id, where key='strategic_map')
- individual_id: UUID (Nullable, Foreign Key → individuals.id)
- scope: VARCHAR ('company' or 'individual')
- row_index: INTEGER (0-5, represents strategic category)
- column_index: INTEGER (represents time column position)
- item_index: INTEGER (allows multiple items per cell, default: 0)
- cell_value: TEXT (the goal/achievement text)
- cell_type: VARCHAR (default: 'text')
- status: VARCHAR ('neutral', 'done', 'fail')
- timeframe: VARCHAR ('yearly', 'monthly', 'weekly', 'daily')
- timeframe_value: DATE (specific date for the timeframe)
- parent_item_id: UUID (self-referential FK → strategic_map_items.id, NULL for root/yearly items)
- is_auto_generated: BOOLEAN (true when row was created by cascade trigger)
- cascade_source: TEXT (describes cascade rule, e.g. 'year_to_month', 'month_to_week', 'week_to_day')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Unique Constraint
The table uses a unique constraint on:
- `organization_id`
- `product_id`
- `scope`
- `row_index`
- `column_index`
- `timeframe`
- `timeframe_value`
- `item_index`
- `individual_id` (COALESCE to handle null for company scope)

### Cascade Automation
- Database triggers automatically cascade items from **yearly → monthly (December) → weekly (last week) → daily (last day)**.
- All cascade-generated rows reference their parent via `parent_item_id` and set `is_auto_generated = true`.
- Manual edits are allowed on any timeframe; updates propagate **upwards** (child → parent) and **downwards** (parent → children) while respecting trigger direction guards to avoid infinite loops.
- When a user edits a daily item, the change syncs back through weekly, monthly, and yearly ancestors, ensuring strategic alignment at every level.
- Deleting a parent item (e.g., yearly) removes all of its descendants via `ON DELETE CASCADE`.

## CRUD Operations

### CREATE

#### Frontend Flow
1. User clicks on a cell in the strategic map table
2. `handleCellClick()` is triggered
3. If cell is empty, a new item is prepared
4. User types text in the input field
5. On blur or Enter key, `handleCellBlur()` or `handleCellKeyDown()` is called
6. `saveItem()` function sends POST request

#### API Request (POST)
```javascript
POST /api/strategic_map
Content-Type: application/json

{
  "organization_slug": "org-slug",
  "scope": "company" | "individual",
  "timeframe": "yearly" | "monthly" | "weekly" | "daily",
  "timeframe_value": "2024-01-01",  // Date string
  "row_index": 0,  // 0-5
  "column_index": 0,  // Column position
  "cell_value": "Goal text",
  "item_index": 0,  // For multiple items per cell
  "status": "neutral"  // Optional, defaults to 'neutral'
}
```

#### Backend Processing
1. Validates `organization_slug` and looks up organization
2. Gets `product_id` from `products` table (key='strategic_map')
3. For individual scope, extracts `individual_id` from `lk_token` cookie via Lark API
4. Checks for existing item with same:
   - organization_id, product_id, scope, row_index, column_index, timeframe, timeframe_value, item_index, individual_id
5. If exists: **UPDATE** existing item
6. If not exists: **INSERT** new item
7. Returns saved item
8. Database triggers cascade new/updated goals through monthly, weekly, and daily timeframes

#### Key Code (Frontend)
```javascript
// src/components/StrategicMap/index.jsx:832-968
const saveItem = useCallback(async (timeframe, rowIndex, columnIndex, updates) => {
  const payload = {
    organization_slug: organizationSlug,
    scope,
    timeframe,
    timeframe_value: timeframeValue,
    row_index: rowIndex,
    column_index: columnIndex,
    ...updates,  // cell_value, item_id, item_index, status
  };
  
  const response = await fetch(`${base}/api/strategic_map`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  // Updates local state with saved item
});
```

#### Key Code (Backend)
```javascript
// api/strategic_map.js:271-437
if (method === 'POST') {
  // Validate and get organization
  // Get product_id
  // Get individual_id if scope='individual'
  // Build itemData object
  // Check for existing item
  // Update or Insert
  // Return saved item
}
```

### READ

#### Frontend Flow
1. Component mounts or scope/yearRange changes
2. `fetchItems()` is called
3. Progressively loads data:
   - First: Yearly data (5 requests)
   - Then: Monthly data (12 requests)
   - Then: Weekly data (52 requests, batched)
   - Finally: Daily data (365 requests, batched by 30 days)

#### API Request (GET)
```javascript
GET /api/strategic_map?organization_slug=org-slug&scope=company&timeframe=yearly&timeframe_value=2024-01-01
```

#### Query Parameters
- `organization_slug` (required): Organization identifier
- `scope` (optional, default: 'company'): 'company' or 'individual'
- `timeframe` (optional, default: 'yearly'): 'yearly', 'monthly', 'weekly', 'daily'
- `timeframe_value` (optional): Date string to filter specific timeframe
- `individual_id` (optional): For individual scope

#### Backend Processing
1. Validates `organization_slug` and looks up organization
2. Gets `product_id` from `products` table
3. Builds Supabase query:
   - Filters by organization_id, product_id, scope, timeframe
   - For yearly: matches any date in that year
   - For monthly: matches any date in that month
   - For weekly/daily: exact match on timeframe_value
4. For individual scope: filters by individual_id (from cookie or parameter)
5. For company scope: filters where individual_id IS NULL
6. Orders by row_index, column_index, item_index
7. Returns array of items

#### Key Code (Frontend)
```javascript
// src/components/StrategicMap/index.jsx:130-164
const fetchTimeframeData = useCallback(async (timeframeType, columns, startIndex) => {
  const promises = columns.map(col => {
    const params = new URLSearchParams({
      organization_slug: organizationSlug,
      scope,
      timeframe: timeframeType,
      timeframe_value: col.value,
    });
    return fetch(`${base}/api/strategic_map?${params.toString()}`);
  });
  
  const results = await Promise.all(promises);
  // Process and merge results into items state
});
```

#### Key Code (Backend)
```javascript
// api/strategic_map.js:193-268
if (method === 'GET') {
  // Get organization and product
  // Build query with filters
  // Handle timeframe_value matching (yearly/monthly vs exact)
  // Filter by scope (individual_id)
  // Order and return results
}
```

### UPDATE

#### Frontend Flow
1. User clicks on existing cell item
2. `handleCellClick()` sets editing state
3. User modifies text
4. On blur/Enter, `saveItem()` is called with `item_id`
5. Backend updates existing item

#### API Request (POST with item_id)
```javascript
POST /api/strategic_map
{
  "organization_slug": "org-slug",
  "scope": "company",
  "timeframe": "yearly",
  "timeframe_value": "2024-01-01",
  "row_index": 0,
  "column_index": 0,
  "cell_value": "Updated goal text",
  "item_id": "uuid-of-existing-item",  // Key for update
  "item_index": 0,
  "status": "done"
}
```

#### Backend Processing
1. If `item_id` is provided, directly updates that item:
   ```javascript
   supabase
     .from('strategic_map_items')
     .update(itemData)
     .eq('id', item_id)
   ```
2. If `item_id` is not provided, performs upsert (check existing, then update or insert)

#### Status Update
- User clicks on status dot (gray/green/red)
- `handleStatusClick()` cycles status: neutral → done → fail → neutral
- Sends POST with updated status

#### Key Code (Frontend)
```javascript
// src/components/StrategicMap/index.jsx:580-604
const handleStatusClick = useCallback((timeframe, rowIndex, columnIndex, itemId, itemIndex, e) => {
  const currentStatus = item.status || 'neutral';
  const nextStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(currentStatus) + 1) % STATUS_CYCLE.length];
  
  saveItem(timeframe, rowIndex, columnIndex, { 
    status: nextStatus, 
    item_id: item.id, 
    item_index: item.item_index 
  });
});
```

### DELETE

#### Frontend Flow
Currently, deletion is not implemented in the frontend UI. However, the API supports it.

#### API Request (DELETE)
```javascript
DELETE /api/strategic_map?id=uuid-of-item
```

#### Backend Processing
1. Validates `id` parameter
2. Deletes item from database:
   ```javascript
   supabase
     .from('strategic_map_items')
     .delete()
     .eq('id', id)
     .eq('organization_id', org.id)
   ```
3. Returns success response

#### Key Code (Backend)
```javascript
// api/strategic_map.js:439-460
if (method === 'DELETE') {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json(failResponse('id is required'));
  }
  
  const { error } = await supabase
    .from('strategic_map_items')
    .delete()
    .eq('id', id)
    .eq('organization_id', org.id);
}
```

## Multiple Items Per Cell

The system supports **multiple items per cell** using `item_index`:

1. Each cell can have multiple goals/items
2. `item_index` starts at 0 and increments for each new item
3. When creating a new item, frontend calculates: `maxItemIndex + 1`
4. Items are displayed vertically in the cell
5. Each item has its own status dot

### Example
```javascript
// Cell at yearly_0_2 (yearly, row 0, column 2) can have:
[
  { id: 'uuid1', item_index: 0, cell_value: 'Goal 1', status: 'done' },
  { id: 'uuid2', item_index: 1, cell_value: 'Goal 2', status: 'neutral' },
  { id: 'uuid3', item_index: 2, cell_value: 'Goal 3', status: 'fail' }
]
```

## Authentication & Authorization

### Individual Scope
- Requires `lk_token` cookie (Lark access token)
- Backend calls Lark API to get user info
- Looks up `individual_id` from `individuals` table
- Only shows/edits items for that individual

### Company Scope
- No authentication required for viewing
- `individual_id` is set to NULL
- All users in organization can view/edit company goals

## Progressive Loading

The frontend implements progressive loading for performance:

1. **Yearly data** loads first (fast, only 5 columns)
2. **Monthly data** loads next (12 columns)
3. **Weekly data** loads in batches of 13 weeks (4 batches)
4. **Daily data** loads in batches of 30 days (only current year)

This allows users to see yearly data immediately while other timeframes load in the background.

## Error Handling

### Frontend
- Shows error alerts for failed API calls
- Validates `organizationSlug` before operations
- Handles network errors gracefully
- Shows loading states during save operations

### Backend
- Validates all required parameters
- Returns structured error responses: `{ code: 1, msg: "error message" }`
- Logs errors for debugging
- Returns 400 for bad requests, 404 for not found, 500 for server errors

## Key Features

1. **Multi-timeframe view**: Yearly → Monthly → Weekly → Daily breakdown
2. **Strategic categories**: 6 balanced scorecard categories
3. **Dual scope**: Company-wide and individual goals
4. **Status tracking**: Visual status dots (neutral/done/fail)
5. **Multiple items per cell**: Support for multiple goals in same timeframe
6. **Progressive loading**: Fast initial load with background data fetching
7. **Auto-save**: Saves on blur with 500ms debounce
8. **Multi-item editing**: Press Enter to save current and start next item

## API Response Format

### Success Response
```json
{
  "code": 0,
  "msg": "success",
  "data": [ /* array of items for GET */ ] | { /* single item for POST */ }
}
```

### Error Response
```json
{
  "code": 1,
  "msg": "Error message here"
}
```

## Usage Examples

### Create a new yearly goal
```javascript
// Frontend automatically handles this when user types in a cell
// Backend receives:
POST /api/strategic_map
{
  "organization_slug": "acme-corp",
  "scope": "company",
  "timeframe": "yearly",
  "timeframe_value": "2024-01-01",
  "row_index": 0,
  "column_index": 0,
  "cell_value": "Achieve 20% revenue growth",
  "item_index": 0
}
```

### Update an existing goal's status
```javascript
// User clicks status dot
POST /api/strategic_map
{
  "organization_slug": "acme-corp",
  "scope": "company",
  "timeframe": "yearly",
  "timeframe_value": "2024-01-01",
  "row_index": 0,
  "column_index": 0,
  "item_id": "existing-item-uuid",
  "status": "done",
  "item_index": 0
}
```

### Read all monthly goals for a year
```javascript
GET /api/strategic_map?organization_slug=acme-corp&scope=company&timeframe=monthly&timeframe_value=2024-01-01
```

## Notes

- The system uses **upsert logic** - if an item with the same unique combination exists, it updates; otherwise, it creates
- `item_index` allows multiple items per cell, enabling granular goal tracking
- Individual scope requires Lark authentication via `lk_token` cookie
- Company scope is accessible to all organization members
- The frontend caches items in React state and merges updates optimistically

