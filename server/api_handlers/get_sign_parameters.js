const axios = require('axios');
const { handleCors, okResponse, failResponse } = require('../../api/_utils');
const { getLarkCredentials } = require('../../api/_supabase_helper');
const CryptoJS = require('crypto-js');

// Calculate sign parameters for JSAPI (with dynamic appId and noncestr)
function calculateSignParam(ticketString, url, appId, noncestr) {
    const timestamp = (new Date()).getTime();
    const verifyStr = `jsapi_ticket=${ticketString}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`;
    let signature = CryptoJS.SHA1(verifyStr).toString(CryptoJS.enc.Hex);
    const signParam = {
        "app_id": appId,
        "signature": signature,
        "noncestr": noncestr,
        "timestamp": timestamp,
    };
    return signParam;
}

// In-memory storage for jsapi_ticket (keyed by organization)
let jsapiTicketCache = new Map();

function getJsapiTicket(orgSlug) {
    if (!orgSlug) return null;
    const cache = jsapiTicketCache.get(orgSlug);
    if (cache && cache.expires > Date.now()) {
        return cache.ticket;
    }
    return null;
}

function setJsapiTicket(orgSlug, ticket) {
    if (!orgSlug) return;
    jsapiTicketCache.set(orgSlug, {
        ticket: ticket,
        expires: Date.now() + (2 * 60 * 60 * 1000) // 2 hours
    });
}

module.exports = async function handler(req, res) {
    // Handle CORS
    if (handleCors(req, res)) return;

    console.log("\n-------------------[接入方服务端鉴权处理 BEGIN]-----------------------------");
    console.log(`接入服务方第① 步: 接收到前端鉴权请求`);

    // Get organization slug from query
    const organizationSlug = req.query.organization_slug || "";
    
    // Get Lark credentials for this organization
    let larkCredentials = null;
    if (organizationSlug) {
        console.log(`🔍 Multi-tenant mode: Using organization slug: ${organizationSlug}`);
        larkCredentials = await getLarkCredentials(organizationSlug);
        if (!larkCredentials) {
            res.status(404).json(failResponse(`Organization '${organizationSlug}' not found or Lark credentials not configured`));
            return;
        }
    } else {
        console.log(`⚠️  No organization_slug provided, falling back to default config`);
        // Fallback to default config for backward compatibility
        const { config } = require('../../api/_utils');
        larkCredentials = {
            lark_app_id: config.appId,
            lark_app_secret: config.appSecret,
            noncestr: config.noncestr
        };
    }

    const url = req.query.url || "";
    const cachedTicket = getJsapiTicket(organizationSlug || 'default');
    
    if (cachedTicket) {
        console.log(`接入服务方第② 步: 缓存中获取jsapi_ticket，计算JSAPI鉴权参数，返回`);
        const signParam = calculateSignParam(cachedTicket, url, larkCredentials.lark_app_id, larkCredentials.noncestr);
        res.status(200).json(okResponse(signParam));
        console.log("-------------------[接入方服务端鉴权处理 END]-----------------------------\n");
        return;
    }

    try {
        console.log(`接入服务方第② 步: 未检测到jsapi_ticket，根据AppID和App Secret请求自建应用授权凭证tenant_access_token`);
        
        // Request tenant_access_token
        const internalRes = await axios.post("https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal", {
            "app_id": larkCredentials.lark_app_id,
            "app_secret": larkCredentials.lark_app_secret
        }, { headers: { "Content-Type": "application/json" } });

        if (!internalRes.data) {
            res.status(500).json(failResponse('tenant_access_token request error'));
            return;
        }
        if (internalRes.data.code != 0) {
            res.status(500).json(failResponse(`tenant_access_token request error: ${internalRes.data.msg}`));
            return;
        }

        console.log(`接入服务方第③ 步: 获得颁发的自建应用授权凭证tenant_access_token`);
        const tenant_access_token = internalRes.data.tenant_access_token || "";

        console.log(`接入服务方第④ 步: 请求JSAPI临时授权凭证`);
        
        // Request jsapi_ticket
        const ticketRes = await axios.post("https://open.larksuite.com/open-apis/jssdk/ticket/get", {}, {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": "Bearer " + tenant_access_token
            }
        });

        if (!ticketRes.data) {
            res.status(500).json(failResponse('get jssdk ticket request error'));
            return;
        }
        if (ticketRes.data.code != 0) {
            res.status(500).json(failResponse(`get jssdk ticket request error: ${ticketRes.data.msg}`));
            return;
        }

        console.log(`接入服务方第⑤ 步: 获得颁发的JSAPI临时授权凭证，更新到缓存`);
        const newTicketString = ticketRes.data.data.ticket || "";
        if (newTicketString.length > 0) {
            setJsapiTicket(organizationSlug || 'default', newTicketString);
        }

        console.log(`接入服务方第⑥ 步: 计算出JSAPI鉴权参数，并返回给前端`);
        const signParam = calculateSignParam(newTicketString, url, larkCredentials.lark_app_id, larkCredentials.noncestr);
        res.status(200).json(okResponse(signParam));
        console.log("-------------------[接入方服务端鉴权处理 END]-----------------------------\n");

    } catch (error) {
        console.error("获取签名参数时发生错误:", error);
        res.status(500).json(failResponse("服务器内部错误"));
    }
}