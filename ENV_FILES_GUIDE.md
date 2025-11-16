# Environment Files Guide

## 🎯 Which .env Files Are Being Used?

### ✅ `.env.development.local` - ACTIVE (Local Development Only)
**Used by**: Create React App development server (`npm start`)
**Purpose**: Development server configuration
**Contents**:
```bash
DANGEROUSLY_DISABLE_HOST_CHECK=true  # Allows ngrok/external access
HOST=0.0.0.0                         # Bind to all interfaces
PORT=3000                            # Dev server port
```
**Keep**: YES - Needed for local development with ngrok

---

### ✅ `.env` - ACTIVE (Local Development Only)
**Used by**: Node.js backend server (`server/server.js`) and frontend build
**Purpose**: Supabase credentials and API configuration
**Contents**:
```bash
# Backend (Node.js server)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Frontend (React app)
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
REACT_APP_API_BASE=http://localhost:8989  # ⚠️ WRONG FOR PRODUCTION
REACT_APP_USE_STRATEGIC_MAP_API=true
REACT_APP_ALLOW_EXTERNAL_BROWSER=true
```

**Issues**:
1. ❌ `REACT_APP_SUPABASE_URL` is duplicated (line 2 and line 8)
2. ❌ `REACT_APP_API_BASE=http://localhost:8989` is wrong for production
3. ⚠️ This file is in `.gitignore` so it's **NOT deployed to Vercel**

**Keep**: YES - But needs cleanup

---

### ❌ `.env.bak` - UNUSED (Backup File)
**Used by**: Nothing
**Purpose**: Old backup before you added React app variables
**Contents**: Outdated Supabase config
**Keep**: NO - Safe to delete

---

## 🚨 CRITICAL ISSUE: Production API Configuration

### The Problem

Your Vercel deployment at `https://inside-cloud.vercel.app/` has **TWO separate deployments**:

1. **Frontend (React)**: Static files hosted on Vercel CDN
2. **Backend (Node.js)**: Serverless Functions at `/api/*`

**Both run on the SAME domain**, so:
- ✅ Frontend: `https://inside-cloud.vercel.app/`
- ✅ Backend API: `https://inside-cloud.vercel.app/api/...`

### Current Configuration (WRONG)

```bash
# In .env (not deployed to Vercel!)
REACT_APP_API_BASE=http://localhost:8989
```

This means your production build is trying to call `http://localhost:8989/api/...` which doesn't exist in production!

### Correct Configuration

**For Vercel production**, you should use **relative URLs**:

```bash
# .env (for local development)
REACT_APP_API_BASE=http://localhost:8989

# Vercel Environment Variables (for production)
REACT_APP_API_BASE=   # EMPTY or just "/"
```

Or better yet, make your code handle both:

```javascript
// src/tools/strategic-map/api.js
const API_BASE = process.env.REACT_APP_API_BASE || '';
// In production: '' means same domain
// In development: 'http://localhost:8989'
```

---

## 📋 How Environment Variables Work

### Local Development (npm start)

1. React dev server reads:
   - `.env.development.local` (highest priority)
   - `.env.local`
   - `.env.development`
   - `.env` (lowest priority)

2. Node.js backend server reads:
   - `.env` (via `require('dotenv').config()`)

### Vercel Production

1. **Frontend build** reads:
   - `.env` (if committed to git)
   - Vercel Environment Variables (configured in dashboard)

2. **Backend functions** read:
   - Vercel Environment Variables ONLY

3. **Your `.env` is NOT deployed** (it's in `.gitignore`)

---

## ✅ Recommended Setup

### 1. Clean up `.env`

Remove duplicates:

```bash
# Backend (Node.js server)
SUPABASE_URL=https://rituzypqhjawhyrxoddj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Frontend (React app)
REACT_APP_SUPABASE_URL=https://rituzypqhjawhyrxoddj.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbG...
REACT_APP_USE_STRATEGIC_MAP_API=true
REACT_APP_ALLOW_EXTERNAL_BROWSER=true
REACT_APP_API_BASE=http://localhost:8989  # For local dev only
```

### 2. Configure Vercel Environment Variables

Go to: https://vercel.com/insidedeveloper888/inside-cloud/settings/environment-variables

Add these:

```bash
# Backend
SUPABASE_URL=https://rituzypqhjawhyrxoddj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Frontend (all REACT_APP_* variables)
REACT_APP_SUPABASE_URL=https://rituzypqhjawhyrxoddj.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbG...
REACT_APP_USE_STRATEGIC_MAP_API=true
REACT_APP_ALLOW_EXTERNAL_BROWSER=true
REACT_APP_API_BASE=                       # LEAVE EMPTY!
```

### 3. Update Code to Handle Empty API_BASE

Your code already handles this correctly:

```javascript
// src/tools/strategic-map/api.js line 8
const API_BASE = process.env.REACT_APP_API_BASE || '';
```

When `REACT_APP_API_BASE=''`, requests go to:
- Local: ERROR (empty string)
- Production: `https://inside-cloud.vercel.app/api/...` ✅ (relative URL)

### 4. Better Approach: Auto-detect Environment

```javascript
const API_BASE = process.env.REACT_APP_API_BASE ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8989' : '');
```

This way you don't need to set `REACT_APP_API_BASE` at all!

### 5. Delete `.env.bak`

```bash
rm .env.bak
```

---

## 🔧 Quick Fix Commands

```bash
# 1. Delete backup file
rm .env.bak

# 2. Clean up .env (remove duplicate line 2)
# (I'll do this for you)

# 3. Add environment variables to Vercel:
# Go to: https://vercel.com/insidedeveloper888/inside-cloud/settings/environment-variables
# Add all REACT_APP_* and SUPABASE_* variables
# Set REACT_APP_API_BASE to empty string or remove it entirely
```

---

## ⚠️ Important Notes

1. **Port 8989 doesn't exist in Vercel**:
   - Vercel only exposes port 80 (HTTP) and 443 (HTTPS)
   - You can't access `:8989` in production
   - The backend API runs as serverless functions at `/api/*`

2. **Same-origin requests**:
   - Frontend: `https://inside-cloud.vercel.app/`
   - Backend: `https://inside-cloud.vercel.app/api/...`
   - These are same-origin, so no CORS issues!

3. **Environment variables in `.gitignore`**:
   - Never commit secrets to git
   - Always use Vercel dashboard for production variables
   - `.env` is for local development only

---

## 🎯 Answer to Your Questions

### Q: Which .env files are actually using?

**Local Development**:
- ✅ `.env.development.local` - Dev server config
- ✅ `.env` - Supabase credentials and API base URL
- ❌ `.env.bak` - Not used (backup)

**Vercel Production**:
- ❌ None of these files (they're in .gitignore)
- ✅ Vercel Environment Variables (dashboard)

### Q: Should REACT_APP_API_BASE be https://inside-cloud.vercel.app:8989?

**NO!** ❌

1. Port 8989 doesn't exist in Vercel (it's localhost only)
2. Both frontend and backend run on same domain in Vercel
3. Correct value: **Empty string** `""` or just `/`

**Correct URLs**:
- Local: `http://localhost:8989/api/strategic_map_v2`
- Production: `https://inside-cloud.vercel.app/api/strategic_map_v2`

---

## 🚀 Next Steps

1. Let me clean up your `.env` file
2. Delete `.env.bak`
3. Configure Vercel environment variables
4. Redeploy to test
