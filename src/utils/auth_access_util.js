import axios from 'axios';
import clientConfig from '../config/client_config.js';
import Cookies from 'js-cookie';
import { ORGANIZATION_SLUG_KEY } from '../components/organizationSelector/index.js';

const LJ_TOKEN_KEY = 'lk_token'
const ORGANIZATION_APP_ID_KEY = 'lark_organization_app_id' // Store org-specific app ID
const OAUTH_PROCESSING_KEY = 'oauth_processing' // Flag to prevent redirect loops

// Check if external browser OAuth is allowed
// Defaults to false (production behavior) - only allow JSAPI
// Set REACT_APP_ALLOW_EXTERNAL_BROWSER=true in .env for local development
const ALLOW_EXTERNAL_BROWSER = process.env.REACT_APP_ALLOW_EXTERNAL_BROWSER === 'true';

/// ---------------- JSAPI鉴权 部分 -------------------------

export async function handleJSAPIAccess(complete, organizationSlug = null) {

    console.log("\n----------[接入方网页JSAPI鉴权处理 BEGIN]----------")
    
    // Get organization slug from parameter or localStorage
    const orgSlug = organizationSlug || localStorage.getItem(ORGANIZATION_SLUG_KEY) || null;
    
    const url = encodeURIComponent(window.location.href.split("#")[0]);
    console.log("接入方前端[JSAPI鉴权处理]第① 步: 请求JSAPI鉴权参数")
    
    // Build query string with organization_slug if available
    let queryString = `url=${url}`;
    if (orgSlug) {
        queryString += `&organization_slug=${encodeURIComponent(orgSlug)}`;
        console.log(`🔍 Multi-tenant mode: Using organization slug: ${orgSlug}`);
    }
    
    // 向接入方服务端发起请求，获取鉴权参数（appId、timestamp、nonceStr、signature）
    const res = await axios.get(`${getOrigin(clientConfig.apiPort)}${clientConfig.getSignParametersPath}?${queryString}`,
        { withCredentials: true, headers: { 'ngrok-skip-browser-warning': 'true' } }
    )
    if (!res.data) {
        console.error(`${clientConfig.getSignParametersPath} fail`)
        complete(false)
        return
    }

    const data = res.data.data
    console.log("接入方前端[JSAPI鉴权处理]第② 步: 获得鉴权参数")
    if (!data) {
        console.error('获取参数失败')
        complete(false)
        return
    }
    
    // Store the app_id from backend response (it's org-specific)
    if (data.app_id) {
        localStorage.setItem(ORGANIZATION_APP_ID_KEY, data.app_id);
        console.log(`✅ Stored organization app_id: ${data.app_id}`);
    }
    
    console.log("接入方前端[JSAPI鉴权处理]第③ 步: 通过window.h5sdk.config进行鉴权")
    configJSAPIAccess(data, complete)
}

//config JSAPI鉴权
function configJSAPIAccess(data, complete) {
    //配置要使用的jsapi列表
    let jsApiList = [
        "tt.getSystemInfo",
        "tt.showActionSheet",
        "tt.previewImage",
        "tt.showToast",
    ]

    // 调用config接口进行鉴权
    window.h5sdk.config({
        appId: data.app_id,
        timestamp: data.timestamp,
        nonceStr: data.noncestr,
        signature: data.signature,
        jsApiList: jsApiList,
        //成功回调
        onSuccess: (res) => {
            console.log(`JSAPI Auth Success: ${JSON.stringify(res)}`);
            // Greeting toast is now shown after user auth with user's name
            complete(true)
            console.log("\n----------[接入方网页鉴权处理 END]----------")
        },
        //失败回调
        onFail: (err) => {
            window.tt.showToast({
                title: "鉴权失败",
                icon: "error",
                duration: 2000
            });
            complete(false)
            console.error(`鉴权失败原因: ${JSON.stringify(err)}`);
        },
    });
}

