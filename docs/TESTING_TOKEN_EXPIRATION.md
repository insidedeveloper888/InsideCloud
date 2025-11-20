# Testing Lark Token Expiration

## Overview

This guide explains how to simulate token expiration scenarios for testing the authentication retry logic.

## Method 1: Manual Cookie/LocalStorage Manipulation (Fastest)

### Step 1: Open Browser DevTools

1. Open your app at `http://localhost:3000`
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)

### Step 2: Corrupt the Token

**Option A: Delete the token**
```javascript
// In Console tab:
localStorage.removeItem('lk_token');
document.cookie = 'lk_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
```

**Option B: Set invalid token**
```javascript
// In Console tab:
localStorage.setItem('lk_token', 'invalid_token_xyz');
document.cookie = 'lk_token=invalid_token_xyz; path=/;';
```

### Step 3: Trigger Re-authentication

1. Refresh the page (F5)
2. Or click any product in dashboard
3. Watch the authentication flow retry

**Expected Behavior:**
```
接入方前端[免登处理]第① 步: 用户已登录，请求后端验证...
接入方前端[免登处理]第② 步: 发送现有token进行验证
❌ Token validation failed (expired/invalid)
🔄 Clearing invalid token and retrying authentication...
接入方前端[免登处理]第① 步: 重新获取authorization code...
✅ New token acquired
```

## Method 2: Backend Token Invalidation

### Force Lark API to Return Error

**Edit**: `server/server.js` - `getUserAccessToken` function

Add this code right after token retrieval to simulate expiration:

```javascript
// Around line 90-100, after getting lkToken
const lkToken = ctx.cookies.get(LJ_TOKEN_KEY) || '';

// 🧪 TESTING: Force token expiration (remove after testing)
if (process.env.FORCE_TOKEN_EXPIRATION === 'true') {
    console.log('🧪 TESTING: Forcing token expiration');
    ctx.cookies.set(LJ_TOKEN_KEY, '', { maxAge: 0 }); // Clear cookie
    ctx.session.userinfo = null; // Clear session
    ctx.body = serverUtil.failResponse('Token expired (simulated)');
    return;
}
```

Then start server with flag:
```bash
FORCE_TOKEN_EXPIRATION=true npm run start:server
```

## Method 3: Time Travel (Set Cookie Expiration)

### Manually Set Expired Cookie

```javascript
// In Browser Console:
const pastDate = new Date('2020-01-01').toUTCString();
document.cookie = `lk_token=old_token; expires=${pastDate}; path=/;`;
```

This sets a cookie that's already expired.

### Verify Expiration

```javascript
// Check cookie:
document.cookie.split(';').find(c => c.trim().startsWith('lk_token='))
// Should return undefined or empty
```

## Method 4: Mock Lark API Response

### Modify Auth Utility to Simulate Error

**Edit**: `src/utils/auth_access_util.js`

Find the `handleUserAuth` function and add:

```javascript
export function handleUserAuth(callback, organizationSlug) {
  // 🧪 TESTING: Simulate token expiration
  if (localStorage.getItem('SIMULATE_TOKEN_EXPIRATION') === 'true') {
    console.log('🧪 TESTING: Simulating token expiration error');
    localStorage.removeItem('SIMULATE_TOKEN_EXPIRATION'); // One-time trigger
    callback(null); // Return null to trigger retry
    return;
  }

  // ... rest of function
}
```

Enable simulation:
```javascript
// In Browser Console:
localStorage.setItem('SIMULATE_TOKEN_EXPIRATION', 'true');
// Then refresh page
```

## Method 5: Network Throttling (Simulate Slow Response)

### Chrome DevTools Network Tab

1. Open DevTools → Network tab
2. Click **Throttling** dropdown (default: "No throttling")
3. Select "Slow 3G" or "Fast 3G"
4. Refresh page

**Purpose**: Test timeout handling and loading states

## Method 6: Modify Token Lifetime in Lark Console

### For Production Testing

