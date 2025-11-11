# OAuth Local Development Setup

## Overview

The application now supports **two authentication methods**:

1. **JSAPI Flow** (Production) - Used when running inside Lark/Feishu
2. **OAuth Redirect Flow** (Local Development) - Used when JSAPI is not available

The application automatically detects which method to use based on whether `window.h5sdk` is available.

## How It Works

### Production (Inside Lark)
- When `window.h5sdk` is available → Uses JSAPI authentication
- No changes to existing production behavior
- Works exactly as before

### Local Development
- When `window.h5sdk` is NOT available → Uses OAuth redirect flow
- User is redirected to Lark's authorization page
- After authorization, Lark redirects back with an authorization code
- Application exchanges code for access token

## Setup Instructions

### 1. Configure Redirect URI in Lark Developer Console

You need to add your local development URL as a redirect URI in your Lark app configuration:

1. Go to [Lark Developer Console](https://open.feishu.cn/)
2. Select your app
3. Navigate to **Credentials & Basic Info** → **Redirect URI**
4. Add the following redirect URIs:
   - `http://localhost:3000/` (for local development)
   - `http://localhost:3000` (without trailing slash)
   - Your production URL (e.g., `https://your-app.vercel.app/`)

**Important**: The redirect URI must **exactly match** the URL where your app is running, including:
- Protocol (`http://` or `https://`)
- Domain (`localhost:3000` or your production domain)
- Port (if using non-standard port)
- Path (usually `/`)

### 2. Local Development Workflow

1. Start your local development server:
   ```bash
   npm run start
   ```

2. Open your browser to `http://localhost:3000`

3. The application will detect that JSAPI is not available and automatically redirect to Lark's OAuth page

4. After authorizing, you'll be redirected back to `http://localhost:3000` with an authorization code

5. The application will automatically exchange the code for an access token

### 3. Testing

- **Local Development**: Run `npm run start` and open `http://localhost:3000`
- **Production**: Deploy to Vercel - JSAPI flow will be used automatically when inside Lark

## Technical Details

### Authentication Flow Detection

The application checks for JSAPI availability:
```javascript
const isJSAPIAvailable = typeof window.h5sdk !== 'undefined';
```

### OAuth Redirect Flow

1. **Authorization Request**: Redirects to:
   ```
   https://open.feishu.cn/open-apis/authen/v1/authorize
   ?app_id={app_id}
   &redirect_uri={redirect_uri}
   &scope={scopes}
   &state={state}
   ```

2. **Callback Handling**: Checks URL for `code` parameter:
   ```javascript
   const urlParams = new URLSearchParams(window.location.search);
   const code = urlParams.get('code');
   ```

3. **Token Exchange**: Backend exchanges code for access token via `/api/get_user_access_token`

### Scopes Used

The OAuth flow requests the following scopes:
- `contact:user.id:readonly`
- `contact:user:readonly`
- `contact:user.email:readonly`
- `contact:department:readonly`

## Troubleshooting

### Redirect URI Mismatch Error

**Error**: "redirect_uri_mismatch"

**Solution**: Ensure the redirect URI in Lark Developer Console exactly matches your application URL (including protocol, port, and path).

### OAuth Callback Not Working

**Symptoms**: After authorizing, you're redirected but authentication fails

**Solution**: 
1. Check browser console for errors
2. Verify redirect URI is configured correctly in Lark Developer Console
3. Ensure your backend API (`/api/get_user_access_token`) is accessible

### Still Using Mock User in Local Dev

**Symptoms**: See "Development User" instead of real authentication

**Solution**: The old mock user fallback has been removed. If you see this, ensure:
1. Redirect URI is configured in Lark Developer Console
2. You're accessing the app via the configured redirect URI
3. OAuth flow is completing successfully

## Impact on Production

✅ **Zero Impact** - Production behavior remains unchanged:
- When running inside Lark, JSAPI is available
- Application uses JSAPI flow (existing behavior)
- No OAuth redirect occurs in production
- All existing functionality continues to work

## Files Modified

1. `src/utils/auth_access_util.js`
   - Added `redirectToOAuth()` function
   - Added `handleOAuthCallback()` function
   - Updated `handleUserAuth()` to support OAuth fallback

2. `src/pages/home/index.js`
   - Updated `initializeAuth()` to handle OAuth flow
   - Added environment detection logic

## Next Steps

1. Configure redirect URIs in Lark Developer Console
2. Test locally using `npm run start`
3. Verify production still works correctly (should use JSAPI)