/// ---------------- 应用免登 部分 -------------------------
//处理用户免登逻辑
export async function handleUserAuth(complete, organizationSlug = null) {

    console.log("\n----------[接入方网页免登处理 BEGIN]----------")
    
    // Get organization slug from parameter or localStorage
    const orgSlug = organizationSlug || localStorage.getItem(ORGANIZATION_SLUG_KEY) || null;
    if (orgSlug) {
        console.log(`🔍 Multi-tenant mode: Using organization slug: ${orgSlug}`);
    }
    
    // Check for OAuth callback FIRST (before checking existing tokens)
    // This prevents redirect loops when OAuth callback returns
    try {
        const oauthCallback = handleOAuthCallback();
        if (oauthCallback && oauthCallback.code) {
            console.log("接入方前端[免登处理]第① 步: 检测到OAuth回调，使用授权码获取token")
            // Set flag to prevent redirect loop
            localStorage.setItem(OAUTH_PROCESSING_KEY, 'true');
            const callbackOrgSlug = oauthCallback.organizationSlug || orgSlug;
            requestUserAccessToken(oauthCallback.code, (userData) => {
                // Clear the processing flag after successful auth
                if (userData) {
                    localStorage.removeItem(OAUTH_PROCESSING_KEY);
                }
                complete(userData);
            }, callbackOrgSlug);
            return;
        }
    } catch (error) {
        console.error("❌ OAuth callback error:", error);
        localStorage.removeItem(OAUTH_PROCESSING_KEY);
        complete(null);
        return;
    }
    
    // Check if we're currently processing OAuth (prevent redirect loop)
    if (localStorage.getItem(OAUTH_PROCESSING_KEY) === 'true') {
        console.log("⏳ OAuth processing in progress, checking for token...");
        // Check if token is now available (might have been set by backend)
        const token = Cookies.get(LJ_TOKEN_KEY) || localStorage.getItem(LJ_TOKEN_KEY);
        if (token) {
            console.log("✅ Token found, completing authentication...");
            localStorage.removeItem(OAUTH_PROCESSING_KEY);
            requestUserAccessToken("", complete, orgSlug);
        } else {
            console.log("⏳ Token not yet available, waiting...");
            // Token not ready yet, return null to prevent redirect
            complete(null);
        }
        return;
    }
    
    // Check if user is already authenticated (has token in cookie or localStorage)
    let lj_tokenString = Cookies.get(LJ_TOKEN_KEY) || localStorage.getItem(LJ_TOKEN_KEY) || ""
    if (lj_tokenString.length > 0) {
        console.log("接入方前端[免登处理]第① 步: 用户已登录，请求后端验证...")
        // Use a wrapper to handle token invalidity and retry authentication
        requestUserAccessToken("", (userData) => {
            if (userData === null) {
                // Token was invalid, cleared - retry authentication without token
                console.log("🔄 Token已清除，重新开始认证流程...")
                // Recursively call handleUserAuth to start fresh authentication
                handleUserAuth(complete, orgSlug)
            } else {
                complete(userData)
            }
        }, orgSlug)
        return
    }
    
    // Check if JSAPI is available (production environment inside Lark)
    if (window.h5sdk && typeof window.h5sdk !== 'undefined') {
        console.log("接入方前端[免登处理]第① 步: 使用JSAPI模式 (生产环境)")
        console.log("接入方前端[免登处理]第① 步: 依据App ID调用JSAPI tt.requestAuthCode 请求免登授权码")
        //依据App ID调用JSAPI tt.requestAuthCode 请求登录预授权码code
        window.h5sdk.ready(() => {
            console.log("window.h5sdk.ready");
            
            // Get organization-specific app ID from localStorage, or fallback to default
            const orgAppId = localStorage.getItem(ORGANIZATION_APP_ID_KEY) || clientConfig.appId;
            console.log(`🔍 Using app_id for requestAuthCode: ${orgAppId}`);
            
            window.tt.requestAuthCode({
                appId: orgAppId,
                success: (info) => {
                    console.log(`✅ requestAuthCode success:`, info);
                    const code = info.code
                    if (code.length <= 0) {
                        console.error('auth code为空')
                        complete()
                    } else {
                        requestUserAccessToken(code, complete, orgSlug)
                    }
                },
                fail: (error) => {
                    console.error("❌ window.tt.requestAuthCode failed:", error);
                    complete()
                }
            });
        });
        return;
    }
    
    // JSAPI not available - check if external browser OAuth is allowed
    if (!ALLOW_EXTERNAL_BROWSER) {
        console.error("❌ JSAPI不可用，且不允许外部浏览器OAuth流程");
        console.error("⚠️  请在Lark环境中打开应用，或设置 REACT_APP_ALLOW_EXTERNAL_BROWSER=true 以启用外部浏览器OAuth");
        complete(null);
        return;
    }
    
    // Use OAuth redirect flow (local development with flag enabled)
    console.log("接入方前端[免登处理]第① 步: JSAPI不可用，使用OAuth重定向流程 (本地开发)")
    console.log("⚠️  Redirecting to Lark OAuth authorization page...")
    redirectToOAuth(orgSlug);
    // Note: redirectToOAuth will redirect the page, so complete() won't be called here
    // The OAuth callback will be handled on the next page load
}

