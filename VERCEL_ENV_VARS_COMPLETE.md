# Complete Vercel Environment Variables Setup

## 🚨 CRITICAL: Missing Environment Variables in Production

Your production deployment is missing ALL environment variables, which is why authentication fails!

---

## 📋 Step-by-Step Configuration

### 1. Go to Vercel Dashboard

URL: https://vercel.com/insidedeveloper888/inside-cloud/settings/environment-variables

### 2. Add ALL These Variables

Click "Add New" for each variable below. Make sure to select **"Production", "Preview", and "Development"** for all.

---

## 🔐 Backend Environment Variables

These are used by your Node.js serverless functions in the `api/` folder.

| Key | Value | Notes |
|-----|-------|-------|
| `SUPABASE_URL` | `https://rituzypqhjawhyrxoddj.supabase.co` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdHV6eXBxaGphd2h5cnhvZGRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ2MDk1MSwiZXhwIjoyMDc1MDM2OTUxfQ.8hHBVLug-P_2LxQoFN6n0-deXgNfxK3ozPf4pD7zZJY` | Service role key (full access) |

---

## 🎨 Frontend Environment Variables (REACT_APP_*)

These are embedded in your React build and used by the browser.

| Key | Value | Notes |
|-----|-------|-------|
| `REACT_APP_SUPABASE_URL` | `https://rituzypqhjawhyrxoddj.supabase.co` | Supabase URL (same as backend) |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdHV6eXBxaGphd2h5cnhvZGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NjA5NTEsImV4cCI6MjA3NTAzNjk1MX0.QvmowHv7-I6uGSf1p_47KL3OYOD6AFJEIsL4TUlcqic` | Anon key (public, RLS enforced) |
| `REACT_APP_USE_STRATEGIC_MAP_API` | `true` | Enable Strategic Map v2 API |
| `REACT_APP_ALLOW_EXTERNAL_BROWSER` | `true` | Allow access outside Lark |
| `REACT_APP_API_BASE` | *(leave empty)* | Empty = use same domain |

