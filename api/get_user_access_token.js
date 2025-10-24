const axios = require('axios');
const { config, handleCors, okResponse, failResponse, setAuthCookie, getAuthFromCookie } = require('./_utils');

export default async function handler(req, res) {
    // Handle CORS
    if (handleCors(req, res)) return;

    console.log("\n-------------------[接入服务端免登处理 BEGIN]-----------------------------");
    console.log(`接入服务方第① 步: 接收到前端免登请求`);

    // Check if user is already authenticated
    const existingAuth = getAuthFromCookie(req);
    if (existingAuth && existingAuth.access_token) {
        console.log("接入服务方第② 步: 从Cookie中获取user_access_token信息，用户已登录");
        res.status(200).json(okResponse(existingAuth));
        console.log("-------------------[接入服务端免登处理 END]-----------------------------\n");
        return;
    }

    let code = req.query.code || "";
    console.log("接入服务方第② 步: 获取登录预授权码code");
    if (code.length == 0) {
        res.status(400).json(failResponse("登录预授权码code is empty, please retry!!!"));
        return;
    }

    try {
        // Request app_access_token
        console.log("接入服务方第③ 步: 根据AppID和App Secret请求应用授权凭证app_access_token");
        const internalRes = await axios.post("https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal", {
            "app_id": config.appId,
            "app_secret": config.appSecret
        }, { headers: { "Content-Type": "application/json" } });

        if (!internalRes.data) {
            res.status(500).json(failResponse("app_access_token request error"));
            return;
        }
        if (internalRes.data.code != 0) {
            res.status(500).json(failResponse(`app_access_token request error: ${internalRes.data.msg}`));
            return;
        }

        console.log("接入服务方第④ 步: 获得颁发的应用授权凭证app_access_token");
        const app_access_token = internalRes.data.app_access_token || "";

        console.log("接入服务方第⑤ 步: 根据登录预授权码code和app_access_token请求用户授权凭证user_access_token");
        // Request user_access_token
        const authenv1Res = await axios.post("https://open.larksuite.com/open-apis/authen/v1/access_token", {
            "grant_type": "authorization_code",
            "code": code
        }, {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": "Bearer " + app_access_token
            }
        });

        if (!authenv1Res.data) {
            res.status(500).json(failResponse("access_token request error"));
            return;
        }
        if (authenv1Res.data.code != 0) {
            res.status(500).json(failResponse(`access_token request error: ${authenv1Res.data.msg}`));
            return;
        }

        console.log("接入服务方第⑥ 步: 获取颁发的用户授权码凭证的user_access_token, 更新到Cookie，返回给前端");
        const newAccessToken = authenv1Res.data.data;
        
        if (newAccessToken) {
            // Set authentication cookie
            setAuthCookie(res, newAccessToken);
        }

        res.status(200).json(okResponse(newAccessToken));
        console.log("-------------------[接入服务端免登处理 END]-----------------------------\n");

    } catch (error) {
        console.error("获取用户访问令牌时发生错误:", error);
        res.status(500).json(failResponse("服务器内部错误"));
    }
}