# Common Issues & Quick Fixes

> **Fast troubleshooting guide** for recurring problems

---

## 🔴 CORS Errors

### Symptom
```
Access to fetch at 'http://localhost:8989/api/xxx' from origin 'http://localhost:3000'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

### Root Cause
Missing OPTIONS handler for CORS preflight request.

### Fix (2 steps)

**Step 1**: Add OPTIONS handler in `server/server.js`
```javascript
// BEFORE your existing route
router.options('/api/your-endpoint', async (ctx) => {
  serverUtil.configAccessControl(ctx);
  ctx.status = 200;
});

router.get('/api/your-endpoint', async (ctx) => {
  serverUtil.configAccessControl(ctx);  // ← This must also be present
  // ... rest of handler
});
```

**Step 2**: Add OPTIONS handler in Vercel handler `server/api_handlers/your-handler.js`
```javascript
module.exports = async function handler(req, res) {
  // FIRST line in handler
  if (handleCors(req, res)) return;

  // ... rest of handler
};
```

**Verify**: Should see `OPTIONS` request succeed in browser DevTools Network tab (status 200).

---

## 🔴 Navigation Doesn't Work

### Symptom
- URL changes to `/new_product`
- Page immediately redirects to `/dashboard`
- OR: Page shows blank/white screen

### Root Cause
Missing route or access control entry.

### Fix (2 locations)

**Location 1**: `src/App.js`
```jsx
// Add route for your product
<Route path="/new_product" element={<Home />} />
```

**Location 2**: `src/pages/home/index.js`
```javascript
// Find the useEffect with access control
useEffect(() => {
  if (!isAdmin && activeView !== 'dashboard' &&
      activeView !== 'strategic_map' &&
      activeView !== 'new_product') {  // ← ADD HERE
    setActiveView('dashboard');
  }
}, [isAdmin, activeView]);
```

**Verify**: URL `/new_product` should load without redirecting.

---

## 🔴 Users See Other Organization's Data

### Symptom
- Test with `organization_slug=org-a`
- See data from `org-b`

### Root Cause
Missing `organization_id` filter in database query.

### Fix

**Find the problematic query** (search for table name in controller):
```javascript
// ❌ BAD - Missing filter
const { data } = await supabase
  .from('your_table')
  .select('*');

// ✅ GOOD - With filter
const { data } = await supabase
  .from('your_table')
  .select('*')
  .eq('organization_id', organizationId);  // ← ADD THIS
```

**Important**: Add filter to ALL query types (SELECT, UPDATE, DELETE).

**Verify**:
```bash
# Create data in org-a
curl -X POST "http://localhost:8989/api/items?organization_slug=org-a" \
  -d '{"name": "Test Item"}'

# Try to fetch with org-b (should be empty)
curl "http://localhost:8989/api/items?organization_slug=org-b"
# Expected: []
```

---

## 🔴 API Works in Dev, 404 in Production

### Symptom
- `http://localhost:8989/api/xxx` works
- `https://your-app.vercel.app/api/xxx` returns 404

### Root Cause
Route not registered in Vercel unified router.

### Fix

**File**: `api/[...path].js`

**Step 1**: Import handler
```javascript
const yourHandler = require('../server/api_handlers/your-handler');
```

**Step 2**: Add to routes object
```javascript
const routes = {
  '/api/your-endpoint': yourHandler,
  // ... other routes
};
```

**Verify**:
```bash
# Deploy to Vercel
vercel --prod

# Test endpoint
curl "https://your-app.vercel.app/api/your-endpoint?organization_slug=test"
```

---

## 🔴 API Works in Production, 404 in Dev

### Symptom
- `https://your-app.vercel.app/api/xxx` works
- `http://localhost:8989/api/xxx` returns 404

### Root Cause
Route not added to Koa server.

### Fix

**File**: `server/server.js`

Add route:
```javascript
router.options('/api/your-endpoint', async (ctx) => {
  serverUtil.configAccessControl(ctx);
  ctx.status = 200;
});

router.get('/api/your-endpoint', async (ctx) => {
  serverUtil.configAccessControl(ctx);
  // ... implementation (same logic as Vercel handler)
  ctx.body = { code: 0, data: result };
});
```

**Verify**:
```bash
# Restart dev server
pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start

# Test
curl "http://localhost:8989/api/your-endpoint?organization_slug=test"
```

