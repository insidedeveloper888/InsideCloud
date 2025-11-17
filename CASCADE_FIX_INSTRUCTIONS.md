# Strategic Map Cascade Fix Instructions

## Problem Summary

Your strategic map cascading is broken because **3 critical helper functions are missing** from the Supabase database:

1. `get_last_week_of_month(year, month)` - Calculates last week of a month
2. `get_sunday_of_iso_week(year, week_number)` - Gets Sunday date for a week
3. `date_to_date_key(date)` - Converts date to YYYYMMDD format

When you add a goal in 2025 (yearly view), the cascade should create **4 records**:
- ✅ Yearly (original)
- ✅ Monthly (December) - cascaded from yearly
- ❌ Weekly (last week of Dec) - **FAILS HERE** because `get_last_week_of_month()` doesn't exist
- ❌ Daily (Sunday) - never reached

## Current Status

**Database**: Only 2 records (yearly + monthly)
**UI Display**: Shows 3 views (yearly, monthly, weekly) because the UI has display-level cascading logic that copies parent items for display, but this is just visual - the actual database records don't exist.

## Why UI Shows It Anyway

The UI code (`src/tools/strategic-map/index.jsx:475-496`) has a `getCascadedItems()` function that **manually displays parent items in child timeframes**:
- December (monthly) shows yearly items
- Last week (weekly) shows monthly items
- Sunday (daily) shows weekly items

But this is just for display! The actual database cascade is broken.

## Solution

### Step 1: Install Helper Functions & Trigger

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/rituzypqhjawhyrxoddj
2. Go to **SQL Editor** (left sidebar)
3. Open the file: `INSTALL_CASCADE_COMPLETE.sql`
4. Copy entire contents and paste into SQL Editor
5. Click **Run** (or `Cmd+Enter`)

You should see success messages:
```
Functions installed: 4
✅ Installation complete! Try creating a new yearly goal to test cascading.
```

### Step 2: Clean Up Old Incomplete Records (Optional)

If you want to clean up the existing "Test" goal that only has 2 records:

```sql
-- Delete the incomplete cascade
DELETE FROM strategic_map_items
WHERE text = 'Test';
```

### Step 3: Test the Fix

**Option A: Test in UI**
1. Open your strategic map tool
2. Add a new goal in 2025 (yearly view) in the "阶段成就" category
3. Check that it appears in:
   - Yearly view (2025 column)
   - Monthly view (December cell, blue background)
   - Weekly view (last week of December, green background)
   - Daily view (Sunday of last week, purple background)

**Option B: Test with Script**

First, create a new goal in the UI, then run:
```bash
node test_cascade.js
```

Expected output:
```
Cascade Chain:
==============
• [YEARLY] (ORIGINAL)
   └─> [MONTHLY] (CASCADED)
      └─> [WEEKLY] (CASCADED)
         └─> [DAILY] (CASCADED)

Summary:
========
Yearly:  1 record(s) ✓
Monthly: 1 record(s) ✓
Weekly:  1 record(s) ✓
Daily:   1 record(s) ✓

🎉 SUCCESS! Cascade is working correctly!
```

## Technical Details

### What the Cascade Does

```
User creates yearly goal "Launch Product V2"
   ↓ (trigger fires)
Database creates monthly goal in December 2025
   ↓ (trigger fires again)
Database creates weekly goal in Week 52
   ↓ (trigger fires again)
Database creates daily goal on Sunday Dec 28

Result: 4 related records with parent-child relationships
```

### Database Schema

Each cascaded item has:
- `parent_item_id`: Points to parent record
- `is_cascaded`: TRUE for auto-generated items
- `cascade_level`: 0 (yearly) → 1 (monthly) → 2 (weekly) → 3 (daily)
- Timeframe-specific columns:
  - `year_index` for yearly
  - `month_col_index` for monthly
  - `week_number` for weekly
  - `daily_date_key` for daily

## Files Created

1. **INSTALL_CASCADE_COMPLETE.sql** - Main installation script (run this in Supabase)
2. **create_helper_functions.sql** - Just the helper functions (reference)
3. **test_cascade.js** - Test script to verify cascade is working
4. **check_cascade_db.js** - Diagnostic script to check current state
5. **CASCADE_FIX_INSTRUCTIONS.md** - This file

## Troubleshooting

**Q: I ran the SQL but new goals still don't cascade**
- Refresh your browser
- Check Supabase logs for errors
- Run `check_cascade_db.js` to verify current state

**Q: Trigger exists but helper functions missing**
- Run just the helper functions section from `create_helper_functions.sql`

**Q: How do I check if functions are installed?**
Run in SQL Editor:
```sql
SELECT proname AS function_name
FROM pg_proc
WHERE proname IN (
  'create_cascaded_items',
  'get_last_week_of_month',
  'get_sunday_of_iso_week',
  'date_to_date_key'
)
ORDER BY proname;
```

Should return 4 rows.

## Next Steps

After fixing:
1. The cascade will work for **NEW** goals only
2. Old incomplete goals (like "Test") will remain incomplete
3. You can either:
   - Delete old goals and recreate them
   - Leave them as-is (they still display via UI logic)
   - Manually create the missing cascade records

## Support

If you encounter issues, check:
- Supabase function logs
- Browser console errors
- Database trigger status: `check_cascade_status.sql`
