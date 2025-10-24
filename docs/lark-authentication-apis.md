# Lark Authentication & Authorization APIs

This document covers the Authentication and Authorization APIs for managing access tokens, user authentication, and app permissions in Lark.

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [Access Token APIs](#access-token-apis)
4. [User Authentication APIs](#user-authentication-apis)
5. [OAuth 2.0 Flow](#oauth-20-flow)
6. [App Authentication](#app-authentication)
7. [Token Management](#token-management)
8. [Required Scopes](#required-scopes)
9. [Implementation Examples](#implementation-examples)

## Overview

Lark uses OAuth 2.0 for authentication and authorization. There are two main types of access tokens:

1. **Tenant Access Token** - For app-level operations (server-to-server)
2. **User Access Token** - For user-specific operations (requires user consent)

**Base URL**: `https://open.feishu.cn/open-apis/auth/v3`

## Authentication Flow

### 1. App Registration
Before using any APIs, you need to:
1. Create an app in Lark Developer Console
2. Get your `app_id` and `app_secret`
3. Configure redirect URLs for OAuth flow
4. Request necessary scopes/permissions

### 2. Token Types

| Token Type | Use Case | Validity | Refresh |
|------------|----------|----------|---------|
| Tenant Access Token | App-level operations | 2 hours | Auto-refresh |
| User Access Token | User-specific operations | 2 hours | Refresh token |
| App Access Token | Basic app information | 2 hours | Auto-refresh |

## Access Token APIs

### Get Tenant Access Token

Used for app-level operations that don't require user context.

```http
POST /auth/v3/tenant_access_token/internal
Content-Type: application/json

{
  "app_id": "cli_a10fbf7e94b8d013",
  "app_secret": "2xhUk6k4TlnIGNrGNcVMcgOeZjJeNznE"
}
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "tenant_access_token": "t-g1044ghEGNOJ2XKQFUQE4NNQIQ6GQJJQQ",
  "expire": 7140
}
```

### Get App Access Token

Used for basic app information and some public APIs.

```http
POST /auth/v3/app_access_token/internal
Content-Type: application/json

{
  "app_id": "cli_a10fbf7e94b8d013",
  "app_secret": "2xhUk6k4TlnIGNrGNcVMcgOeZjJeNznE"
}
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "app_access_token": "a-g1044ghEGNOJ2XKQFUQE4NNQIQ6GQJJQQ",
  "expire": 7140
}
```

## User Authentication APIs

### Authorization URL

Redirect users to this URL to start the OAuth flow:

```
https://open.feishu.cn/open-apis/authen/v1/authorize?app_id={app_id}&redirect_uri={redirect_uri}&scope={scope}&state={state}
```

**Parameters:**
- `app_id`: Your app ID
- `redirect_uri`: URL-encoded redirect URI
- `scope`: Space-separated list of scopes
- `state`: Random string for CSRF protection

### Exchange Code for User Access Token

After user authorization, exchange the code for access token:

```http
POST /auth/v3/access_token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "xMSldislSkdK",
  "app_id": "cli_a10fbf7e94b8d013",
  "app_secret": "2xhUk6k4TlnIGNrGNcVMcgOeZjJeNznE"
}
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "access_token": "u-g1044ghEGNOJ2XKQFUQE4NNQIQ6GQJJQQ",
    "token_type": "Bearer",
    "expires_in": 7140,
    "refresh_token": "ur-g1044ghEGNOJ2XKQFUQE4NNQIQ6GQJJQQ",
    "refresh_expires_in": 2591940,
    "scope": "contact:user.id:readonly"
  }
}
```

### Refresh User Access Token

Refresh an expired user access token:

```http
POST /auth/v3/refresh_access_token
Content-Type: application/json

{
  "grant_type": "refresh_token",
  "refresh_token": "ur-g1044ghEGNOJ2XKQFUQE4NNQIQ6GQJJQQ",
  "app_id": "cli_a10fbf7e94b8d013",
  "app_secret": "2xhUk6k4TlnIGNrGNcVMcgOeZjJeNznE"
}
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "access_token": "u-g1044ghEGNOJ2XKQFUQE4NNQIQ6GQJJQQ",
    "token_type": "Bearer",
    "expires_in": 7140,
    "refresh_token": "ur-g1044ghEGNOJ2XKQFUQE4NNQIQ6GQJJQQ",
    "refresh_expires_in": 2591940,
    "scope": "contact:user.id:readonly"
  }
}
```

## OAuth 2.0 Flow

### Complete OAuth Flow Implementation

```javascript
// Step 1: Redirect to authorization URL
function redirectToAuth(appId, redirectUri, scopes, state) {
  const authUrl = new URL('https://open.feishu.cn/open-apis/authen/v1/authorize');
  authUrl.searchParams.set('app_id', appId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('state', state);
  
  window.location.href = authUrl.toString();
}

// Step 2: Handle callback and exchange code
async function handleAuthCallback(code, appId, appSecret) {
  try {
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        app_id: appId,
        app_secret: appSecret
      })
    });
    
    const data = await response.json();
    
    if (data.code === 0) {
      // Store tokens securely
      localStorage.setItem('access_token', data.data.access_token);
      localStorage.setItem('refresh_token', data.data.refresh_token);
      localStorage.setItem('token_expires_at', Date.now() + (data.data.expires_in * 1000));
      
      return data.data;
    } else {
      throw new Error(`Authentication failed: ${data.msg}`);
    }
  } catch (error) {
    console.error('Auth callback error:', error);
    throw error;
  }
}
```

## App Authentication

### Get User Information

After obtaining user access token, get user details:

```http
GET /authen/v1/user_info
Authorization: Bearer <user_access_token>
Content-Type: application/json
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "name": "John Doe",
    "en_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "avatar_thumb": "https://example.com/avatar_thumb.jpg",
    "avatar_middle": "https://example.com/avatar_middle.jpg",
    "avatar_big": "https://example.com/avatar_big.jpg",
    "open_id": "ou_84aad35d084aa403a838cf73ee18467",
    "union_id": "on_8ed6aa67826108097d9ee143816345",
    "user_id": "5d9bdxxx",
    "email": "john.doe@company.com",
    "enterprise_email": "john.doe@company.com",
    "user_id_type": "user_id",
    "mobile": "+1234567890",
    "tenant_key": "tenant_key_example"
  }
}
```

### Verify Access Token

Verify if an access token is valid:

```http
POST /auth/v3/token/verify
Content-Type: application/json

{
  "token": "u-g1044ghEGNOJ2XKQFUQE4NNQIQ6GQJJQQ"
}
```

**Response Example:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "is_valid": true,
    "expire": 3600,
    "scope": "contact:user.id:readonly im:message",
    "app_id": "cli_a10fbf7e94b8d013",
    "tenant_key": "tenant_key_example",
    "user_id": "ou_84aad35d084aa403a838cf73ee18467"
  }
}
```

## Token Management

### Token Storage Best Practices

```javascript
class TokenManager {
  constructor(appId, appSecret) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.tenantToken = null;
    this.tenantTokenExpiry = null;
  }
  
  // Get tenant access token with auto-refresh
  async getTenantAccessToken() {
    if (this.tenantToken && this.tenantTokenExpiry > Date.now()) {
      return this.tenantToken;
    }
    
    try {
      const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app_id: this.appId,
          app_secret: this.appSecret
        })
      });
      
      const data = await response.json();
      
      if (data.code === 0) {
        this.tenantToken = data.tenant_access_token;
        this.tenantTokenExpiry = Date.now() + (data.expire * 1000) - 60000; // 1 minute buffer
        return this.tenantToken;
      } else {
        throw new Error(`Failed to get tenant token: ${data.msg}`);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }
  
  // Get user access token with auto-refresh
  async getUserAccessToken() {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const expiresAt = parseInt(localStorage.getItem('token_expires_at') || '0');
    
    if (accessToken && expiresAt > Date.now()) {
      return accessToken;
    }
    
    if (refreshToken) {
      return await this.refreshUserAccessToken(refreshToken);
    }
    
    throw new Error('No valid user access token available');
  }
  
  async refreshUserAccessToken(refreshToken) {
    try {
      const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/refresh_access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          app_id: this.appId,
          app_secret: this.appSecret
        })
      });
      
      const data = await response.json();
      
      if (data.code === 0) {
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        localStorage.setItem('token_expires_at', Date.now() + (data.data.expires_in * 1000));
        
        return data.data.access_token;
      } else {
        // Refresh failed, clear tokens and require re-authentication
        this.clearUserTokens();
        throw new Error(`Token refresh failed: ${data.msg}`);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearUserTokens();
      throw error;
    }
  }
  
  clearUserTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
  }
}
```

## Required Scopes

### Common Scopes

| Scope | Description |
|-------|-------------|
| `contact:user.id:readonly` | Read user basic information |
| `contact:user:readonly` | Read user detailed information |
| `contact:user.email:readonly` | Read user email |
| `contact:user.phone:readonly` | Read user phone number |
| `contact:department:readonly` | Read department information |
| `im:message` | Send and receive messages |
| `im:chat` | Manage chats |
| `calendar:calendar:readonly` | Read calendar information |
| `docs:doc:readonly` | Read documents |
| `sheets:spreadsheet:readonly` | Read spreadsheets |

### Scope Request Example

```javascript
const requiredScopes = [
  'contact:user.id:readonly',
  'contact:user:readonly',
  'im:message',
  'im:chat'
];

