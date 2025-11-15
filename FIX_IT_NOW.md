# Fix It Now - Step by Step Guide

I've updated your `.env` file with the missing variables. Follow these steps **exactly**:

## Step 1: Restart Server (REQUIRED)

```bash
# Kill current server (Ctrl+C)

# Start fresh
npm run start

# Wait for: "Server running on port 8989"
```

## Step 2: Verify SQL Migration Actually Ran

Did you actually RUN the SQL file in Supabase? Here's how:

1. Open `/Users/jackytok/Desktop/InsideCloud/supabase/migrations/0004_complete_cascade_logic.sql`
2. Select **ALL** content (Cmd+A)
3. Copy (Cmd+C)
4. Go to: https://supabase.com/dashboard/project/rituzypqhjawhyrxoddj/sql
5. Click "New Query"
6. Paste (Cmd+V) - should be ~400 lines
7. Click "Run" button
8. You should see output like:
   ```
   NOTICE: === TEST: ISO Week Calculation ===
   NOTICE: Dec 29, 2025 (Mon): Week 1
   ```

**If you see errors**: Share them with me!

## Step 3: Enable Realtime (CRITICAL!)

Run this in Supabase SQL Editor:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE strategic_map_items;
```

Expected output: `ALTER PUBLICATION`

## Step 4: Test CASCADE with Simple Script

1. First, get your IDs:

```sql
-- Run in Supabase SQL Editor:
SELECT id as org_id, slug FROM organizations WHERE slug = 'cloud';
SELECT id as user_id FROM individuals LIMIT 1;
```

2. Copy the two IDs

3. Open `/Users/jackytok/Desktop/InsideCloud/test_cascade_simple.sql`

4. Replace the two lines:
```sql
v_org_id UUID := 'PASTE-YOUR-ORG-ID-HERE';
v_user_id UUID := 'PASTE-YOUR-USER-ID-HERE';
```

5. Run the entire script in Supabase SQL Editor

6. Look for:
```
✅ Monthly cascade: WORKING
✅ Weekly cascade: WORKING
✅ Daily cascade: WORKING
```

**If you see ❌**: The trigger isn't working - share screenshot!

## Step 5: Test Realtime

1. Open: http://localhost:8989
2. Open Console (F12 → Console tab)
3. Look for:
   - `📍 Organization ID fetched for realtime:`
   - `✅ Successfully subscribed to realtime updates`

**If you see ⚠️ warnings**: Realtime not set up properly

4. Open SECOND browser window: http://localhost:8989
5. In Window 1: Add a goal
6. In Window 2: Wait 1 second - does goal appear?

## Most Likely Issues

### Issue #1: SQL Migration Never Ran
**How to check**: Run this in Supabase:
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'get_iso_week';
```

**If no results**: You didn't run the SQL migration!
**Fix**: Do Step 2 above

### Issue #2: Old Trigger Still Active
**How to check**: Run debug_cascade.sql CHECK 4
**If only yearly + monthly exist**: Old trigger still running
**Fix**:
```sql
DROP TRIGGER IF EXISTS trigger_create_cascaded_items ON strategic_map_items;
DROP FUNCTION IF EXISTS create_cascaded_items();

-- Then re-run entire 0004_complete_cascade_logic.sql
```

### Issue #3: Realtime Not Enabled
**How to check**: Browser console shows ⚠️ warnings
**Fix**: Run Step 3 above

### Issue #4: Server Not Restarted
**How to check**: /api/organization returns 404
**Fix**: Do Step 1 above

## What to Share with Me

If still not working, share:

1. **Screenshot of Supabase when you run test_cascade_simple.sql** (after filling in IDs)
   - Shows if cascade is working at database level

2. **Screenshot of browser console** when you load the page
   - Shows if realtime is connecting

3. **Copy/paste of server terminal** after you add a goal
   - Shows if API is working

4. **Output of this query**:
```sql
SELECT
  timeframe,
  COUNT(*) as count,
  is_cascaded
FROM strategic_map_items
WHERE is_deleted = FALSE
GROUP BY timeframe, is_cascaded;
```

This will help me pinpoint the exact issue!