function requestUserAccessToken(code, complete, organizationSlug = null) {

    // 获取user_access_token信息
    console.log("接入方前端[免登处理]第② 步: 去接入方服务端获取user_access_token信息")
    
    // Build query string with organization_slug if available
    let queryString = `code=${code}`;
    if (organizationSlug) {
        queryString += `&organization_slug=${encodeURIComponent(organizationSlug)}`;
    }
    
    // If no code provided, send token from localStorage to verify existing auth
    const headers = { 'ngrok-skip-browser-warning': 'true' };
    if (!code || code.length === 0) {
        const existingToken = localStorage.getItem(LJ_TOKEN_KEY);
        if (existingToken) {
            // Send token in Authorization header
            headers['Authorization'] = `Bearer ${existingToken}`;
            console.log("接入方前端[免登处理]第② 步: 发送现有token进行验证");
        }
    }
    
    axios.get(`${getOrigin(clientConfig.apiPort)}${clientConfig.getUserAccessTokenPath}?${queryString}`,
        { withCredentials: true, headers: headers }   //调用时设置 请求带上cookie
    ).then(function (response) {  // ignore_security_alert
        if (!response.data) {
            console.error(`${clientConfig.getUserAccessTokenPath} response is null`)
            complete(null)
            return
        }
        
        // Check if response indicates token invalidity (code -2) or token-related error when we sent a token
        const responseCode = response.data.code;
        const responseMsg = response.data.msg || '';
        const sentToken = !code || code.length === 0; // We sent a token if code was empty

        // Check for token invalidity - code -2 OR message contains token-related error
        const isTokenInvalid = responseCode === -2 ||
            (sentToken && responseCode !== 0 && (responseMsg.includes('Token verification failed') ||
                          responseMsg.includes('invalid access token') ||
                          responseMsg.includes('code is empty')));

        if (isTokenInvalid) {
            console.warn("⚠️ Token验证失败或无效，清除旧token并重新认证")
            console.warn("⚠️ Response code:", responseCode, "Message:", responseMsg);
            // Clear invalid token from localStorage and cookies
            localStorage.removeItem(LJ_TOKEN_KEY)
            Cookies.remove(LJ_TOKEN_KEY)
            // Return null to trigger re-authentication
            complete(null)
            console.log("----------[接入网页方免登处理 END]----------\n")
            return
        }
        
        const data = response.data.data
        if (data) {
            console.log("接入方前端[免登处理]第③ 步: 获取user_access_token信息")
            complete(data)
            localStorage.setItem(LJ_TOKEN_KEY, data.access_token)
            console.log("----------[接入网页方免登处理 END]----------\n")
        } else {
            console.error("接入方前端[免登处理]第③ 步: 未获取user_access_token信息")
            console.error("Response:", response.data);
            // If we sent a token but got an error, clear it and retry
            if (sentToken && responseCode === -1) {
                console.warn("⚠️ 检测到token验证失败，清除token并重试")
                localStorage.removeItem(LJ_TOKEN_KEY)
                Cookies.remove(LJ_TOKEN_KEY)
                complete(null)
            } else {
                complete(null)
            }
            console.log("----------[接入网页方免登处理 END]----------\n")
        }
    }).catch(function (error) {
        console.log(`${clientConfig.getUserAccessTokenPath} error:`, error)
        console.error("Error details:", error.response?.data || error.message);
        
        // Check if error response indicates token invalidity (code -2 or -1 with code is empty message)
        const errorCode = error.response?.data?.code;
        const errorMsg = error.response?.data?.msg || '';
        const sentToken = !code || code.length === 0; // We sent a token if code was empty
        
        // Check for token invalidity - code -2 OR message contains token-related error
        const isTokenInvalid = errorCode === -2 ||
            (sentToken && (errorMsg.includes('Token verification failed') ||
                          errorMsg.includes('invalid access token') ||
                          errorMsg.includes('code is empty')));

        if (isTokenInvalid) {
            console.warn("⚠️ Token验证失败，清除旧token并重新认证")
            console.warn("⚠️ Error code:", errorCode, "Message:", errorMsg);
            // Clear invalid token from localStorage and cookies
            localStorage.removeItem(LJ_TOKEN_KEY)
            Cookies.remove(LJ_TOKEN_KEY)
            // Return null to trigger re-authentication
            complete(null)
        } else {
            complete(null)
        }
        console.log("----------[接入网页方免登处理 END]----------\n")
    })
}

