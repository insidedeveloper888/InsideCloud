# API Development - Lessons Learned

## Issue Timeline: /api/products Endpoint

### Problem Report
User reported: `GET /api/products?organization_slug=cloud` stuck at "Pending" status

### Debugging Journey

#### ❌ Attempt 1: Suspected CORS Issue
**Initial Diagnosis:** User thought it was CORS
**Reality:** Not yet - endpoint didn't exist!

#### ❌ Attempt 2: Missing Koa Route
**Found:** Only created Vercel handler, forgot Koa route
**Fixed:** Added route to `server/server.js`
**Result:** Still stuck at "Pending"

#### ❌ Attempt 3: Wrong Database Schema
**Found:** Code querying non-existent `display_name` column
**Fixed:** Removed `display_name` from all queries
**Result:** Still failing

#### ✅ Attempt 4: Missing OPTIONS Handler
**Found:** No OPTIONS handler for CORS preflight
**Fixed:** Added `router.options('/api/products', ...)`
**Result:** SUCCESS! 🎉

### Root Causes Summary

**3 Critical Mistakes Made:**

1. **Missing Koa Route** (Hybrid Deployment)
   - Created Vercel handler only
   - Forgot to add route to Koa dev server
   - Caused "Pending" status in development

2. **Wrong Database Schema Assumption** (Schema Mismatch)
   - Assumed `display_name` column existed
   - User's schema only had `name` column
   - Caused Supabase query to fail silently

3. **Missing OPTIONS Handler** (CORS)
   - Added GET route but forgot OPTIONS
   - Browser sends OPTIONS preflight before GET
   - Caused CORS error even though route existed

## Lessons Learned

### Lesson 1: Hybrid Deployment = Double Work

**The Pattern:**
Every API endpoint needs **TWO** implementations:
- Koa route in `server/server.js` (development)
- Vercel handler in `server/api_handlers/` (production)

**Why?**
- Dev uses Koa (localhost:8989)
- Prod uses Vercel serverless
- Different frameworks, same logic

**The Mistake:**
Thinking "I'll just create the Vercel handler and it'll work everywhere"

**The Fix:**
Always implement both, always test both.

### Lesson 2: Every Route Needs OPTIONS

**The Pattern:**
```javascript
// ALWAYS PAIR THESE TWO:

// 1. OPTIONS for CORS preflight
router.options('/api/endpoint', async (ctx) => {
  serverUtil.configAccessControl(ctx);
  ctx.status = 200;
})

// 2. Actual route
router.get('/api/endpoint', async (ctx) => {
  serverUtil.configAccessControl(ctx);
  // ... logic
})
```

**Why?**
- Modern browsers use CORS for cross-origin requests
- Browser sends OPTIONS request first (preflight)
- If OPTIONS fails → CORS error, actual request blocked
- Must return 200 + CORS headers

**The Mistake:**
Adding only GET/POST and forgetting OPTIONS

**The Fix:**
OPTIONS handler is mandatory, not optional.

### Lesson 3: Verify Database Schema First

**The Pattern:**
Before writing database queries, verify the actual schema:
```sql
-- Check what columns actually exist
\d products

-- Or in Supabase:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products';
```

**Why?**
- Assumptions about schema cause silent failures
- Supabase doesn't always throw clear errors
- Missing columns cause queries to hang

**The Mistake:**
Writing queries based on ideal schema, not actual schema

**The Fix:**
Always check existing schema before coding.

## Updated Mandatory Checklist

### For Every New API Endpoint:

**Backend Development:**
- [ ] Check database schema if querying database
- [ ] Add **OPTIONS handler** to `server/server.js` (CORS preflight)
- [ ] Add route (GET/POST/etc) to `server/server.js` (Koa)
- [ ] Create handler in `server/api_handlers/` (Vercel)
- [ ] Register in `api/[...path].js` (Vercel unified router)

**Testing:**
- [ ] Test locally: `npm run start:server`
- [ ] Test in browser: Verify no CORS errors in Console
- [ ] Test with curl: `curl http://localhost:8989/api/endpoint`
- [ ] Test production: Deploy to Vercel
- [ ] Test in browser on production URL