---

## 🔴 Component Not Found / Import Error

### Symptom
```
Module not found: Can't resolve '@/components/ui/your-component'
```

### Root Cause
Component doesn't exist or not exported.

### Fix

**Step 1**: Check if component exists
```bash
ls src/components/ui/your-component.jsx
```

**Step 2**: Check exports in `src/components/ui/index.js`
```javascript
export { YourComponent } from './your-component';
```

**Step 3**: Use correct import
```javascript
// ✅ GOOD
import { Button } from '@/components/ui/button';

// ❌ BAD - Missing file extension in path alias
import { Button } from '@/components/ui/button.jsx';
```

---

## 🔴 Port Already in Use

### Symptom
```
Error: listen EADDRINUSE: address already in use :::8989
Error: listen EADDRINUSE: address already in use :::3000
```

### Root Cause
Previous server process still running.

### Fix

**Option 1**: Use recommended start command (kills old processes)
```bash
pkill -f "server/server.js"; pkill -f "react-scripts"; npm run start
```

**Option 2**: Manual kill
```bash
# Find process
lsof -i :8989
lsof -i :3000

# Kill by PID
kill -9 [PID]
```

---

## 🔴 Build Fails with "Module parse failed"

### Symptom
```
Module parse failed: Unexpected token (XX:XX)
You may need an appropriate loader to handle this file type
```

### Root Cause
Trying to import a file that Webpack can't parse (e.g., importing `.md` file as JavaScript).

### Fix

**Check your imports**:
```javascript
// ❌ BAD - Can't import markdown as JS
import readme from './README.md';

// ✅ GOOD - Only import JS/JSX/JSON/CSS
import { MyComponent } from './MyComponent.jsx';
```

---

## 🔴 Realtime Updates Not Working

### Symptom
- Changes in one browser tab don't appear in another
- Supabase Realtime subscription silent

### Troubleshooting Steps

**Step 1**: Check Supabase Realtime is enabled
```javascript
// In useEffect
const channel = supabase
  .channel('your-table-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'your_table' },
    (payload) => {
      console.log('🔔 Realtime event:', payload);  // ← Should log
    }
  )
  .subscribe((status) => {
    console.log('📡 Subscription status:', status);  // ← Should be "SUBSCRIBED"
  });
```

**Step 2**: Verify RLS policies allow SELECT
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

**Step 3**: Check browser console for errors

---

## 🔴 Session Lost on Refresh

### Symptom
- User logs in
- Refreshes page
- Redirected to login again

### Root Cause
Session cookie not persisted or expired.

### Fix

**Check session configuration** in `server/server.js`:
```javascript
app.keys = [process.env.SESSION_SECRET || 'your-secret-key'];

app.use(session({
  key: 'koa:sess',
  maxAge: 7200000,  // 2 hours
  httpOnly: true,
  signed: true,
  rolling: true,  // ← Refresh on each request
}, app));
```

**Verify**: Session cookie `lk_token` should persist in browser DevTools > Application > Cookies.

---

## 🔴 Deployment Fails on Vercel

### Symptom
```
Error: Failed to compile
```

### Common Causes & Fixes

**Cause 1**: Missing environment variables
```bash
# Add in Vercel dashboard or CLI
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

**Cause 2**: Build errors (unused variables, linting)
```bash
# Check build locally
npm run build

# Fix errors shown in output
```

**Cause 3**: Incorrect Node.js version
```json
// package.json
"engines": {
  "node": ">=18.0.0"
}
```

---

## Quick Diagnostic Commands

```bash
# Check all API handlers exist
ls server/api_handlers/

# Check routes registered in Vercel
grep "'/api/" api/\[...path\].js

# Check for missing organization_id filters (potential security issue)
grep -r "supabase.from" server/ | grep -v "organization_id" | grep -v "organizations"

# Check for CORS handlers in server.js
grep "router.options" server/server.js | wc -l

# Find all TODO comments
grep -r "TODO\|FIXME" src/ server/
```

---

## Related Documentation

- **API Design Pattern**: `/docs/patterns/api-design.md`
- **Multi-Tenant Queries**: `/docs/patterns/multi-tenant-queries.md`
- **Component Library**: `/docs/design-system/component-library.md`

---

Last Updated: 2025-11-28