function getOrigin(apiPort) {
    const configuredOrigin = clientConfig.apiOrigin;
    if (configuredOrigin && configuredOrigin.length > 0) {
        return configuredOrigin;
    }
    // Default: use same-origin so CRA proxy can forward /api to localhost:8989
    return window.location.origin;
}

/// ---------------- OAuth 2.0 Redirect Flow (for local development) -------------------------

/**
 * Get redirect URI for OAuth flow
 * Uses current origin (localhost for local dev, production URL for production)
 */
function getRedirectUri() {
    const origin = window.location.origin;
    // Remove any existing query params or hash from the pathname
    const pathname = window.location.pathname.split('?')[0].split('#')[0];
    return `${origin}${pathname}`;
}

/**
 * Generate OAuth authorization URL and redirect user
 * This is used when JSAPI is not available (local development)
 */
export function redirectToOAuth(organizationSlug = null) {
    const orgSlug = organizationSlug || localStorage.getItem(ORGANIZATION_SLUG_KEY) || null;
    
    // Get app ID (organization-specific or default)
    const appId = localStorage.getItem(ORGANIZATION_APP_ID_KEY) || clientConfig.appId;
    
    // Get redirect URI
    const redirectUri = getRedirectUri();
    
    // Generate state for CSRF protection (store organization slug in state)
    const state = orgSlug ? `${Date.now()}_${orgSlug}` : Date.now().toString();
    localStorage.setItem('oauth_state', state);
    
    // Build OAuth authorization URL
    // Note: Not specifying 'scope' parameter lets Lark use the app's default scopes
    // which are configured in Lark Developer Console. This avoids scope mismatch errors.
    const authUrl = new URL('https://open.feishu.cn/open-apis/authen/v1/authorize');
    authUrl.searchParams.set('app_id', appId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    // Request calendar scope for reading events
    authUrl.searchParams.set('scope', 'calendar:calendar:readonly');
    authUrl.searchParams.set('state', state);
    
    console.log('🔐 Redirecting to Lark OAuth:', authUrl.toString());
    console.log(`📍 Redirect URI: ${redirectUri}`);
    console.log(`🔍 Organization slug: ${orgSlug || 'none'}`);
    
    // Redirect to Lark authorization page
    window.location.href = authUrl.toString();
}

/**
 * Handle OAuth callback - check if URL contains authorization code
 * Returns the code if present, null otherwise
 */
export function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    if (error) {
        console.error('❌ OAuth error:', error);
        const errorDescription = urlParams.get('error_description') || 'Unknown error';
        throw new Error(`OAuth authorization failed: ${errorDescription}`);
    }
    
    if (!code) {
        // No OAuth callback, return null
        return null;
    }
    
    // Verify state matches (CSRF protection)
    const storedState = localStorage.getItem('oauth_state');
    if (state !== storedState) {
        console.warn('⚠️ OAuth state mismatch - possible CSRF attack');
        // Still proceed but log warning
    }
    
    // Clean up state
    localStorage.removeItem('oauth_state');
    
    // Extract organization slug from state if present
    let orgSlug = null;
    if (state && state.includes('_')) {
        const parts = state.split('_');
        if (parts.length > 1) {
            orgSlug = parts.slice(1).join('_');
        }
    }
    
    // Clean URL by removing OAuth parameters
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    
    console.log('✅ OAuth callback received, code:', code.substring(0, 10) + '...');
    
    return { code, organizationSlug: orgSlug };
}


