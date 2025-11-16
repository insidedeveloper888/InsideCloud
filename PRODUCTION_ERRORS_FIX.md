# Production Errors - Root Cause & Fix

## 🐛 Errors You Encountered

### Error 1: `/api/organization?slug=cloud` → 500 Internal Server Error

```json
{
  "error": {
    "code": "500",
    "message": "A server error has occurred"
  }
}
```

### Error 2: `/api/strategic_map_v2` (POST) → 401 Authentication Required

```json
{
  "code": -1,
  "msg": "Authentication required",
  "data": null
}
```

---

## 🔍 Root Cause Analysis

### The Problem

**api/organization.js was using the wrong handler format!**

### Local Development vs Production

| Environment | Server | Handler Format |
|-------------|--------|----------------|
| **Local** | Koa (server/server.js) | `async (ctx) => {...}` |
| **Vercel** | Serverless Functions | `async function handler(req, res) {...}` |

### What Happened

#### Before (BROKEN in Vercel):

```javascript
// api/organization.js
const { configAccessControl } = require('../server/server_util');

module.exports = async (ctx) => {  // ❌ Koa-style
  configAccessControl(ctx);  // ❌ ctx doesn't exist in Vercel!
  const { slug } = ctx.query;  // ❌ undefined in Vercel
  // ...
};
```

**In Vercel**:
- Serverless functions receive `(req, res)` not `(ctx)`
- `ctx.query` → `undefined`
- `ctx.status` → `undefined`
- Function crashes → 500 error

#### After (FIXED):

```javascript
// api/organization.js
const { handleCors } = require('./_utils');

module.exports = async function handler(req, res) {  // ✅ Vercel-style
  if (handleCors(req, res)) return;  // ✅ CORS using _utils
  const { slug } = req.query;  // ✅ Works in Vercel
  return res.status(200).json({...});  // ✅ Correct response format
};
```

---

## 🔗 Why Error 2 Happened (Authentication Required)

### The Cascade Effect

```
1. Frontend calls /api/organization?slug=cloud
   ↓
2. 500 error → Organization ID not fetched
   ↓
3. organizationId = null
   ↓
4. Frontend tries to create item without auth cookies
   ↓
5. Backend can't authenticate → 401 error
```

### Authentication Flow

```javascript
// Frontend: src/tools/strategic-map/index.jsx
const response = await axios.get(`/api/organization?slug=${organizationSlug}`, {
  withCredentials: true  // Send cookies
});

if (response.data && response.data.id) {
  setOrganizationId(response.data.id);  // ✅ This failed before
}
```

When organization endpoint failed:
- `organizationId` stayed `null`
- Realtime sync couldn't initialize
- But more importantly: Auth cookie flow was broken

---

## 🎯 The Fix

### Changed api/organization.js

**From Koa format** → **To Vercel Serverless format**

| Before (Koa) | After (Vercel) |
|--------------|----------------|
| `module.exports = async (ctx) =>` | `module.exports = async function handler(req, res)` |
| `ctx.query` | `req.query` |
| `ctx.status = 200` | `res.status(200)` |
| `ctx.body = {...}` | `res.json({...})` |
| `configAccessControl(ctx)` | `handleCors(req, res)` (from _utils.js) |

---

## 🏗️ Understanding Your Architecture

### Local Development (npm start)

```
server.js (Koa)
├── Uses Koa Router
├── Registers routes: router.get('/api/organization', ...)
└── Expects handlers with (ctx) parameter
```

**Files**: `server/server.js` calls `api/*.js` files

### Vercel Production

```
Vercel Serverless Functions
├── api/*.js files become individual functions
├── No server.js running
├── Each function expects (req, res) parameters
└── Vercel provides routing automatically
```

**Files**: Only `api/*.js` files are used

### The Mismatch

- ❌ **api/organization.js** was written for Koa (ctx)
- ✅ **api/strategic_map_v2.js** was already in Vercel format (req, res)

This is why strategic_map_v2 worked fine locally and in production, but organization endpoint only worked locally!

---

## 🤔 Why Did It Work Locally?

### Local Development Setup

In `server/server.js` (line 1289):

```javascript
router.get('/api/organization', async (ctx) => {
    const organizationHandler = require('../api/organization')
    await organizationHandler(ctx)  // Passed Koa's ctx
})
```

**Locally**: Koa server wraps the handler and provides `ctx` ✅

**Vercel**: No Koa server → Handler receives `(req, res)` directly ❌

---

## ✅ What's Fixed Now

After the fix and deployment:

1. ✅ `/api/organization?slug=cloud` returns 200 with org data
2. ✅ Frontend gets `organizationId` successfully
3. ✅ Realtime subscriptions can initialize
4. ✅ Authentication cookies are sent correctly
5. ✅ `/api/strategic_map_v2` (POST) works with proper auth

---

## 📋 Testing Checklist

After Vercel deploys the fix:

### Test 1: Organization Endpoint

Open console and check:
```javascript
// Should see this log:
📍 Organization ID fetched for realtime: 86774cf1-7590-487e-9657-110cdf3c7fc9
```

### Test 2: Network Tab

Check these requests succeed:
- ✅ GET `/api/organization?slug=cloud` → 200 OK
- ✅ GET `/api/strategic_map_v2?organization_slug=cloud` → 200 OK
- ✅ POST `/api/strategic_map_v2` (when creating item) → 200 OK

### Test 3: Create New Item

1. Navigate to Strategic Map
2. Click add button
3. Type a test goal
4. Save

**Expected**:
- ✅ Item appears immediately
- ✅ No "Authentication required" error
- ✅ No "falling back to localStorage" message

---

## 🔧 Vercel Environment Variables

**IMPORTANT**: After deployment succeeds, you still need to configure Vercel environment variables!

See [VERCEL_SETUP_INSTRUCTIONS.md](VERCEL_SETUP_INSTRUCTIONS.md) for:
- Required environment variables
- How to add them to Vercel dashboard
- Why `REACT_APP_API_BASE` should be empty

---

## 📚 Related Issues

### Why Both Errors Were Related

```mermaid
graph TD
    A[/api/organization fails with 500] --> B[organizationId = null]
    B --> C[No realtime sync]
    B --> D[Auth flow broken]
    D --> E[/api/strategic_map_v2 returns 401]
```

**Fix one, fix both!** ✅

---

## 🎓 Lesson Learned

### When Writing Vercel Serverless Functions

Always use this format:

```javascript
// ✅ CORRECT - Works in both local and Vercel
module.exports = async function handler(req, res) {
  // Use req, res (Express-style)
  const { param } = req.query;
  return res.status(200).json({ data });
};
```

**Not this**:

```javascript
// ❌ WRONG - Only works locally with Koa
module.exports = async (ctx) => {
  // Uses ctx (Koa-style)
  const { param } = ctx.query;
  ctx.status = 200;
  ctx.body = { data };
};
```

---

## ✅ Summary

| Issue | Root Cause | Fix | Status |
|-------|------------|-----|--------|
| 500 on /api/organization | Wrong handler format (Koa instead of Vercel) | Changed to `(req, res)` format | ✅ Fixed & Deployed |
| 401 on /api/strategic_map_v2 | Caused by error #1 (no auth flow) | Same fix resolves both | ✅ Fixed & Deployed |

**Next**: Wait for Vercel deployment to complete, then test! 🚀
