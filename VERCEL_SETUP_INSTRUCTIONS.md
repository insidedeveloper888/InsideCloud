# Vercel Environment Variables Setup

## 🎯 Quick Answer to Your Questions

### Q1: Which .env files are being used?

**Local Development** (npm start):
- ✅ `.env` - Supabase credentials and API configuration
- ✅ `.env.development.local` - Dev server settings (ngrok support)
- ❌ `.env.bak` - **DELETED** (was unused backup)

**Vercel Production**:
- ❌ None (all .env files are in .gitignore)
- ✅ **Vercel Dashboard Environment Variables** (you need to configure these!)

### Q2: Should REACT_APP_API_BASE be https://inside-cloud.vercel.app:8989?

**NO!** ❌ Port 8989 doesn't exist in Vercel.

**Correct setup**:
- Local: `REACT_APP_API_BASE=http://localhost:8989`
- Vercel: `REACT_APP_API_BASE=` (empty string or omit entirely)

**Why?**
- Your frontend: `https://inside-cloud.vercel.app/`
- Your backend API: `https://inside-cloud.vercel.app/api/...`
- **Same domain = no port needed!**

---

## 🚀 Configure Vercel Environment Variables

### Step 1: Go to Vercel Dashboard

URL: https://vercel.com/insidedeveloper888/inside-cloud/settings/environment-variables

### Step 2: Add These Variables

Click "Add New" for each:

#### Backend Variables

| Key | Value | Environment |
|-----|-------|-------------|
| `SUPABASE_URL` | `https://rituzypqhjawhyrxoddj.supabase.co` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdHV6eXBxaGphd2h5cnhvZGRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ2MDk1MSwiZXhwIjoyMDc1MDM2OTUxfQ.8hHBVLug-P_2LxQoFN6n0-deXgNfxK3ozPf4pD7zZJY` | Production, Preview, Development |

#### Frontend Variables (REACT_APP_*)

| Key | Value | Environment |
|-----|-------|-------------|
| `REACT_APP_SUPABASE_URL` | `https://rituzypqhjawhyrxoddj.supabase.co` | Production, Preview, Development |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdHV6eXBxaGphd2h5cnhvZGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NjA5NTEsImV4cCI6MjA3NTAzNjk1MX0.QvmowHv7-I6uGSf1p_47KL3OYOD6AFJEIsL4TUlcqic` | Production, Preview, Development |
| `REACT_APP_USE_STRATEGIC_MAP_API` | `true` | Production, Preview, Development |
| `REACT_APP_ALLOW_EXTERNAL_BROWSER` | `true` | Production, Preview, Development |
| `REACT_APP_API_BASE` | *(leave empty)* | Production, Preview, Development |

**Important**: For `REACT_APP_API_BASE`, either:
- Leave it empty (just add the key with blank value)
- Or don't add it at all (code defaults to `''`)

### Step 3: Redeploy

After adding all variables:

1. Go to: https://vercel.com/insidedeveloper888/inside-cloud/deployments
2. Find the latest deployment
3. Click "..." menu → "Redeploy"
4. Or just push a new commit to trigger deployment

---

## 🔍 How to Verify It's Working

After deployment:

1. Open: https://inside-cloud.vercel.app/
2. Open browser console (F12)
3. Navigate to Strategic Map
4. Check console logs:
   - ✅ Should see: `📍 Organization ID fetched for realtime: ...`
   - ✅ Should NOT see: `API load failed, falling back to localStorage`
   - ✅ Network tab should show: `https://inside-cloud.vercel.app/api/strategic_map_v2`
   - ❌ Should NOT see: `http://localhost:8989` in any requests

---

## 📋 What I Changed Locally

### Cleaned up `.env`
- ✅ Removed duplicate `REACT_APP_SUPABASE_URL` line
- ✅ Removed unused `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- ✅ Added comments explaining each section
- ✅ Kept `REACT_APP_API_BASE=http://localhost:8989` for local dev

### Deleted `.env.bak`
- ❌ Removed unused backup file

### Kept `.env.development.local`
- ✅ Still used for ngrok and dev server config

---

## 🎯 Understanding the Setup

### Local Development Architecture

```
Browser (http://localhost:3000)
    ↓
React Dev Server (port 3000)
    ↓ proxy configured in package.json
Node.js Backend (port 8989)
    ↓
Supabase API
```

### Vercel Production Architecture

```
Browser (https://inside-cloud.vercel.app)
    ↓
Vercel CDN (static React files)
    ↓ relative URL /api/*
Vercel Serverless Functions (api/*.js)
    ↓
Supabase API
```

**Key difference**: In production, frontend and backend share the same domain, so no cross-origin requests!

---

## ⚠️ Common Mistakes to Avoid

1. ❌ **Don't** use `https://inside-cloud.vercel.app:8989`
   - Port 8989 doesn't exist in Vercel

2. ❌ **Don't** commit `.env` to git
   - It's in .gitignore for security

3. ❌ **Don't** hardcode `http://localhost:8989` in code
   - Use environment variable: `process.env.REACT_APP_API_BASE`

4. ❌ **Don't** forget to select "Production, Preview, Development" for each variable
   - Otherwise preview deployments won't work

---

## 🐛 Troubleshooting

### Issue: API calls fail in production with 404

**Cause**: `REACT_APP_API_BASE` is set to `http://localhost:8989` in Vercel

**Fix**:
1. Go to Vercel environment variables
2. Set `REACT_APP_API_BASE` to empty string
3. Redeploy

### Issue: "No environment variables found"

**Cause**: Variables not configured in Vercel dashboard

**Fix**: Follow "Configure Vercel Environment Variables" section above

### Issue: Changes not taking effect

**Cause**: Need to redeploy after changing environment variables

**Fix**: Redeploy from Vercel dashboard or push new commit

---

## ✅ Checklist

Before considering this done:

- [ ] Added all environment variables to Vercel dashboard
- [ ] Set `REACT_APP_API_BASE` to empty or omitted it
- [ ] Selected "Production, Preview, Development" for all variables
- [ ] Redeployed the application
- [ ] Tested in production - no localStorage fallback messages
- [ ] Verified API calls go to `https://inside-cloud.vercel.app/api/*`
- [ ] Verified realtime sync works in production

---

## 📞 Next Steps

1. **Configure Vercel variables** (see Step 2 above)
2. **Redeploy** your application
3. **Test** at https://inside-cloud.vercel.app/
4. **Verify** API calls work without localStorage fallback

Once done, your production app will work exactly like local development! 🎉
