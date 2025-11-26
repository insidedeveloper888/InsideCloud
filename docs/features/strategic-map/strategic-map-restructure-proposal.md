# Strategic Map Restructure Proposal

## Problem Analysis

### Current Issues
1. **Auto-copy only works partially**: Yearly items copy to December, but:
   - Only works for `focusYear` (current visible year)
   - Doesn't cascade to weekly/daily views
   - Doesn't work for other months (January → last week/day)

2. **No cascading relationship**: Items are independent - no parent-child tracking
   - Can't trace which yearly item spawned which monthly/weekly/daily items
   - Can't sync updates across timeframes automatically

3. **Manual copy logic in frontend**: Current implementation tries to copy in frontend, which is:
   - Error-prone (network failures, race conditions)
   - Only works when viewing that specific year/month
   - Doesn't handle all edge cases

### User Requirements (Reverse-Engineering Planning)
- **Year View** → Plan 5-year goals
- **Auto-copy Year → December**: Yearly goals must be completed by December (last month)
- **Auto-copy December → Last Week**: December goals → last week of December
- **Auto-copy Last Week → Last Day**: Last week → last day of December
- **Monthly View**: January → last week of January → last day of January
- **Same pattern for all months**: Each month's goals → last week → last day

## Proposed Solution Architecture

### 1. Database Schema Changes

#### Add Parent-Child Relationship Tracking

```sql
-- Add parent_item_id column to track cascading relationships
ALTER TABLE strategic_map_items 
ADD COLUMN parent_item_id UUID REFERENCES strategic_map_items(id) ON DELETE CASCADE;

-- Add index for efficient parent lookups
CREATE INDEX strategic_map_items_parent_idx ON strategic_map_items(parent_item_id);

-- Add metadata field to track cascade rules (already exists, but document usage)
-- metadata JSONB can store: { "auto_copied": true, "cascade_rule": "year_to_december" }
```

#### Benefits
- Track which items spawned which child items
- Enable cascading updates/deletes
- Query all children of a parent item
- Maintain data integrity

### 2. Backend Auto-Copy Logic (Server-Side)

#### New API Endpoint: `/api/strategic_map/cascade`

**Purpose**: Handle all cascading copy operations server-side

**Flow**:
1. When yearly item is created/updated → Trigger cascade to December
2. When December item is created/updated → Trigger cascade to last week
3. When last week item is created/updated → Trigger cascade to last day
4. When any month item is created/updated → Trigger cascade to last week → last day

#### Implementation Options

**Option A: Database Triggers (Recommended)**
- PostgreSQL triggers fire automatically on INSERT/UPDATE
- Most reliable, no race conditions
- Works even if API calls fail

```sql
CREATE OR REPLACE FUNCTION cascade_strategic_map_item()
RETURNS TRIGGER AS $$
DECLARE
  target_timeframe TEXT;
  target_date DATE;
  target_column_index INTEGER;
  year_val INTEGER;
  month_val INTEGER;
BEGIN
  -- Yearly → December (monthly)
  IF NEW.timeframe = 'yearly' THEN
    year_val := EXTRACT(YEAR FROM NEW.timeframe_value);
    target_date := DATE(year_val || '-12-01');
    target_column_index := 11; -- December is index 11
    
    -- Insert/update December item
    INSERT INTO strategic_map_items (
      organization_id, individual_id, scope, product_id,
      row_index, column_index, item_index,
      timeframe, timeframe_value,
      cell_value, cell_type, status,
      parent_item_id, metadata,
      created_by, created_at, updated_at
    )
    VALUES (
      NEW.organization_id, NEW.individual_id, NEW.scope, NEW.product_id,
      NEW.row_index, target_column_index, NEW.item_index,
      'monthly', target_date,
      NEW.cell_value, NEW.cell_type, NEW.status,
      NEW.id, jsonb_build_object('auto_copied', true, 'cascade_rule', 'year_to_december'),
      NEW.created_by, NOW(), NOW()
    )
    ON CONFLICT ON CONSTRAINT strategic_map_items_unique_position
    DO UPDATE SET
      cell_value = NEW.cell_value,
      status = NEW.status,
      updated_at = NOW();
    
    -- Then cascade December → Last Week → Last Day (recursive)
    -- This will be handled by another trigger or function call
  END IF;
  
  -- Monthly → Last Week of Month → Last Day of Month
  IF NEW.timeframe = 'monthly' THEN
    -- Calculate last week of month
    -- Calculate last day of month
    -- Insert/update weekly and daily items
  END IF;
  
  -- Weekly → Last Day of Week
  IF NEW.timeframe = 'weekly' THEN
    -- Calculate last day of week
    -- Insert/update daily item
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER strategic_map_cascade_trigger
AFTER INSERT OR UPDATE ON strategic_map_items
FOR EACH ROW
WHEN (NEW.cell_value IS NOT NULL AND NEW.cell_value != '')
EXECUTE FUNCTION cascade_strategic_map_item();
```

**Option B: API-Level Cascade (Alternative)**
- Handle in API handler after save
- More control, easier to debug
- Requires explicit calls

**Recommendation**: Use **Option A (Database Triggers)** for reliability, but also provide **Option B** as fallback for manual operations.

### 3. Frontend Changes

#### Simplify Frontend Logic
- **Remove** manual copy logic from frontend
- **Trust** backend to handle cascading
- **Refresh** affected views after save (optional optimization)

#### New Features
1. **Visual Indicators**: Show which items are auto-copied vs manually created
2. **Cascade Status**: Display parent-child relationships
3. **Sync Indicators**: Show when items are synced across timeframes

