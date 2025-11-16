# Why Two Supabase URL Variables?

## Quick Answer

Yes, they're the **same value**, but they're used in **different places**:

| Variable | Used By | Value | Purpose |
|----------|---------|-------|---------|
| `SUPABASE_URL` | **Backend** (Node.js) | `https://rituzypqhjawhyrxoddj.supabase.co` | Server-side Supabase client |
| `REACT_APP_SUPABASE_URL` | **Frontend** (React/Browser) | `https://rituzypqhjawhyrxoddj.supabase.co` | Client-side Supabase client (realtime) |

---

## The Technical Reason

### Create React App Security Feature

**Create React App only exposes variables that start with `REACT_APP_` to the browser.**

This prevents accidentally leaking secrets:

```javascript
// ❌ This will be UNDEFINED in browser
console.log(process.env.SUPABASE_SERVICE_ROLE_KEY);  // undefined

// ✅ This works in browser
console.log(process.env.REACT_APP_SUPABASE_URL);  // works!
```

### Backend vs Frontend

**Backend (Node.js server):**
```javascript
// server/supabase_client.js
const supabaseUrl = process.env.SUPABASE_URL;  // ✅ Works
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;  // ✅ Works

const supabase = createClient(supabaseUrl, supabaseKey);
```

**Frontend (React browser):**
```javascript
// src/lib/supabaseClient.js
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;  // ✅ Works
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;  // ✅ Works

const supabase = createClient(supabaseUrl, supabaseKey);
```

---

## Why Different Keys?

Notice the keys are also different:

| Backend | Frontend |
|---------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | `REACT_APP_SUPABASE_ANON_KEY` |
| ⚠️ **Full database access** (bypasses RLS) | ✅ **Limited access** (enforces RLS) |
| 🔒 **Secret** (never expose to browser) | ✅ **Public** (safe to expose) |

### Security Model

```
Backend (server/api/*.js)
└── Uses SUPABASE_SERVICE_ROLE_KEY
    └── Full database access (bypasses Row Level Security)
    └── Can do anything (create, read, update, delete)
    └── Used for API endpoints that validate auth first

Frontend (browser/src/*.jsx)
└── Uses REACT_APP_SUPABASE_ANON_KEY
    └── Limited access (Row Level Security applies)
    └── Only for realtime subscriptions
    └── Safe to expose (public key)
```

---

## Your Architecture

### Backend Supabase Client
**File**: `server/supabase_client.js`

```javascript
// Uses backend variables (no REACT_APP_ prefix)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Creates admin client (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

**Used by**:
- `api/strategic_map_v2.js` - CRUD operations
- `api/organization.js` - Fetch org info
- `server/organization_helper.js` - Helper functions

### Frontend Supabase Client
**File**: `src/lib/supabaseClient.js`

```javascript
// Uses frontend variables (REACT_APP_ prefix)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Creates public client (RLS enforced)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

**Used by**:
- `src/tools/strategic-map/hooks/useRealtimeSync.js` - Realtime subscriptions
- Frontend components that need to listen to database changes

---

## Can We Consolidate?

### Option 1: Keep Both (Recommended ✅)

**Pros**:
- Clear separation of backend vs frontend
- Standard CRA pattern
- Prevents accidentally using service role key in frontend

**Cons**:
- Slight duplication (same URL twice)

### Option 2: Use Only `REACT_APP_SUPABASE_URL` Everywhere

You could theoretically do this:

```javascript
// Backend
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
```

**Pros**:
- One less variable

**Cons**:
- ❌ Confusing (why use REACT_APP_ in backend?)
- ❌ Non-standard pattern
- ❌ Backend depends on frontend variable naming

### Option 3: Use Only `SUPABASE_URL` and Alias in Frontend

```javascript
// src/lib/supabaseClient.js
const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
```

**Cons**:
- ❌ **Won't work!** CRA doesn't expose non-REACT_APP_ variables to browser
- The fallback `process.env.SUPABASE_URL` will always be `undefined` in browser

---

## Recommendation

**Keep both variables as-is.** ✅

This is the standard Create React App pattern and provides clear separation:

```bash
# Backend (Node.js server) - NEVER exposed to browser
SUPABASE_URL=https://rituzypqhjawhyrxoddj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...secret...

# Frontend (React browser) - Safe to expose
REACT_APP_SUPABASE_URL=https://rituzypqhjawhyrxoddj.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbG...public...
```

---

## Summary

| Question | Answer |
|----------|--------|
| Are they the same value? | ✅ Yes, both point to `https://rituzypqhjawhyrxoddj.supabase.co` |
| Can we use just one? | ❌ No, CRA requires `REACT_APP_` prefix for browser |
| Is this duplication necessary? | ✅ Yes, it's a security feature |
| Should we consolidate? | ❌ No, keep them separate for clarity |

**Bottom line**: The duplication is intentional and follows React security best practices. Keep both! 🔒
