import axios from 'axios';
import clientConfig from '../config/client_config.js';
import Cookies from 'js-cookie';
import { ORGANIZATION_SLUG_KEY } from '../components/organizationSelector/index.js';

const LJ_TOKEN_KEY = 'lk_token'
const ORGANIZATION_APP_ID_KEY = 'lark_organization_app_id' // Store org-specific app ID

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
            console.log(`鉴权成功: ${JSON.stringify(res)}`);
            window.tt.showToast({
                title: "鉴权成功",
                icon: "success",
                duration: 2000
            });
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

    console.log("\n----------[接入方网页免登处理 BEGIN11111]----------")
    
    // Get organization slug from parameter or localStorage
    const orgSlug = organizationSlug || localStorage.getItem(ORGANIZATION_SLUG_KEY) || null;
    if (orgSlug) {
        console.log(`🔍 Multi-tenant mode: Using organization slug: ${orgSlug}`);
    }
    
    let lj_tokenString = Cookies.get(LJ_TOKEN_KEY) || ""
    if (lj_tokenString.length > 0) {
        console.log("接入方前端[免登处理]第① 步: 用户已登录，请求后端验证...")
        requestUserAccessToken("", complete, orgSlug)
    } else {
        if (!window.h5sdk) {
            console.log('invalid h5sdk')
            complete()
            return
        }
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
    }
}

function requestUserAccessToken(code, complete, organizationSlug = null) {

    // 获取user_access_token信息
    console.log("接入方前端[免登处理]第② 步: 去接入方服务端获取user_access_token信息")
    
    // Build query string with organization_slug if available
    let queryString = `code=${code}`;
    if (organizationSlug) {
        queryString += `&organization_slug=${encodeURIComponent(organizationSlug)}`;
    }
    
    axios.get(`${getOrigin(clientConfig.apiPort)}${clientConfig.getUserAccessTokenPath}?${queryString}`,
        { withCredentials: true, headers: { 'ngrok-skip-browser-warning': 'true' } }   //调用时设置 请求带上cookie
    ).then(function (response) {  // ignore_security_alert
        if (!response.data) {
            console.error(`${clientConfig.getUserAccessTokenPath} response is null`)
            complete()
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
            complete()
            console.log("----------[接入网页方免登处理 END]----------\n")
        }
    }).catch(function (error) {
        console.log(`${clientConfig.getUserAccessTokenPath} error:`, error)
        complete()
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