### 4. Date Calculation Logic

#### Helper Functions (Backend)

```javascript
// Calculate last week of a month
function getLastWeekOfMonth(year, month) {
  const lastDay = new Date(year, month, 0); // Last day of month
  const lastWeekStart = startOfWeek(lastDay, { weekStartsOn: 1 }); // Monday
  return lastWeekStart;
}

// Calculate last day of a month
function getLastDayOfMonth(year, month) {
  return new Date(year, month, 0); // Day 0 = last day of previous month
}

// Calculate last day of a week
function getLastDayOfWeek(weekStartDate) {
  const lastDay = addDays(weekStartDate, 6); // Sunday
  return lastDay;
}
```

#### Cascade Rules

| Source Timeframe | Target Timeframe | Target Date Logic |
|-----------------|------------------|-------------------|
| `yearly` (2024) | `monthly` | December 1, 2024 (`2024-12-01`) |
| `monthly` (Jan 2024) | `weekly` | Last week of January 2024 |
| `monthly` (Jan 2024) | `daily` | Last day of January 2024 (`2024-01-31`) |
| `weekly` (Week X) | `daily` | Last day of that week (Sunday) |

### 5. Update/Delete Cascade Behavior

#### Update Cascade
- When parent item is **updated**:
  - Update all child items' `cell_value` and `status`
  - Preserve manual edits? (Add `is_manual_edit` flag to child items)

#### Delete Cascade
- When parent item is **deleted**:
  - **Option 1**: Delete all children (CASCADE)
  - **Option 2**: Keep children but mark as orphaned
  - **Recommendation**: Option 1 (CASCADE) - if yearly goal is deleted, monthly/weekly/daily should be deleted too

### 6. Data Migration Strategy

#### For Existing Data
1. **Identify yearly items** without December copies
2. **Create December copies** for all yearly items
3. **Create weekly/daily copies** for December items
4. **Set parent_item_id** relationships

```sql
-- Migration script
DO $$
DECLARE
  yearly_item RECORD;
  december_date DATE;
  december_item_id UUID;
BEGIN
  -- For each yearly item
  FOR yearly_item IN 
    SELECT * FROM strategic_map_items 
    WHERE timeframe = 'yearly' 
    AND cell_value IS NOT NULL
  LOOP
    -- Create December copy
    december_date := DATE(EXTRACT(YEAR FROM yearly_item.timeframe_value) || '-12-01');
    
    INSERT INTO strategic_map_items (
      organization_id, individual_id, scope, product_id,
      row_index, column_index: 11, item_index,
      timeframe: 'monthly', timeframe_value: december_date,
      cell_value, cell_type, status,
      parent_item_id: yearly_item.id,
      metadata: jsonb_build_object('auto_copied', true, 'cascade_rule', 'year_to_december')
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO december_item_id;
    
    -- Then cascade to weekly/daily (similar logic)
  END LOOP;
END $$;
```

## Implementation Plan

### Phase 1: Database Schema Updates
1. ✅ Add `parent_item_id` column
2. ✅ Add indexes
3. ✅ Create cascade trigger function
4. ✅ Test trigger logic

### Phase 2: Backend API Updates
1. ✅ Update POST handler to support cascade operations
2. ✅ Add cascade endpoint (optional)
3. ✅ Update GET handler to include parent relationships
4. ✅ Add date calculation helpers

### Phase 3: Frontend Simplification
1. ✅ Remove manual copy logic
2. ✅ Add visual indicators for auto-copied items
3. ✅ Add cascade relationship display
4. ✅ Test end-to-end flow

### Phase 4: Data Migration
1. ✅ Create migration script
2. ✅ Run migration for existing data
3. ✅ Verify data integrity

### Phase 5: Testing & Validation
1. ✅ Test yearly → December cascade
2. ✅ Test December → last week cascade
3. ✅ Test last week → last day cascade
4. ✅ Test monthly → last week/day cascade
5. ✅ Test update cascade
6. ✅ Test delete cascade

## Benefits of This Approach

1. **Reliability**: Database triggers ensure cascading always happens
2. **Consistency**: All items follow the same cascade rules
3. **Traceability**: Parent-child relationships are tracked
4. **Maintainability**: Logic centralized in database/backend
5. **Performance**: Database-level operations are fast
6. **Scalability**: Works for any year/month/week/day

## Open Questions

1. **Manual Edits**: Should users be able to manually edit auto-copied items?
   - **Recommendation**: Yes, but mark as `is_manual_edit = true` to prevent overwrite

2. **Bidirectional Sync**: Should editing December update the yearly item?
   - **Current**: Yes (reverse sync exists)
   - **Proposed**: Keep bidirectional sync, but respect manual edits

3. **Cascade Timing**: Should cascade happen immediately or on-demand?
   - **Recommendation**: Immediately via triggers (most reliable)

4. **Error Handling**: What if cascade fails?
   - **Recommendation**: Log errors, but don't block parent item save

## Next Steps

1. **Review this proposal** with stakeholders
2. **Confirm cascade rules** match business requirements
3. **Approve implementation approach**
4. **Begin Phase 1 implementation**

---

## Alternative: Simpler Approach (If Triggers Are Too Complex)

If database triggers are too complex, we can:
1. Keep current structure
2. Add `parent_item_id` for tracking only
3. Handle cascade in API handler (Option B)
4. Add background job to sync items periodically

**Trade-off**: Less reliable (requires API calls), but easier to debug and modify.

