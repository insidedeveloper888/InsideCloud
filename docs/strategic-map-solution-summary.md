# Strategic Map Restructure - Solution Summary

## Executive Summary

The strategic map now relies on database-driven cascading that keeps yearly, monthly, weekly, and daily plans perfectly aligned. PostgreSQL triggers generate and synchronise child goals automatically, while React was simplified to trust the backend for cascade updates.

## Current State Analysis

### What Works ✅
- UUID, organization_id, individual_id, scope, status - all working correctly
- Company view and individual view year selector - functioning properly
- Yearly view data storage and retrieval - stable

### Critical Problems ❌
- **Monthly/Weekly/Daily views don't cascade properly**
- Auto-copy only works for December (and only when viewing that year)
- No cascading to weekly/daily views
- Manual copy logic in frontend is unreliable
- No parent-child relationship tracking

## Root Cause

The current implementation tries to handle cascading in the **frontend**, which causes:
1. **Race conditions**: Frontend saves yearly item, then tries to save December item separately
2. **Visibility issues**: Only works when viewing the specific year/month
3. **No relationship tracking**: Can't trace which items spawned which children
4. **Incomplete cascade**: Only handles Year → December, not December → Week → Day

## Solution Overview

### Architecture: Database-Driven Cascading

Cascading logic was moved from the frontend to **PostgreSQL triggers** for reliability and consistency.

### Key Changes

#### 1. Database Schema Enhancement
```sql
-- Add parent-child relationship tracking
ALTER TABLE strategic_map_items 
ADD COLUMN parent_item_id UUID REFERENCES strategic_map_items(id);
```

#### 2. Cascade Rules (Server-Side)

| Source | Target | Logic |
|--------|--------|-------|
| **Yearly** (2024) | **December Monthly** | Auto-copy to `2024-12-01` |
| **December Monthly** | **Last Week of Dec** | Auto-copy to last week start date |
| **December Monthly** | **Last Day of Dec** | Auto-copy to `2024-12-31` |
| **Last Week** | **Last Day of Week** | Auto-copy to Sunday of that week |
| **Any Month** (Jan, Feb, etc.) | **Last Week of Month** | Auto-copy to last week |
| **Any Month** | **Last Day of Month** | Auto-copy to last day |

#### 3. Implementation Approach

**Option A: Database Triggers (Recommended)**
- PostgreSQL triggers fire automatically on INSERT/UPDATE
- Most reliable, no race conditions
- Works even if API calls fail
- Centralized logic

**Option B: API-Level Cascade**
- Handle in API handler after save
- More control, easier to debug
- Requires explicit calls

**Outcome**: Implemented **Option A** (database triggers) in production.

### Benefits

1. ✅ **Reliability**: Database triggers ensure cascading always happens
2. ✅ **Consistency**: All items follow the same cascade rules
3. ✅ **Traceability**: Parent-child relationships tracked via `parent_item_id`
4. ✅ **Maintainability**: Logic centralized in database/backend
5. ✅ **Performance**: Database-level operations are fast
6. ✅ **Scalability**: Works for any year/month/week/day automatically

## Implementation Highlights

1. **Database**
   - Added `parent_item_id`, `is_auto_generated`, and `cascade_source` columns.
   - Created helper functions to calculate last week/day indices.
  - Added triggers that:
     - Cascade **yearly → monthly (December) → weekly (last week) → daily (last day)**.
     - Propagate manual edits both **upwards** and **downwards** without infinite loops.
     - Auto-assign parent links for manually-created monthly/weekly/daily entries.
   - Backfilled existing data and rehydrated cascades for current organisations.

2. **Backend API**
   - Reused existing POST handler; triggers now handle all cascade copies.
   - Responses include new relational fields so the UI can display cascade metadata if needed.

3. **Frontend (React)**
   - Removed all manual copy/fetch logic from `StrategicMap`.
   - Added a silent cascade refresh routine that reloads yearly/monthly/weekly/daily data after each save.
   - Preserved optimistic UI updates and status cycling while relying on server truth for cascades.

4. **Documentation**
   - Updated `strategic-map-crud-guide.md` with new columns and trigger behaviour.
   - Added architecture notes in `strategic-map-restructure-proposal.md` and cascade flow diagrams.

## Example Flow

### User Creates Yearly Goal
```
1. User types in Yearly view (2024): "Achieve 20% revenue growth"
   ↓
2. Frontend saves yearly item
   ↓
3. Database trigger fires automatically:
   ├─> Creates December 2024 monthly item
   │   ├─> Creates last week of December weekly item
   │   │   └─> Creates last day of week daily item
   │   └─> Creates last day of December daily item
   ↓
4. All items are linked via parent_item_id
```

### User Edits Yearly Goal
```
1. User edits yearly goal: "Achieve 25% revenue growth"
   ↓
2. Database trigger updates all children:
   ├─> December monthly item updated
   ├─> Last week weekly item updated
   └─> Last day daily item updated
```

## Files Created

1. **`strategic-map-restructure-proposal.md`**: Detailed technical proposal
2. **`strategic-map-cascade-flow.md`**: Visual flow diagrams and examples
3. **`strategic-map-solution-summary.md`**: This summary document

## Validation Checklist

- [x] Create/edit yearly goals → monthly/week/day cascades appear automatically.
- [x] Edit monthly goals → weekly/day cascades update and yearly column matches.
- [x] Edit weekly/daily goals → parents reflect the change and siblings stay in sync.
- [x] Delete yearly goal → all descendants removed.
- [x] Manual monthly/weekly/daily entries automatically link to their parents.

## Recommended Follow-Up

1. **QA**: Run through strategic planning scenarios for both company and individual scopes.
2. **Observability**: Monitor trigger execution time during bulk updates.
3. **UI Enhancements** (optional): surface `is_auto_generated` vs manual edits in the table tooltips or styling.

The strategic map is now ready for directors and employees to plan top-down and bottom-up without manual duplication. Let me know if you’d like refinements or additional analytics on cascade usage.