redirectToAuth(appId, redirectUri, requiredScopes, state);
```

## Implementation Examples

### Example: Complete Authentication Setup (Current Project)

```javascript
// client_config.js
const clientConfig = {
  appId: 'cli_a10fbf7e94b8d013',
  apiOrigin: '',
  apiPort: 8989,
  getUserAccessTokenPath: '/api/get_user_access_token',
  getSignParametersPath: '/api/get_sign_parameters',
  getOrganizationMembersPath: '/api/get_organization_members'
};

// auth_access_util.js
export function configJSAPIAccess() {
  return new Promise((resolve, reject) => {
    if (typeof tt === 'undefined') {
      reject(new Error('Lark JSAPI not available'));
      return;
    }
    
    // Get sign parameters from backend
    fetch(`http://localhost:${clientConfig.apiPort}${clientConfig.getSignParametersPath}`)
      .then(response => response.json())
      .then(data => {
        if (data.code === 0) {
          tt.config({
            appId: clientConfig.appId,
            timestamp: data.timestamp,
            nonceStr: data.noncestr,
            signature: data.signature,
            jsApiList: ['getUserAccessToken'],
            debug: false
          });
          
          tt.ready(() => {
            resolve();
          });
          
          tt.error((err) => {
            reject(new Error(`JSAPI config failed: ${JSON.stringify(err)}`));
          });
        } else {
          reject(new Error(`Failed to get sign parameters: ${data.msg}`));
        }
      })
      .catch(error => {
        reject(error);
      });
  });
}

