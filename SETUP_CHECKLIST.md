# Strategic Map v2 - Quick Setup Checklist

## ✅ Implementation Complete! Now follow these steps:

### Step 1: Update .env file
```bash
# Add this line to your .env file:
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdHV6eXBxaGphd2h5cnhvZGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NjA5NTEsImV4cCI6MjA3NTAzNjk1MX0.QvmowHv7-I6uGSf1p_47KL3OYOD6AFJEIsL4TUlcqic
```

### Step 2: Run SQL Migration in Supabase
1. Open: https://supabase.com/dashboard/project/rituzypqhjawhyrxoddj
2. Go to: **SQL Editor** → **New Query**
3. Copy all content from: `/supabase/migrations/0004_complete_cascade_logic.sql`
4. Paste into SQL Editor
5. Click **Run**
6. Verify test output shows Week 1 calculations

### Step 3: Enable Realtime Replication
Option A - Via Dashboard:
1. Go to: **Database** → **Replication**
2. Find `strategic_map_items` table
3. **Enable** replication

Option B - Via SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE strategic_map_items;
```

### Step 4: Restart Server
```bash
# Stop current server (Ctrl+C)
npm run start
```

### Step 5: Test Everything
1. Open two browser windows: http://localhost:8989
2. Add a goal in 2025 yearly in Window 1
3. Verify cascade appears in:
   - Dec 2025 monthly ✅
   - Week 1 2026 weekly ✅
   - Sun Jan 4, 2026 daily ✅
4. Verify Window 2 sees the goal automatically (no refresh!)

---

## 📖 Full documentation:
See [STRATEGIC_MAP_V2_COMPLETE.md](./STRATEGIC_MAP_V2_COMPLETE.md) for detailed guide

---

## ⚠️ If Issues Occur:
1. Check browser console for realtime subscription logs
2. Check Supabase logs for cascade trigger notices
3. Verify environment variable is set: `echo $REACT_APP_SUPABASE_ANON_KEY`
4. See Troubleshooting section in full guide