1. Go to [Lark Open Platform](https://open.feishu.cn)
2. Select your app
3. Go to **Credentials & Basics**
4. Set **Access Token Lifetime** to minimum (e.g., 5 minutes)
5. Wait for token to expire naturally

**Warning**: This affects ALL users of your app!

## Automated Test Script

Create this helper script:

**File**: `test/simulate-token-expiration.js`

```javascript
/**
 * Automated Token Expiration Simulation
 * Run in browser console to test auth retry logic
 */

function simulateTokenExpiration() {
  console.log('🧪 Simulating token expiration...');

  // Step 1: Corrupt current token
  const oldToken = localStorage.getItem('lk_token');
  console.log('📝 Old token:', oldToken?.substring(0, 20) + '...');

  localStorage.setItem('lk_token', 'EXPIRED_TOKEN_' + Date.now());
  document.cookie = 'lk_token=EXPIRED_TOKEN_' + Date.now() + '; path=/;';

  console.log('✅ Token corrupted');
  console.log('🔄 Triggering re-auth in 2 seconds...');

  // Step 2: Trigger re-authentication
  setTimeout(() => {
    console.log('🚀 Reloading page to trigger auth...');
    window.location.reload();
  }, 2000);
}

// Run it
simulateTokenExpiration();
```

**Usage:**
1. Copy/paste into browser console
2. Watch authentication retry automatically

## Verification Checklist

After simulating expiration, verify:

- [ ] App detects invalid/expired token
- [ ] Old token is cleared from localStorage and cookies
- [ ] New authentication flow starts automatically
- [ ] No infinite loops (should retry once, not forever)
- [ ] User sees loading animation during re-auth
- [ ] After success, user can access the app normally
- [ ] Check logs for "🔄 Clearing invalid token..." message

## Expected Log Sequence

### Successful Token Retry

```
接入方前端[免登处理]第① 步: 用户已登录，请求后端验证...
接入方前端[免登处理]第② 步: 发送现有token进行验证

-------------------[接入服务端免登处理 BEGIN]-----------------------------
接入服务方第① 步: 接收到前端免登请求
接入服务方第② 步: 从Session中获取user_access_token信息，用户已登录
🔍 Validating existing token with Lark API...
❌ Lark API error: code: -2 (token expired)
🔄 Token expired, clearing session and retrying...
-------------------[接入服务端免登处理 END]-----------------------------

接入方前端[免登处理]第③ 步: Token验证失败，清除并重新认证
🔄 Clearing invalid token and retrying authentication...

----------[接入方网页免登处理 BEGIN]----------
🔐 Using OAuth redirect flow (local development)
接入方前端[免登处理]第① 步: 重新获取authorization code...
接入方前端[免登处理]第② 步: 去接入方服务端获取user_access_token信息
✅ 获取user_access_token成功
接入方前端[免登处理]第③ 步: 获取user_access_token信息
----------[接入网页方免登处理 END]----------
```

### Failed Token Retry (Infinite Loop - Bad!)

```
接入方前端[免登处理] - Attempt 1
接入方前端[免登处理] - Attempt 2
接入方前端[免登处理] - Attempt 3
... (repeating forever) ❌
```

If you see this, there's a bug in the retry logic!

## Common Issues

### Issue 1: Token Not Actually Cleared

**Symptom**: Still seeing old token in requests

**Fix**: Check both localStorage AND cookies
```javascript
// Clear both:
localStorage.removeItem('lk_token');
document.cookie = 'lk_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
```

### Issue 2: Session Still Valid

**Symptom**: Backend returns cached user from session

**Fix**: Clear backend session too
```javascript
// In browser console:
fetch('http://localhost:8989/api/logout', { credentials: 'include' });
```

Or restart the backend server.

### Issue 3: Lark OAuth Redirect Loop

**Symptom**: Keeps redirecting to Lark authorization page

**Fix**: Clear all cookies and localStorage
```javascript
// Nuclear option:
localStorage.clear();
document.cookie.split(";").forEach((c) => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
location.reload();
```

## Production Monitoring

### Detect Token Expiration in Production

Add this to your logging:

```javascript
// In src/utils/auth_access_util.js

if (response.code === -2) {
  // Log to monitoring service
  console.error('⚠️ Token expired in production', {
    userId: response.userId,
    timestamp: new Date().toISOString(),
    lastAuth: localStorage.getItem('last_auth_timestamp')
  });

  // Optional: Send to analytics
  if (window.gtag) {
    window.gtag('event', 'token_expiration', {
      event_category: 'auth',
      event_label: 'lark_token_expired'
    });
  }
}
```

## Automated Testing

### Jest Test Example

```javascript
describe('Token Expiration Handling', () => {
  it('should retry authentication when token expires', async () => {
    // Mock expired token
    localStorage.setItem('lk_token', 'EXPIRED_TOKEN');

    // Mount component
    const { getByText } = render(<Home />);

    // Verify loading state
    expect(getByText(/Authenticating/i)).toBeInTheDocument();

    // Wait for retry
    await waitFor(() => {
      expect(mockAuthAPI).toHaveBeenCalledTimes(2); // Initial + retry
    });

    // Verify success
    await waitFor(() => {
      expect(getByText(/Dashboard/i)).toBeInTheDocument();
    });
  });
});
```

## Summary

**Fastest Method**: Browser console + cookie manipulation (Method 1)
**Most Realistic**: Network throttling + timeout (Method 5)
**Best for Automation**: Test script (Method 6)

Choose based on your testing needs!