export function getUserAccessToken() {
  return new Promise((resolve, reject) => {
    if (typeof tt === 'undefined') {
      reject(new Error('Lark JSAPI not available'));
      return;
    }
    
    tt.getUserAccessToken({
      success: (res) => {
        resolve(res.accessToken);
      },
      fail: (err) => {
        reject(new Error(`Failed to get user access token: ${JSON.stringify(err)}`));
      }
    });
  });
}
```

### Example: Backend Token Management

```javascript
// server.js
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const config = require('./server_config').config;

const app = express();

// Token cache
let tenantAccessToken = null;
let tokenExpiry = null;

async function getTenantAccessToken() {
  if (tenantAccessToken && tokenExpiry > Date.now()) {
    return tenantAccessToken;
  }
  
  try {
    const response = await axios.post(
      'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
      {
        app_id: config.appId,
        app_secret: config.appSecret
      }
    );
    
    if (response.data.code === 0) {
      tenantAccessToken = response.data.tenant_access_token;
      tokenExpiry = Date.now() + (response.data.expire * 1000) - 60000; // 1 minute buffer
      return tenantAccessToken;
    } else {
      throw new Error(`Failed to get tenant token: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
}

// Generate signature for JSAPI
app.get('/api/get_sign_parameters', async (req, res) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const noncestr = config.noncestr;
    const url = req.headers.referer || req.headers.origin;
    
    const stringToSign = `timestamp=${timestamp}&noncestr=${noncestr}&url=${url}`;
    const signature = crypto
      .createHmac('sha256', config.appSecret)
      .update(stringToSign)
      .digest('hex');
    
    res.json({
      code: 0,
      timestamp: timestamp,
      noncestr: noncestr,
      signature: signature
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      msg: 'Failed to generate signature',
      error: error.message
    });
  }
});
```

## Best Practices

1. **Token Security**: Never expose app secrets in client-side code
2. **Token Refresh**: Implement automatic token refresh with buffer time
3. **Error Handling**: Handle token expiration and refresh failures gracefully
4. **Scope Management**: Request only necessary scopes
5. **State Parameter**: Use random state parameter for CSRF protection
6. **Secure Storage**: Store tokens securely (HttpOnly cookies for web apps)
7. **Token Validation**: Validate tokens before making API calls

## Common Error Codes

- `99991661`: Invalid app_id or app_secret
- `99991662`: Invalid authorization code
- `99991663`: Authorization code expired
- `99991664`: Invalid refresh token
- `99991665`: Refresh token expired
- `99991666`: Invalid access token
- `99991667`: Access token expired
- `99991668`: Insufficient scope permissions