**Middleware:**
- [ ] Apply product access middleware if needed: `requireProductAccess()`
- [ ] Apply authentication if needed
- [ ] Add error handling

## Common Error Signatures

### 1. "Pending" Status Forever
**Symptoms:**
- Request stuck at "Pending" in Network tab
- No response, no error
- Timeout after 2+ minutes

**Likely Causes:**
- Missing Koa route (endpoint doesn't exist)
- Database query failing silently
- Infinite loop in handler

**How to Debug:**
- Check server logs for errors
- Verify route exists: `grep "router.get('/api/your-route'" server/server.js`
- Test with curl to bypass browser

### 2. CORS Error
**Symptoms:**
- "No 'Access-Control-Allow-Origin' header"
- "Response to preflight request doesn't pass"
- OPTIONS request shows in Network tab (red)

**Likely Causes:**
- Missing OPTIONS handler
- CORS headers not set correctly
- OPTIONS handler returning error instead of 200

**How to Debug:**
- Check if OPTIONS handler exists
- Verify `serverUtil.configAccessControl(ctx)` is called
- Check OPTIONS request returns 200 in Network tab

### 3. Silent Database Failures
**Symptoms:**
- Request completes but returns empty data
- No errors in logs
- Supabase query returns null

**Likely Causes:**
- Querying non-existent column
- Wrong table/column name
- Missing JOINs or filters

**How to Debug:**
- Add console.log for Supabase errors
- Test query directly in Supabase SQL editor
- Check schema: `\d table_name`

## Documentation Updates

Added critical warnings to:

### CLAUDE.md (Lines 269-325)
- ⚠️ CRITICAL section for new API endpoints
- Code examples with OPTIONS handler
- Common mistakes section
- Mandatory checklist

### ARCHITECTURE.md (Lines 225-318 - ADR-004)
- 🚨 CRITICAL section in ADR-004
- Common failure patterns (Pattern 1 & 2)
- Why OPTIONS handler is required
- Complete template for new endpoints

## Template for Future APIs

```javascript
// =============================================================================
// Your New API - Description
// =============================================================================

// Import helpers
const { yourHelper } = require('./your_helper')

// OPTIONS handler for CORS preflight (ALWAYS REQUIRED)
router.options('/api/your-endpoint', async (ctx) => {
  serverUtil.configAccessControl(ctx);
  ctx.status = 200;
})

// GET handler
router.get('/api/your-endpoint', async (ctx) => {
  serverUtil.configAccessControl(ctx);

  const param = ctx.query.param;

  try {
    // Validate inputs
    if (!param) {
      ctx.status = 400;
      ctx.body = serverUtil.failResponse('Missing required parameter: param');
      return;
    }

    // Query database or call helper
    const result = await yourHelper(param);

    // Return success
    ctx.body = {
      code: 0,
      msg: 'Success',
      data: result
    };
  } catch (error) {
    console.error('❌ API error:', error);
    ctx.status = 500;
    ctx.body = serverUtil.failResponse(error.message || 'Internal server error');
  }
})

// POST handler (if needed)
router.post('/api/your-endpoint', async (ctx) => {
  serverUtil.configAccessControl(ctx);

  const { param } = ctx.request.body;

  // ... similar pattern
})
```

## Prevention Strategy

### Before Starting Development:
1. ✅ Check existing database schema
2. ✅ Review similar endpoints in codebase
3. ✅ Read CLAUDE.md checklist
4. ✅ Copy template, don't write from scratch

### During Development:
1. ✅ Implement Koa route first (test locally)
2. ✅ Add OPTIONS handler immediately
3. ✅ Test in browser (check for CORS)
4. ✅ Then create Vercel handler

### After Development:
1. ✅ Run through mandatory checklist
2. ✅ Test both dev and prod
3. ✅ Verify no console errors
4. ✅ Document any new patterns

## Success Metrics

**Before Documentation:**
- 3 mistakes made
- 4 debugging attempts
- ~2 hours to fix

**After Documentation:**
- 0 mistakes expected
- Clear checklist to follow
- 15 minutes to implement correctly

---

**Key Takeaway:** The hybrid deployment architecture requires extra diligence. Always implement OPTIONS + GET/POST in Koa, always test in browser, always verify schema first.
