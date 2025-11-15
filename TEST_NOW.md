# Test the Cascaded Items - Step by Step

## Important Note: Jan 3 is SATURDAY, not Sunday!

Week 1, 2026 days:
- Mon Dec 29, 2025
- Tue Dec 30, 2025
- Wed Dec 31, 2025
- Thu Jan 1, 2026
- Fri Jan 2, 2026
- **Sat Jan 3, 2026** ← You're looking here (wrong!)
- **Sun Jan 4, 2026** ← Cascaded item is here! ✅

## Step 1: Verify Database Has All 4 Levels

Run this in Supabase SQL Editor:

```sql
SELECT
  timeframe,
  category_index,
  week_number,
  daily_date_key,
  is_cascaded,
  cascade_level,
  text
FROM strategic_map_items
WHERE text LIKE '%Cascade Test Goal%'
  AND is_deleted = FALSE
ORDER BY cascade_level;
```

**Expected**:
- Row 1: yearly, cascade_level = 0
- Row 2: monthly, cascade_level = 1
- Row 3: weekly, week_number = 1, cascade_level = 2
- Row 4: daily, daily_date_key = 20260104, cascade_level = 3

✅ You confirmed this works!

## Step 2: Restart Your Server (CRITICAL!)

```bash
# Kill server (Ctrl+C)
npm run start
```

## Step 3: FULL PAGE RELOAD (Clear Cache!)

1. Open: http://localhost:8989
2. **Hard reload**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. Open Console (F12)

Look for logs showing data was loaded from API:
```
📍 Organization ID fetched for realtime: ...
```

## Step 4: Navigate to December 2025

1. Expand **2025** yearly view
2. Look for **Dec 2025** column in monthly view
3. You should see your test goal with blue background (cascaded)

## Step 5: Expand December to Weekly View

1. Click the expand button on December 2025
2. Look for **Week 1** (it might show as "Week 1" or "W1")
3. You should see your test goal with blue background

## Step 6: Expand Week 1 to Daily View

1. Click expand on Week 1
2. Look at the 7 days shown
3. Find **Sun 4** (NOT Sat 3!)
4. The cascaded item should be there with blue background

## Step 7: Check Browser Console

Look for these logs:
```javascript
// When page loads:
📍 Organization ID fetched for realtime: <uuid>
✅ Successfully subscribed to realtime updates

// In the data object loaded:
{
  "yearly_0_0": [{...}],
  "monthly_0_24311": [{...}],  // Dec 2025
  "weekly_0_1": [{...}],       // Week 1
  "daily_0_20260104": [{...}]  // Jan 4, 2026
}
```

## Still Not Working?

### Debug Step A: Check API Response Manually

Open a new terminal and run:
```bash
curl "http://localhost:8989/api/strategic_map_v2?organization_slug=cloud" | jq '.data | keys'
```

**Should show keys like**:
```json
[
  "daily_0_20260104",
  "monthly_0_24311",
  "weekly_0_1",
  "yearly_0_0"
]
```

**If these keys are missing**: Server isn't returning the cascaded items!

### Debug Step B: Check Database One More Time

```sql
-- Show the actual cell keys that should exist:
SELECT
  timeframe || '_' || category_index || '_' ||
  CASE
    WHEN timeframe = 'yearly' THEN year_index::TEXT
    WHEN timeframe = 'monthly' THEN month_col_index::TEXT
    WHEN timeframe = 'weekly' THEN week_number::TEXT
    WHEN timeframe = 'daily' THEN daily_date_key::TEXT
  END as cell_key,
  text,
  is_cascaded
FROM strategic_map_items
WHERE text LIKE '%Cascade Test Goal%'
  AND is_deleted = FALSE
ORDER BY cascade_level;
```

**Expected cell keys**:
- yearly_0_0
- monthly_0_24311 (or 24299 depending on calculation)
- weekly_0_1
- daily_0_20260104

### Debug Step C: Check Console Logs

In browser console, type:
```javascript
console.log(Object.keys(window.__STRATEGIC_MAP_DATA__ || {}));
```

Or check the React state in React DevTools.

## Most Likely Issue

**You're looking at the wrong day!**
- Saturday Jan 3 has NO cascaded item (correct!)
- Sunday Jan 4 has the cascaded item ✅

Make sure you're checking **Sun 4**, not Sat 3!
