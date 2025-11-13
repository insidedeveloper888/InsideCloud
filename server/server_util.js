//工具方法
function failResponse(msg, errorCode = -1) {
    return {
        "code": errorCode,
        "msg": msg || "error"
    }
}

function okResponse(data) {
    return {
        "code": 0,
        "msg": "ok",
        "data": data
    }
}

//处理跨域问题
//【特别说明】：该部分实现仅在线下用。【线上环境】需要对敏感信息接口服务端返回的跨域头部进行严格限制，避免任何域都能跨域访问此接口。
function configAccessControl(ctx) {
    ctx.set("Access-Control-Allow-Origin", ctx.headers.origin)
    ctx.set("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE");
    ctx.set("Access-Control-Allow-Credentials", "true");  //表示是否允许发送Cookie
    ctx.set("Access-Control-Allow-Headers", "x-requested-with, accept, origin, content-type, authorization, Authorization");
}

//设置Cookie
function setCookie(ctx, name, value) {
    if (!name || !value) {
        return
    }

    ctx.cookies.set(
        name,
        value,
        {
            domain: '',  // 写cookie所在的域名
            path: '',       // 写cookie所在的路径
            maxAge: 2 * 60 * 1000, // cookie有效时长
            // expires: new Date(''),  // cookie失效时间
            httpOnly: false,  // 是否只用于http请求中获取
            overwrite: false  // 是否允许重写
        }
    )
}

module.exports = { failResponse, okResponse, configAccessControl, setCookie }