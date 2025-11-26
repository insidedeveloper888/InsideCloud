# OAuth Local Development Setup

## Overview

The application now supports **two authentication methods**:

1. **JSAPI Flow** (Production) - Used when running inside Lark/Feishu
2. **OAuth Redirect Flow** (Local Development) - Used when JSAPI is not available **and** external browser OAuth is enabled

The application automatically detects which method to use based on:
- Whether `window.h5sdk` is available (JSAPI)
- The `REACT_APP_ALLOW_EXTERNAL_BROWSER` environment variable (OAuth redirect)

## Environment Variable: `REACT_APP_ALLOW_EXTERNAL_BROWSER`

This flag controls whether OAuth redirect flow is allowed when JSAPI is not available.

- **Default**: `false` (production behavior - only JSAPI allowed)
- **Local Development**: Set to `true` in `.env` file
- **Production**: Set to `false` in Vercel environment variables (or omit, defaults to false)

### Configuration

**Local Development (.env file):**
```env
REACT_APP_ALLOW_EXTERNAL_BROWSER=true
```

**Production (Vercel Environment Variables):**
```
REACT_APP_ALLOW_EXTERNAL_BROWSER=false
```

**Important**: 
- React environment variables must be prefixed with `REACT_APP_` to be accessible in the browser
- Changes to `.env` require restarting the development server
- Environment variables are embedded at build time in production

## How It Works

### Production (Inside Lark)
- When `window.h5sdk` is available → Uses JSAPI authentication
- No changes to existing production behavior
- Works exactly as before

### Local Development
- When `window.h5sdk` is NOT available **AND** `REACT_APP_ALLOW_EXTERNAL_BROWSER=true` → Uses OAuth redirect flow
- User is redirected to Lark's authorization page
- After authorization, Lark redirects back with an authorization code
- Application exchanges code for access token
- **If flag is false**: Shows error message "This application must be opened within Lark"

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

### 2. Configure Environment Variable

**Create or update `.env` file in project root:**
```env
REACT_APP_ALLOW_EXTERNAL_BROWSER=true
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important**: 
- Restart your development server after adding/updating `.env` file
- The `.env` file is gitignored and won't be committed

### 3. Local Development Workflow

1. Ensure `.env` file has `REACT_APP_ALLOW_EXTERNAL_BROWSER=true`

2. Start your local development server:
   ```bash
   npm run start
   ```

3. Open your browser to `http://localhost:3000`

4. The application will detect that JSAPI is not available and automatically redirect to Lark's OAuth page

5. After authorizing, you'll be redirected back to `http://localhost:3000` with an authorization code

6. The application will automatically exchange the code for an access token

### 4. Testing

- **Local Development**: 
  - Set `REACT_APP_ALLOW_EXTERNAL_BROWSER=true` in `.env`
  - Run `npm run start` and open `http://localhost:3000`
- **Production**: 
  - Set `REACT_APP_ALLOW_EXTERNAL_BROWSER=false` in Vercel environment variables (or omit)
  - JSAPI flow will be used automatically when inside Lark
  - External browser access will show error message

## Technical Details

### Authentication Flow Detection

The application checks for JSAPI availability and external browser flag:
```javascript
const isJSAPIAvailable = typeof window.h5sdk !== 'undefined';
const allowExternalBrowser = process.env.REACT_APP_ALLOW_EXTERNAL_BROWSER === 'true';

// Flow selection:
// 1. If JSAPI available → Use JSAPI (production)
// 2. If JSAPI not available AND allowExternalBrowser=true → Use OAuth redirect (local dev)
// 3. If JSAPI not available AND allowExternalBrowser=false → Show error (production safety)
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
- When running inside Lark, JSAPI is available → Uses JSAPI flow (existing behavior)
- When `REACT_APP_ALLOW_EXTERNAL_BROWSER=false` (default) → External browser access shows error
- No OAuth redirect occurs in production unless explicitly enabled
- All existing functionality continues to work

**Security Note**: By default (`REACT_APP_ALLOW_EXTERNAL_BROWSER=false`), the application will only work inside Lark, preventing unauthorized external access.

## Files Modified

1. `src/utils/auth_access_util.js`
   - Added `redirectToOAuth()` function
   - Added `handleOAuthCallback()` function
   - Updated `handleUserAuth()` to support OAuth fallback

2. `src/pages/home/index.js`
   - Updated `initializeAuth()` to handle OAuth flow
   - Added environment detection logic

## Next Steps

1. **Local Development**:
   - Add `REACT_APP_ALLOW_EXTERNAL_BROWSER=true` to `.env` file
   - Configure redirect URIs in Lark Developer Console
   - Test locally using `npm run start`

2. **Production (Vercel)**:
   - Set `REACT_APP_ALLOW_EXTERNAL_BROWSER=false` in Vercel environment variables (or omit)
   - Verify production still works correctly (should use JSAPI only)
   - External browser access will show error message (security feature)

