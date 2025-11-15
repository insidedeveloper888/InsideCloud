# Debugging Guide - Strategic Map v2 Not Working

## Step 1: Check if SQL Migration Actually Ran

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/rituzypqhjawhyrxoddj
2. Go to **SQL Editor** → **New Query**
3. Copy and paste ALL content from `/debug_cascade.sql`
4. Click **Run**
5. **Share the output with me** - especially:
   - CHECK 1: Do you see the 5 utility functions?
   - CHECK 3: Do the test functions return correct values?
   - CHECK 4: What items exist in your database?
   - CHECK 7: Is `strategic_map_items` in the realtime publication?
   - CHECK 8: Count of items by timeframe

## Step 2: Check Browser Console

1. Open your app: http://localhost:8989
2. Open Chrome DevTools (F12 or Cmd+Option+I)
3. Go to **Console** tab
4. Look for these logs:

### ✅ What you SHOULD see:
```
📍 Organization ID fetched for realtime: <some-uuid>
🔌 Subscribing to realtime channel: strategic_map_<uuid>
🔌 Realtime subscription status: SUBSCRIBED
✅ Successfully subscribed to realtime updates
```

### ❌ If you see this instead:
```
⚠️  Supabase environment variables not found
⚠️  Could not fetch organization ID for realtime sync
🔌 Realtime sync: Not available or no organization ID
```

**Then**: Environment variable not loaded properly

## Step 3: Verify Environment Variable

In your terminal, run:
```bash
cat .env | grep SUPABASE_ANON
```

**Should show:**
```
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...
```

**If not found**: You didn't add it to .env file correctly

## Step 4: Check Server Logs

When you add a goal, look at your **server terminal** (where `npm run start` is running).

### ✅ What you SHOULD see:
```
📝 Creating item: { organization_id: '...', text: 'Test Goal', ... }
NOTICE:  [CASCADE] Yearly → Monthly: year_index=0, month_col_index=24299
NOTICE:  [CASCADE] Monthly → Weekly: month_col_index=24299, week=1
NOTICE:  [CASCADE] Weekly → Daily: week_number=1, daily_date_key=20260104
```

### ❌ If you DON'T see CASCADE notices:
- The trigger isn't running
- The migration didn't execute properly

## Step 5: Test API Endpoint Manually

Run this in terminal:
```bash
# Test getting organization ID
curl "http://localhost:8989/api/organization?slug=cloud"

# Should return:
# {"id":"<uuid>","slug":"cloud","name":"...","is_active":true}
```

**If 404 or error**: Server didn't restart properly

## Step 6: Check if Server Actually Restarted

1. Stop server (Ctrl+C)
2. Restart:
```bash
npm run start
```
3. Wait for "Server running on port 8989" message
4. Try adding goal again

## Common Issues & Fixes

### Issue 1: Env variable not loaded
**Symptom**: Console shows "environment variables not found"

**Fix**:
```bash
# Stop server
# Add to .env:
echo 'REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdHV6eXBxaGphd2h5cnhvZGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NjA5NTEsImV4cCI6MjA3NTAzNjk1MX0.QvmowHv7-I6uGSf1p_47KL3OYOD6AFJEIsL4TUlcqic' >> .env

# Restart server
npm run start
```

### Issue 2: SQL migration never ran
**Symptom**: CHECK 1 in debug script shows no functions

**Fix**: You need to actually RUN the SQL migration in Supabase
1. Open `/supabase/migrations/0004_complete_cascade_logic.sql`
2. **Select ALL** (Cmd+A)
3. **Copy** (Cmd+C)
4. Go to Supabase SQL Editor
5. **Paste** (Cmd+V)
6. Click **Run**

### Issue 3: Realtime not enabled
**Symptom**: CHECK 7 shows no `strategic_map_items` in publication

**Fix**:
```sql
-- Run this in Supabase SQL Editor:
ALTER PUBLICATION supabase_realtime ADD TABLE strategic_map_items;
```

### Issue 4: Old trigger still active
**Symptom**: Cascade only goes to Monthly, not Weekly/Daily

**Fix**: Drop and recreate trigger
```sql
-- Run in Supabase SQL Editor:
DROP TRIGGER IF EXISTS trigger_create_cascaded_items ON strategic_map_items;
DROP FUNCTION IF EXISTS create_cascaded_items();

-- Then re-run the entire 0004_complete_cascade_logic.sql file
```

## What to Share with Me

Please run the debug script and share:
1. Output of CHECK 1 (function list)
2. Output of CHECK 4 (your actual items)
3. Output of CHECK 8 (item counts)
4. Screenshot of browser console when you load the page
5. Server terminal output when you add a goal

This will help me identify exactly what's wrong!