**IMPORTANT for `REACT_APP_API_BASE`**:
- In the Vercel dashboard, add the key but leave the value **completely empty**
- Do NOT put `http://localhost:8989` (that's only for local dev)
- Empty value means use relative URLs (`/api/...`)

---

## 🔧 Optional: Lark Configuration (If Using Lark Auth)

These are currently hardcoded in `server/server_config.js` but can be moved to environment variables for security:

| Key | Value | Notes |
|-----|-------|-------|
| `LARK_APP_ID` | `cli_a7c6350f9778d010` | Your Lark app ID |
| `LARK_APP_SECRET` | `cMfrfWMK5vppT6zh89zzohz5jby8GiRc` | Your Lark app secret |
| `LARK_NONCESTR` | `TRnJnK2X7MtMiMDHwwdR38hnebbdeMAE` | Random string for signing |

**Note**: These are currently in `server_config.js` which is committed to git. For better security, you should:
1. Add these to Vercel environment variables
2. Update `server_config.js` to read from env vars
3. Remove hardcoded values from the file

---

## 🎯 How to Add Each Variable

For each variable in the tables above:

1. Click **"Add New"** button
2. **Key**: Enter the exact key name (e.g., `SUPABASE_URL`)
3. **Value**: Copy and paste the value from the table
4. **Environments**: Check all three boxes:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **"Save"**

Repeat for all variables!

---

## 🚀 After Adding Variables

### 1. Trigger a Redeploy

Environment variables only apply to NEW deployments. You must redeploy:

**Option A**: From Vercel Dashboard
1. Go to: https://vercel.com/insidedeveloper888/inside-cloud/deployments
2. Find the latest deployment
3. Click the "..." menu
4. Click **"Redeploy"**

**Option B**: Push a New Commit
```bash
# Make any small change
git commit --allow-empty -m "Trigger redeploy with env vars"
git push
```

### 2. Wait for Deployment

- Watch the deployment progress in Vercel dashboard
- Should take 2-3 minutes
- You'll see a green checkmark when done

### 3. Test in Production

Open your app in Lark and try to:

1. **Test Organization API**:
   - Open browser console (if accessible in Lark)
   - Should see: `📍 Organization ID fetched for realtime: ...`
   - Should NOT see: `⚠️ Could not fetch organization ID`

2. **Test Creating an Item**:
   - Navigate to Strategic Map
   - Click add button
   - Type a test goal
   - Press Enter to save
   - Should save successfully (no 401 error!)

---

## 🐛 Troubleshooting

### Issue: Still getting 401 errors after adding env vars

**Possible causes**:

1. **Didn't redeploy**
   - Solution: Redeploy from Vercel dashboard

2. **Not accessing from within Lark**
   - Solution: Must open the app inside Lark, not in a regular browser

3. **Lark OAuth not configured for Vercel domain**
   - Go to Lark Open Platform Console
   - Add `https://inside-cloud.vercel.app` to redirect URIs
   - See "Lark OAuth Configuration" section below

4. **Missing cookies**
   - Check if `lk_token` cookie exists
   - If not, Lark authentication didn't work

### Issue: Environment variables not showing up

**Check**:
1. Go to Vercel dashboard → Settings → Environment Variables
2. Verify all variables are there
3. Make sure all three environments are checked (Production, Preview, Development)

### Issue: Still falling back to localStorage

**This means**:
- Either env vars are missing
- Or deployment didn't pick them up

**Solution**:
1. Verify env vars are added
2. Redeploy
3. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

---

## 🔐 Lark OAuth Configuration

For authentication to work in production, you need to configure Lark:

### 1. Go to Lark Open Platform

URL: https://open.larksuite.com/ (or https://open.feishu.cn/ for China)

### 2. Find Your App

App ID: `cli_a7c6350f9778d010`

### 3. Add Redirect URI

In your app settings:

1. Go to **"Security Settings"** or **"OAuth Settings"**
2. Find **"Redirect URIs"** section
3. Add these URIs:
   - `https://inside-cloud.vercel.app`
   - `https://inside-cloud.vercel.app/auth/callback`
   - `https://inside-cloud.vercel.app/`

4. Save changes

### 4. Verify Domain

Some apps require domain verification:
1. Download verification file
2. Upload to Vercel static files
3. Or add DNS TXT record

---

## ✅ Complete Checklist

Before considering this done:

- [ ] Added `SUPABASE_URL` to Vercel
- [ ] Added `SUPABASE_SERVICE_ROLE_KEY` to Vercel
- [ ] Added `REACT_APP_SUPABASE_URL` to Vercel
- [ ] Added `REACT_APP_SUPABASE_ANON_KEY` to Vercel
- [ ] Added `REACT_APP_USE_STRATEGIC_MAP_API=true` to Vercel
- [ ] Added `REACT_APP_ALLOW_EXTERNAL_BROWSER=true` to Vercel
- [ ] Added `REACT_APP_API_BASE` (empty value) to Vercel
- [ ] Selected "Production, Preview, Development" for ALL variables
- [ ] Triggered a redeploy
- [ ] Waited for deployment to complete
- [ ] Configured Lark OAuth redirect URIs (if using Lark auth)
- [ ] Tested in Lark - organization ID fetches successfully
- [ ] Tested creating an item - no 401 error
- [ ] Verified realtime sync works

---

## 📊 Expected Result

After configuration:

### ✅ Success Logs (in console)

```
📍 Organization ID fetched for realtime: 86774cf1-7590-487e-9657-110cdf3c7fc9
🔌 Subscribing to realtime channel: strategic_map_86774cf1-7590-487e-9657-110cdf3c7fc9
🔌 Realtime subscription status: SUBSCRIBED
✅ Successfully subscribed to realtime updates
```

### ✅ Success Network Requests

```
GET /api/organization?slug=cloud → 200 OK
GET /api/strategic_map_v2?organization_slug=cloud → 200 OK
POST /api/strategic_map_v2 → 200 OK (when creating item)
```

### ❌ No More Errors

- No more 401 Authentication required
- No more "falling back to localStorage"
- No more 500 errors
- No more CORS errors

---

## 🎓 Understanding the Fix

### Why It Failed Before

```
Vercel Serverless Function
├── Tries to read process.env.SUPABASE_URL
├── Returns undefined (variable not set)
├── Supabase client fails to initialize
└── All database operations fail → 500 error
```

### Why It Works Now

```
Vercel Dashboard Environment Variables
    ↓ (injected at build/runtime)
Vercel Serverless Function
├── Reads process.env.SUPABASE_URL ✅
├── Supabase client initializes successfully ✅
├── Database operations work ✅
└── Authentication works ✅
```

---

## 🆘 Still Having Issues?

If you still get 401 errors after:
1. ✅ Adding all environment variables
2. ✅ Redeploying
3. ✅ Opening in Lark (not regular browser)

Then the issue is likely:
- Lark OAuth redirect URI not configured
- Or you need to re-authenticate in Lark

Let me know and I can help debug further!
