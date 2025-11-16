# Authentication Issue in Production

## 🐛 Current Error

```
POST /api/strategic_map_v2
Status: 401 Unauthorized

{
  "code": -1,
  "msg": "Authentication required",
  "data": null
}
```

## 🔍 Root Cause

**You are NOT logged in on https://inside-cloud.vercel.app/**

The API requires authentication via:
1. `lk_token` cookie (Lark OAuth)
2. `auth_token` cookie (internal auth)

Since you're accessing the site directly without going through Lark authentication, there are no cookies, so the API rejects the request.

---

## 🎯 The Authentication Flow

### How It's Supposed to Work

```mermaid
graph LR
    A[User opens app in Lark] --> B[Lark provides auth code]
    B --> C[/api/get_user_access_token]
    C --> D[Get lk_token from Lark]
    D --> E[Set lk_token cookie]
    E --> F[User can create items]
```

### What's Happening Now

```
User visits https://inside-cloud.vercel.app directly
↓
No Lark context = No auth code
↓
No lk_token cookie
↓
API returns 401 Unauthorized ❌
```

---

## 🔐 Authentication Code Analysis

### Backend Requires Authentication

From `api/strategic_map_v2.js` line 159-164:

```javascript
// POST: Create item
const individualId = await getIndividualIdFromAuth(req);

if (!individualId) {
  return res.status(401).json(failResponse('Authentication required'));
}
```

### How It Gets `individualId`

From `api/strategic_map_v2.js` line 11-111:

```javascript
async function getIndividualIdFromAuth(req) {
  // Method 1: Check for auth_token cookie (your internal auth)
  const auth = getAuthFromCookie(req);
  if (auth && auth.user_id) {
    // Look up individual in database
    return individual.id;
  }

  // Method 2: Check for lk_token cookie (Lark auth)
  const lkToken = cookies.lk_token;

  if (!lkToken) {
    console.warn('⚠️ No lk_token found for authentication');
    return null;  // ← This is what's happening now!
  }

  // Call Lark API to validate token and get user info
  const userInfoRes = await axios.get("https://open.larksuite.com/open-apis/authen/v1/user_info", {
    headers: { "Authorization": `Bearer ${lkToken}` }
  });

  // Look up individual in database
  return individual.id;
}
```

**Current state**: Both methods fail because you have no cookies.

---

## 🤔 Why It Works Locally

### Local Development

When you run `npm start` locally:

1. You open http://localhost:3000
2. If in Lark: Lark provides auth, gets `lk_token`
3. If not in Lark: You might be using test data or have a cached token

### Production on Vercel

When you visit https://inside-cloud.vercel.app:

1. You're accessing it directly in a regular browser (not in Lark)
2. No Lark authentication happens
3. No cookies are set
4. API rejects all authenticated requests

---

## ✅ Solutions

### Option 1: Access Through Lark (Recommended for Production)

**The app is designed to run inside Lark!**

1. Open Lark (Feishu/飞书)
2. Find your app in Lark
3. Open the app (it will use the correct OAuth flow)
4. The app will get `lk_token` automatically
5. Everything will work ✅

**To configure this**:
- You need to set up Lark Mini Program or Web App
- Configure OAuth redirect URI in Lark Admin Console
- Point it to https://inside-cloud.vercel.app

### Option 2: Add Development Mode (Bypass Auth)

**For testing without Lark**, we can add a development mode that uses a hardcoded user ID.

Add this to `api/strategic_map_v2.js`:

```javascript
async function getIndividualIdFromAuth(req) {
  // DEVELOPMENT MODE: Allow bypass with test user
  if (process.env.NODE_ENV === 'development' || process.env.ALLOW_TEST_USER === 'true') {
    const testUserId = req.headers['x-test-user-id'];
    if (testUserId) {
      console.log('🧪 Using test user ID:', testUserId);
      return testUserId;
    }
  }

  // ... rest of existing auth code
}
```

Then set `ALLOW_TEST_USER=true` in Vercel environment variables.

### Option 3: Make Some Operations Public (Not Recommended)

Remove authentication requirement for GET requests only:

```javascript
// GET: Fetch items (no auth required)
if (method === 'GET') {
  const result = await controller.getItems(organization_slug, timeframe);
  return res.status(200).json(result);
}

// POST/PUT/DELETE still require auth
```

**Risks**: Anyone can read your data.

### Option 4: Implement Basic Auth for Testing

Add a simple password-based auth for development:

```javascript
// Quick auth for testing
if (req.headers['x-dev-password'] === process.env.DEV_PASSWORD) {
  // Use a default test user
  const testUser = 'c064315a-6a6f-4275-a8a5-622397e5c97a';
  return testUser;
}
```

---

## 🚀 Recommended Next Steps

### For Production Use

1. **Configure Lark OAuth properly**:
   - Go to Lark Open Platform
   - Set redirect URI: `https://inside-cloud.vercel.app/auth/callback` (or similar)
   - Get OAuth working so users can log in

2. **Test in Lark**:
   - Add the app to your Lark workspace
   - Open it from within Lark
   - Authentication should work automatically

### For Development/Testing

**Quick Fix**: Add development bypass mode

1. I can add code to allow a test user when `ALLOW_TEST_USER=true`
2. Set that variable in Vercel
3. You can test without Lark authentication

---

## ❓ Questions for You

1. **Is this app meant to run inside Lark?**
   - If YES: We need to configure Lark OAuth for Vercel domain
   - If NO: We need to add a different authentication method

2. **Do you have the app set up in Lark already?**
   - Can you access it from within Lark?
   - What's the app link in Lark?

3. **For testing, do you want me to add a development bypass?**
   - This would let you test without Lark login
   - Just for development/testing purposes

---

## 🎯 The Real Fix

**The app needs proper Lark OAuth setup for Vercel.**

Current configuration probably has:
- Redirect URI: `http://localhost:3000` or `https://your-ngrok-url.ngrok.io`

Needs to be:
- Redirect URI: `https://inside-cloud.vercel.app`

This is configured in:
- Lark Open Platform Console
- Your Lark app settings

**Without this, authentication will never work in production.** ⚠️

---

## 💡 Immediate Workaround

If you just want to test the UI and cascade functionality, I can:

1. Make GET requests public (read-only, no auth)
2. Make POST/PUT/DELETE require auth BUT use a hardcoded test user in development

Would you like me to implement this workaround?
