# Quick Debug - Do These 4 Things Right Now

## 1. Run Debug SQL Script (2 minutes)

```bash
# Open this file and copy ALL content:
open /Users/jackytok/Desktop/InsideCloud/debug_cascade.sql

# Then:
# 1. Go to: https://supabase.com/dashboard/project/rituzypqhjawhyrxoddj/sql
# 2. Paste the SQL
# 3. Click Run
# 4. Screenshot the results and share with me
```

**Most important**: Look at CHECK 8 - does it show weekly and daily items?

## 2. Restart Your Server (1 minute)

```bash
# Stop server (Ctrl+C if running)

# Start fresh
npm run start
```

Wait for "Server running on..." message before proceeding.

## 3. Open Browser Console BEFORE Adding Goal

```bash
# Open app
open http://localhost:8989

# Press F12 or Cmd+Option+I
# Go to Console tab
# Keep it open!
```

## 4. Add a Goal and Share Logs

1. Add a goal in 2025 yearly column
2. Immediately check:

### A. Browser Console - Should show:
```
📍 Organization ID fetched for realtime: ...
🔌 Subscribing to realtime channel: ...
✅ Successfully subscribed to realtime updates
```

**If you see these instead:**
```
⚠️  Supabase environment variables not found
⚠️  Could not fetch organization ID
```
→ Server needs restart OR .env not loaded

### B. Server Terminal - Should show:
```
📝 Creating item: { ... }
```

**And ideally**:
```
NOTICE: [CASCADE] Yearly → Monthly: ...
NOTICE: [CASCADE] Monthly → Weekly: ...
NOTICE: [CASCADE] Weekly → Daily: ...
```

## Tell Me:

1. **CHECK 8 results**: How many items per timeframe?
2. **Browser console**: Do you see the ✅ or ⚠️ messages?
3. **Server logs**: Do you see the NOTICE messages?

This will tell me exactly what's broken!
