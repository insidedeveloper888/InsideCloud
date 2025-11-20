// Load environment variables from .env file
require('dotenv').config();

const Koa = require('koa')
const Router = require('koa-router')
const axios = require('axios')
const CryptoJS = require('crypto-js')
const session = require('koa-session');
const bodyParser = require('koa-bodyparser');
const serverConfig = require('./server_config')
const serverUtil = require('./server_util')
const { getLarkCredentials, validateOrganization, getOrganizationInfo } = require('./organization_helper')
const { supabase } = require('./supabase_client')
const { syncLarkUser } = require('../lib/larkUserSync')
const { requireProductAccess } = require('./middleware/product_access')
const { getOrganizationProducts, getAllProducts, getDashboardProducts } = require('./product_helper')

const LJ_JSTICKET_KEY = 'lk_jsticket'
const LJ_TOKEN_KEY = 'lk_token'

const slugify = (value) =>
    (value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .substring(0, 60)

//处理免登请求，返回用户的user_access_token
async function getUserAccessToken(ctx) {

    console.log("\n-------------------[接入服务端免登处理 BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)
    
    // Handle OPTIONS preflight request
    if (ctx.method === 'OPTIONS') {
        ctx.status = 200
        return
    }
    
    console.log(`接入服务方第① 步: 接收到前端免登请求`)
    
    // Get organization_id from query or session
    const organizationSlug = ctx.query["organization_slug"] || ctx.session.organization_slug || ""
    
    // Get Lark credentials for this organization
    let larkCredentials = null
    if (organizationSlug) {
        console.log(`🔍 Multi-tenant mode: Using organization slug: ${organizationSlug}`)
        larkCredentials = await getLarkCredentials(organizationSlug)
        if (!larkCredentials) {
            ctx.body = serverUtil.failResponse(`Organization '${organizationSlug}' not found or Lark credentials not configured`)
            return
        }
        // Store organization_slug in session
        ctx.session.organization_slug = organizationSlug
        ctx.session.organization_id = larkCredentials.organization_id
    } else {
        console.log(`⚠️  No organization_slug provided, falling back to default config`)
        // Fallback to default config for backward compatibility
        larkCredentials = {
            lark_app_id: serverConfig.config.appId,
            lark_app_secret: serverConfig.config.appSecret
        }
    }
    
    const accessToken = ctx.session.userinfo
    const lkToken = ctx.cookies.get(LJ_TOKEN_KEY) || ''
    if (accessToken && accessToken.access_token && lkToken.length > 0 && accessToken.access_token == lkToken) {
        console.log("接入服务方第② 步: 从Session中获取user_access_token信息，用户已登录")

        try {
            console.log('ℹ️  Session auth found, ensuring Supabase sync for', accessToken.user_id)
            await syncLarkUser({
                supabaseClient: supabase,
                accessTokenData: accessToken,
                organizationId: ctx.session.organization_id || larkCredentials.organization_id || null
            })
        } catch (syncError) {
            console.error('❌  Failed to sync existing session user to Supabase:', syncError)
        }

        ctx.body = serverUtil.okResponse(accessToken)
        console.log("-------------------[接入服务端免登处理 END]-----------------------------\n")
        return
    }

    let code = ctx.query["code"] || ""
    console.log("接入服务方第② 步: 获取登录预授权码code")
    
    // If no code, check if there's a token in Authorization header for verification
    if (code.length == 0) {
        // Check for token in Authorization header (check both lowercase and capitalized)
        const authHeader = ctx.headers.authorization || ctx.headers.Authorization || ctx.headers['authorization'] || ctx.headers['Authorization'];
        console.log("🔍 Debug - All headers keys:", Object.keys(ctx.headers).filter(k => k.toLowerCase().includes('auth')));
        console.log("🔍 Debug - Authorization header:", authHeader ? authHeader.substring(0, 20) + '...' : 'not found');
        
        const tokenFromHeader = authHeader && (authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer '))
            ? authHeader.replace(/^Bearer\s+/i, '')
            : null;
        const tokenFromQuery = ctx.query.token || null;
        const token = tokenFromHeader || tokenFromQuery;
        
        console.log("🔍 Debug - Extracted token:", token ? token.substring(0, 20) + '...' : 'not found');
        console.log("🔍 Debug - Token length:", token ? token.length : 0);
        
        if (token && token.length > 0) {
            console.log("接入服务方第② 步: 检测到token参数，验证token有效性");
            try {
                // Verify token with Lark API to get user info
                const userInfoRes = await axios.get("https://open.larksuite.com/open-apis/authen/v1/user_info", {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
                
                if (userInfoRes.data && userInfoRes.data.code === 0) {
                    const userInfo = userInfoRes.data.data;
                    // Create auth object similar to what we get from access_token endpoint
                    const authData = {
                        access_token: token,
                        token_type: "Bearer",
                        expires_in: 7140,
                        user_id: userInfo.user_id,
                        open_id: userInfo.open_id,
                        union_id: userInfo.union_id,
                        en_name: userInfo.en_name,
                        name: userInfo.name,
                        avatar_url: userInfo.avatar_url
                    };
                    
                    // Store in session and cookie
                    ctx.session.userinfo = authData;
                    serverUtil.setCookie(ctx, LJ_TOKEN_KEY, token);
                    
                    try {
                        await syncLarkUser({
                            supabaseClient: supabase,
                            accessTokenData: authData,
                            organizationId: ctx.session.organization_id || larkCredentials.organization_id || null
                        });
                    } catch (syncError) {
                        console.error('❌  Failed to sync Lark user to Supabase:', syncError);
                    }
                    
                    ctx.body = serverUtil.okResponse(authData);
                    console.log("-------------------[接入服务端免登处理 END]-----------------------------\n");
                    return;
                } else {
                    console.error('❌ Token verification failed - invalid response:', userInfoRes.data);
                    // Token is invalid/expired - return specific error code so frontend can clear it
                    ctx.body = serverUtil.failResponse("Token验证失败，请重新登录", -2) // -2 indicates token invalidity
                    return
                }
            } catch (tokenError) {
                console.error('❌ Token verification failed:', tokenError.response?.data || tokenError.message);
                // Token is invalid/expired - return specific error code so frontend can clear it
                ctx.body = serverUtil.failResponse("Token验证失败，请重新登录", -2) // -2 indicates token invalidity
                return
            }
        }
        
        // No valid token found
        ctx.body = serverUtil.failResponse("登录预授权码code is empty, please retry!!!")
        return
    }

    //【请求】app_access_token：https://open.larksuite.com/document/ukTMukTMukTM/ukDNz4SO0MjL5QzM/auth-v3/auth/app_access_token_internal
    console.log("接入服务方第③ 步: 根据AppID和App Secret请求应用授权凭证app_access_token")
    const internalRes = await axios.post("https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal", {
        "app_id": larkCredentials.lark_app_id,
        "app_secret": larkCredentials.lark_app_secret
    }, { headers: { "Content-Type": "application/json" } })

    if (!internalRes.data) {
        ctx.body = serverUtil.failResponse("app_access_token request error")
        return
    }
    if (internalRes.data.code != 0) { //非0表示失败
        ctx.body = serverUtil.failResponse(`app_access_token request error: ${internalRes.data.msg}`)
        return
    }

    console.log("接入服务方第④ 步: 获得颁发的应用授权凭证app_access_token")
    const app_access_token = internalRes.data.app_access_token || ""

    console.log("接入服务方第⑤ 步: 根据登录预授权码code和app_access_token请求用户授权凭证user_access_token")
    //【请求】user_access_token: https://open.larksuite.com/document/uAjLw4CM/ukTMukTMukTM/reference/authen-v1/access_token/create
    const authenv1Res = await axios.post("https://open.larksuite.com/open-apis/authen/v1/access_token", { "grant_type": "authorization_code", "code": code }, {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": "Bearer " + app_access_token
        }
    })

    if (!authenv1Res.data) {
        ctx.body = serverUtil.failResponse("access_toke request error")
        return
    }
    if (authenv1Res.data.code != 0) {  //非0表示失败
        ctx.body = serverUtil.failResponse(`access_toke request error: ${authenv1Res.data.msg}`)
        return
    }

    console.log("接入服务方第⑥ 步: 获取颁发的用户授权码凭证的user_access_token, 更新到Session，返回给前端")
    const newAccessToken = authenv1Res.data.data
    if (newAccessToken) {
        ctx.session.userinfo = newAccessToken
        serverUtil.setCookie(ctx, LJ_TOKEN_KEY, newAccessToken.access_token || '')

        try {
            console.log('ℹ️  Calling syncLarkUser for', newAccessToken.user_id)
            await syncLarkUser({
                supabaseClient: supabase,
                accessTokenData: newAccessToken,
                organizationId: ctx.session.organization_id || larkCredentials.organization_id || null
            })

            // ALWAYS query fresh from Supabase - force clear session cache
            // Set to false first to clear any cached value
            ctx.session.is_admin = false
            
            try {
                const larkUserId = newAccessToken.user_id
                if (larkUserId && ctx.session.organization_id) {
                    console.log(`🔍 Session: Checking role for lark_user_id=${larkUserId}, org_id=${ctx.session.organization_id}`)
                    
                    // Query: Use RPC function to find auth user by lark_user_id, then link to individuals and organization_members
                    const { data: authUserId, error: rpcError } = await supabase
                        .rpc('get_auth_user_by_lark', {
                            p_lark_user_id: larkUserId,
                            p_email: null
                        })
                    
                    if (!rpcError && authUserId) {
                        console.log(`✅ Session: Found auth user via RPC: id=${authUserId}`)
                        
                        // Get individual by user_id
                        const { data: individual, error: indError } = await supabase
                            .from('individuals')
                            .select('id')
                            .eq('user_id', authUserId)
                            .maybeSingle()
                        
                        if (individual && individual.id) {
                            console.log(`✅ Session: Found individual: id=${individual.id}`)

                            // Store individual_id in session
                            ctx.session.individual_id = individual.id

                            // Get organization member role
                            const { data: orgMember, error: memberError } = await supabase
                                .from('organization_members')
                                .select('role_code')
                                .eq('individual_id', individual.id)
                                .eq('organization_id', ctx.session.organization_id)
                                .maybeSingle()

                            if (orgMember) {
                                ctx.session.is_admin = orgMember.role_code === 'admin' || orgMember.role_code === 'owner'
                                console.log(`✅ Session role RESULT: lark_user_id=${larkUserId}, role_code=${orgMember.role_code}, isAdmin=${ctx.session.is_admin}`)
                            } else {
                                ctx.session.is_admin = false
                                console.log(`⚠️ Session: No org member found for individual_id=${individual.id}, org_id=${ctx.session.organization_id}:`, memberError)
                            }
                        } else {
                            ctx.session.is_admin = false
                            ctx.session.individual_id = null
                            console.log(`⚠️ Session: No individual found for auth_user.id=${authUserId}:`, indError)
                        }
                    } else {
                        ctx.session.is_admin = false
                        console.log(`⚠️ Session: Auth user not found via RPC for lark_user_id=${larkUserId}:`, rpcError)
                    }
                } else {
                    ctx.session.is_admin = false
                    console.log(`⚠️ Session: Missing larkUserId or organization_id`)
                }
            } catch (roleError) {
                console.error('❌ Session: Failed to check user role:', roleError)
                ctx.session.is_admin = false
            }
            
            console.log(`📤 Session: Final is_admin=${ctx.session.is_admin} (fresh from DB)`)
        } catch (syncError) {
            console.error('❌  Failed to sync Lark user to Supabase:', syncError)
        }
    } else {
        serverUtil.setCookie(ctx, LJ_TOKEN_KEY, '')
    }

    ctx.body = serverUtil.okResponse(newAccessToken)
    console.log("-------------------[接入服务端免登处理 END]-----------------------------\n")
}

//处理鉴权参数请求，返回鉴权参数
async function getSignParameters(ctx) {

    console.log("\n-------------------[接入方服务端鉴权处理 BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)
    console.log(`接入服务方第① 步: 接收到前端鉴权请求`)

    // Get organization_id from query or session
    const organizationSlug = ctx.query["organization_slug"] || ctx.session.organization_slug || ""
    
    // Get Lark credentials for this organization
    let larkCredentials = null
    if (organizationSlug) {
        console.log(`🔍 Multi-tenant mode: Using organization slug: ${organizationSlug}`)
        larkCredentials = await getLarkCredentials(organizationSlug)
        if (!larkCredentials) {
            ctx.body = serverUtil.failResponse(`Organization '${organizationSlug}' not found or Lark credentials not configured`)
            return
        }
        // Store organization_slug in session
        ctx.session.organization_slug = organizationSlug
        ctx.session.organization_id = larkCredentials.organization_id
    } else {
        console.log(`⚠️  No organization_slug provided, falling back to default config`)
        // Fallback to default config for backward compatibility
        larkCredentials = {
            lark_app_id: serverConfig.config.appId,
            lark_app_secret: serverConfig.config.appSecret,
            noncestr: serverConfig.config.noncestr
        }
    }

    const url = ctx.query["url"] ||""
    const tickeString = ctx.cookies.get(LJ_JSTICKET_KEY) || ""
    if (tickeString.length > 0) {
        console.log(`接入服务方第② 步: Cookie中获取jsapi_ticket，计算JSAPI鉴权参数，返回`)
        const signParam = calculateSignParam(tickeString, url, larkCredentials.lark_app_id, larkCredentials.noncestr)
        ctx.body = serverUtil.okResponse(signParam)
        console.log("-------------------[接入方服务端鉴权处理 END]-----------------------------\n")
        return
    }

    console.log(`接入服务方第② 步: 未检测到jsapi_ticket，根据AppID和App Secret请求自建应用授权凭证tenant_access_token`)
    //【请求】tenant_access_token：https://open.larksuite.com/document/ukTMukTMukTM/ukDNz4SO0MjL5QzM/auth-v3/auth/tenant_access_token_internal
    const internalRes = await axios.post("https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal", {
        "app_id": larkCredentials.lark_app_id,
        "app_secret": larkCredentials.lark_app_secret
    }, { headers: { "Content-Type": "application/json" } })

    if (!internalRes.data) {
        ctx.body = serverUtil.failResponse('tenant_access_token request error')
        return
    }
    if (internalRes.data.code != 0) {
        ctx.body = serverUtil.failResponse(`tenant_access_token request error: ${internalRes.data.msg}`)
        return
    }

    console.log(`接入服务方第③ 步: 获得颁发的自建应用授权凭证tenant_access_token`)
    const tenant_access_token = internalRes.data.tenant_access_token ||""

    console.log(`接入服务方第④ 步: 请求JSAPI临时授权凭证`)
    //【请求】jsapi_ticket：https://open.larksuite.com/document/ukTMukTMukTM/uYTM5UjL2ETO14iNxkTN/h5_js_sdk/authorization
    const ticketRes = await axios.post("https://open.larksuite.com/open-apis/jssdk/ticket/get", {}, {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": "Bearer " + tenant_access_token
        }
    })

    if (!ticketRes.data) {
        ctx.body = serverUtil.failResponse('get jssdk ticket request error')
        return
    }
    if (ticketRes.data.code != 0) { //非0表示失败
        ctx.body = serverUtil.failResponse(`get jssdk ticket request error: ${ticketRes.data.msg}`)
        return
    }

    console.log(`接入服务方第⑤ 步: 获得颁发的JSAPI临时授权凭证，更新到Cookie`)
    const newTicketString = ticketRes.data.data.ticket || ""
    if (newTicketString.length > 0) {
        serverUtil.setCookie(ctx, LJ_JSTICKET_KEY, newTicketString)
    }

    console.log(`接入服务方第⑥ 步: 计算出JSAPI鉴权参数，并返回给前端`)
    const signParam = calculateSignParam(newTicketString, url, larkCredentials.lark_app_id, larkCredentials.noncestr)
    ctx.body = serverUtil.okResponse(signParam)
    console.log("-------------------[接入方服务端鉴权处理 END]-----------------------------\n")
}

//处理获取组织成员请求
async function getOrganizationMembers(ctx) {
    console.log("\n-------------------[获取组织成员 BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)
    console.log(`接入服务方第① 步: 接收到获取组织成员请求`)

    // 检查用户是否已登录
    const accessToken = ctx.session.userinfo
    if (!accessToken || !accessToken.access_token) {
        ctx.body = serverUtil.failResponse("用户未登录，请先登录")
        return
    }

    console.log("接入服务方第② 步: 获取tenant_access_token用于调用组织API")
    // 获取tenant_access_token
    try {
        const internalRes = await axios.post("https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal", {
            "app_id": serverConfig.config.appId,
            "app_secret": serverConfig.config.appSecret
        }, { headers: { "Content-Type": "application/json" } })

        if (!internalRes.data || internalRes.data.code != 0) {
            console.error("获取tenant_access_token失败:", internalRes.data)
            ctx.body = serverUtil.failResponse(`获取tenant_access_token失败: ${internalRes.data?.msg || '未知错误'}`)
            return
        }

        const tenant_access_token = internalRes.data.tenant_access_token

        console.log("接入服务方第③ 步: 调用Lark API获取组织成员列表")
        
        // 获取分页参数
        const pageSize = Math.min(parseInt(ctx.query.page_size) || 50, 100) // 最大100
        const pageToken = ctx.query.page_token || ''

        // 调用Lark API获取用户列表
        const usersRes = await axios.get("https://open.larksuite.com/open-apis/contact/v3/users", {
            headers: {
                "Authorization": "Bearer " + tenant_access_token,
                "Content-Type": "application/json"
            },
            params: {
                page_size: pageSize,
                page_token: pageToken,
                user_id_type: "user_id" // 指定用户ID类型
            }
        })

        if (!usersRes.data || usersRes.data.code != 0) {
            console.error("获取用户列表失败:", usersRes.data)
            ctx.body = serverUtil.failResponse(`获取用户列表失败: ${usersRes.data?.msg || '未知错误'}`)
            return
        }

        console.log("接入服务方第④ 步: 处理用户数据并返回")
        const responseData = usersRes.data.data || {}
        const users = responseData.items || []
        
        // 处理用户数据，包含更多字段
        const processedUsers = users.map(user => ({
            user_id: user.user_id,
            union_id: user.union_id,
            open_id: user.open_id,
            name: user.name,
            en_name: user.en_name,
            nickname: user.nickname,
            email: user.email,
            mobile: user.mobile,
            avatar_url: user.avatar?.avatar_240 || user.avatar?.avatar_72 || user.avatar?.avatar_origin || '',
            status: user.status,
            department_ids: user.department_ids || [],
            leader_user_id: user.leader_user_id,
            city: user.city,
            country: user.country,
            work_station: user.work_station,
            join_time: user.join_time,
            employee_no: user.employee_no,
            employee_type: user.employee_type,
            positions: user.positions || [],
            orders: user.orders || []
        }))

        // 返回符合前端期望的数据结构
        ctx.body = serverUtil.okResponse(processedUsers)
        
        console.log(`成功获取 ${processedUsers.length} 个组织成员`)
        console.log("-------------------[获取组织成员 END]-----------------------------\n")

    } catch (error) {
        console.error("调用Lark API出错:", error.response?.data || error.message)
        
        // 根据错误类型返回更具体的错误信息
        let errorMessage = "获取组织成员失败"
        if (error.response?.status === 403) {
            errorMessage = "权限不足，请检查应用权限配置"
        } else if (error.response?.status === 429) {
            errorMessage = "请求过于频繁，请稍后重试"
        } else if (error.response?.data?.msg) {
            errorMessage = error.response.data.msg
        }
        
        ctx.body = serverUtil.failResponse(errorMessage)
    }
}

//计算鉴权参数}

//获取部门列表
async function getDepartments(ctx) {
    serverUtil.configAccessControl(ctx)
    console.log("\n-------------------[获取部门列表 BEGIN]-----------------------------");
    console.log("接入服务方第① 步: 接收到获取部门列表请求");

    // 检查用户是否已登录
    const accessToken = ctx.session.userinfo
    if (!accessToken || !accessToken.access_token) {
        console.log("用户未登录，返回错误");
        ctx.body = serverUtil.failResponse("用户未登录，请先登录");
        return;
    }

    console.log("接入服务方第② 步: 获取tenant_access_token用于调用部门API");

    try {
        // 获取tenant_access_token
        const tenantTokenResponse = await axios.post(
            'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
            {
                app_id: serverConfig.config.appId,
                app_secret: serverConfig.config.appSecret
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (tenantTokenResponse.data.code !== 0) {
            console.log("获取tenant_access_token失败:", tenantTokenResponse.data);
            ctx.body = serverUtil.failResponse("获取访问令牌失败");
            return;
        }

        const tenantAccessToken = tenantTokenResponse.data.tenant_access_token;
        console.log("接入服务方第③ 步: 调用Lark API获取部门列表");

        // 获取查询参数
        const pageSize = ctx.query.page_size || 50;
        const pageToken = ctx.query.page_token || '';
        const parentDepartmentId = ctx.query.parent_department_id || '';
        const fetchChild = ctx.query.fetch_child || false;

        // 构建查询参数
        const queryParams = new URLSearchParams({
            department_id_type: 'department_id',
            page_size: pageSize,
            fetch_child: fetchChild
        });

        if (pageToken) {
            queryParams.append('page_token', pageToken);
        }

        if (parentDepartmentId) {
            queryParams.append('parent_department_id', parentDepartmentId);
        }

        // 调用Lark部门API
        const departmentsResponse = await axios.get(
            `https://open.feishu.cn/open-apis/contact/v3/departments?${queryParams}`,
            {
                headers: {
                    'Authorization': `Bearer ${tenantAccessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (departmentsResponse.data.code !== 0) {
            console.log("获取部门列表失败:", departmentsResponse.data);
            let errorMsg = "获取部门列表失败";
            
            // 根据错误码提供更具体的错误信息
            if (departmentsResponse.data.code === 403) {
                errorMsg = "权限不足，请检查应用权限配置";
            } else if (departmentsResponse.data.code === 429) {
                errorMsg = "请求过于频繁，请稍后重试";
            }
            
            ctx.body = serverUtil.failResponse(errorMsg);
            return;
        }

        console.log("接入服务方第④ 步: 处理部门数据并返回");

        // 处理部门数据
        const departments = departmentsResponse.data.data.items || [];
        const processedDepartments = departments.map(dept => ({
            department_id: dept.department_id,
            name: dept.name,
            i18n_name: dept.i18n_name,
            parent_department_id: dept.parent_department_id,
            leader_user_id: dept.leader_user_id,
            chat_id: dept.chat_id,
            order: dept.order,
            member_count: dept.member_count,
            status: dept.status
        }));

        console.log(`成功获取 ${processedDepartments.length} 个部门`);
        console.log("-------------------[获取部门列表 END]-----------------------------\n");

        ctx.body = serverUtil.okResponse(processedDepartments);

    } catch (error) {
        console.error("获取部门列表时发生错误:", error);
        ctx.body = serverUtil.failResponse("服务器内部错误");
    }
}

async function getDepartmentUsers(ctx) {
    serverUtil.configAccessControl(ctx)
    console.log("\n-------------------[获取部门用户列表 BEGIN]-----------------------------");
    console.log("接入服务方第① 步: 接收到获取部门用户列表请求");

    // 检查用户是否已登录
    const accessToken = ctx.session.userinfo
    if (!accessToken || !accessToken.access_token) {
        console.log("用户未登录，返回错误");
        ctx.body = serverUtil.failResponse("用户未登录，请先登录");
        return;
    }

    console.log("接入服务方第② 步: 读取部门配置文件");

    try {
        // 读取部门配置文件
        const fs = require('fs');
        const path = require('path');
        const configPath = path.join(__dirname, '../config/departments.json');
        
        if (!fs.existsSync(configPath)) {
            console.log("部门配置文件不存在");
            ctx.body = serverUtil.failResponse("部门配置文件不存在，请先配置部门ID");
            return;
        }

        const departmentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const departments = departmentConfig.departments || [];

        if (departments.length === 0) {
            console.log("未配置任何部门");
            ctx.body = serverUtil.failResponse("未配置任何部门，请在config/departments.json中添加部门ID");
            return;
        }

        console.log("接入服务方第③ 步: 获取tenant_access_token用于调用用户API");

        // 获取tenant_access_token
        const tenantTokenResponse = await axios.post(
            'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
            {
                app_id: serverConfig.config.appId,
                app_secret: serverConfig.config.appSecret
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (tenantTokenResponse.data.code !== 0) {
            console.log("获取tenant_access_token失败:", tenantTokenResponse.data);
            ctx.body = serverUtil.failResponse("获取访问令牌失败");
            return;
        }

        const tenantAccessToken = tenantTokenResponse.data.tenant_access_token;
        console.log("接入服务方第④ 步: 调用Lark API获取各部门用户列表");

        const allDepartmentUsers = [];

        // 为每个配置的部门获取用户列表
        for (const department of departments) {
            console.log(`正在获取部门 ${department.name} (${department.id}) 的用户列表`);

            // 获取查询参数
            const pageSize = ctx.query.page_size || 50;
            const pageToken = ctx.query.page_token || '';

            // 构建查询参数
            const queryParams = new URLSearchParams({
                user_id_type: 'user_id',
                department_id_type: 'open_department_id',
                department_id: department.id,
                page_size: pageSize
            });

            if (pageToken) {
                queryParams.append('page_token', pageToken);
            }

            // 调用Lark用户API
            const usersResponse = await axios.get(
                `https://open.feishu.cn/open-apis/contact/v3/users/find_by_department?${queryParams}`,
                {
                    headers: {
                        'Authorization': `Bearer ${tenantAccessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (usersResponse.data.code !== 0) {
                console.log(`获取部门 ${department.name} 用户列表失败:`, usersResponse.data);
                let errorMsg = `获取部门 ${department.name} 用户列表失败`;
                
                // 根据错误码提供更具体的错误信息
                if (usersResponse.data.code === 403) {
                    errorMsg = "权限不足，请检查应用权限配置";
                } else if (usersResponse.data.code === 429) {
                    errorMsg = "请求过于频繁，请稍后重试";
                }
                
                ctx.body = serverUtil.failResponse(errorMsg);
                return;
            }

            // 处理用户数据
            const users = usersResponse.data.data.items || [];
            const processedUsers = users.map(user => ({
                user_id: user.user_id,
                union_id: user.union_id,
                open_id: user.open_id,
                name: user.name,
                en_name: user.en_name,
                nickname: user.nickname,
                email: user.email,
                mobile: user.mobile,
                mobile_visible: user.mobile_visible,
                gender: user.gender,
                avatar: user.avatar,
                status: user.status,
                department_ids: user.department_ids,
                leader_user_id: user.leader_user_id,
                city: user.city,
                country: user.country,
                work_station: user.work_station,
                join_time: user.join_time,
                employee_no: user.employee_no,
                employee_type: user.employee_type,
                positions: user.positions,
                orders: user.orders,
                custom_attrs: user.custom_attrs,
                enterprise_email: user.enterprise_email,
                job_title: user.job_title,
                department_info: {
                    department_id: department.id,
                    department_name: department.name,
                    department_description: department.description
                }
            }));

            allDepartmentUsers.push({
                department: {
                    id: department.id,
                    name: department.name,
                    description: department.description
                },
                users: processedUsers,
                user_count: processedUsers.length
            });

            console.log(`成功获取部门 ${department.name} 的 ${processedUsers.length} 个用户`);
        }

        console.log("接入服务方第⑤ 步: 处理所有部门用户数据并返回");
        console.log(`总共获取了 ${allDepartmentUsers.length} 个部门的用户信息`);
        console.log("-------------------[获取部门用户列表 END]-----------------------------\n");

        ctx.body = serverUtil.okResponse(allDepartmentUsers);

    } catch (error) {
        console.error("获取部门用户列表时发生错误:", error);
        ctx.body = serverUtil.failResponse("服务器内部错误");
    }
}

async function getBitableTables(ctx) {
    console.log("\n-------------------[获取多维表格表列表 BEGIN]-----------------------------");
    serverUtil.configAccessControl(ctx);
    console.log("接入服务方第① 步: 接收到获取多维表格表列表请求");

    // 检查用户是否已登录
    if (!ctx.session.userinfo || !ctx.session.userinfo.access_token) {
        console.log("用户未登录，返回错误");
        ctx.body = serverUtil.failResponse("用户未登录，请先登录");
        return;
    }

    try {
        const appToken = ctx.query.app_token || "J8tAbd9oEaxuLZsQbLwlNuHdgoc";
        console.log(`接入服务方第② 步: 使用AppToken ${appToken} 请求多维表格表列表`);

        const userAccessToken = ctx.session.userinfo.access_token;
        console.log("接入服务方第③ 步: 使用用户访问令牌请求Lark Base API");

        // 调用Lark Base API获取表列表
        const response = await axios.get(`https://open.larksuite.com/open-apis/bitable/v1/apps/${appToken}/tables`, {
            headers: {
                'Authorization': `Bearer ${userAccessToken}`,
                'Content-Type': 'application/json'
            },
            params: {
                page_size: 100 // 获取最多100个表
            }
        });

        console.log("接入服务方第④ 步: 收到Lark Base API响应");

        if (response.data.code !== 0) {
            console.error("Lark Base API返回错误:", response.data);
            ctx.body = serverUtil.failResponse(`获取表列表失败: ${response.data.msg}`);
            return;
        }

        const tables = response.data.data.items || [];
        console.log(`接入服务方第⑤ 步: 成功获取 ${tables.length} 个表`);

        // 打印表信息
        tables.forEach((table, index) => {
            console.log(`表 ${index + 1}: ${table.name} (ID: ${table.table_id}, 主表: ${table.is_primary ? '是' : '否'})`);
        });

        console.log("-------------------[获取多维表格表列表 END]-----------------------------\n");

        ctx.body = serverUtil.okResponse({
            tables: tables,
            total: response.data.data.total || tables.length,
            app_token: appToken
        });

    } catch (error) {
        console.error("获取多维表格表列表时发生错误:", error.response?.data || error.message);
        if (error.response?.status === 403) {
            ctx.body = serverUtil.failResponse("权限不足，请确保应用有访问该多维表格的权限");
        } else if (error.response?.status === 404) {
            ctx.body = serverUtil.failResponse("多维表格不存在或AppToken无效");
        } else {
            ctx.body = serverUtil.failResponse("服务器内部错误");
        }
    }
}

//计算鉴权参数 - Updated to support multi-tenant with org-specific appId and noncestr
function calculateSignParam(tickeString, url, appId, noncestr) {
    // Use provided appId and noncestr, or fallback to default config
    const finalAppId = appId || serverConfig.config.appId
    const finalNoncestr = noncestr || serverConfig.config.noncestr
    
    const timestamp = (new Date()).getTime()
    const verifyStr = `jsapi_ticket=${tickeString}&noncestr=${finalNoncestr}&timestamp=${timestamp}&url=${url}`
    let signature = CryptoJS.SHA1(verifyStr).toString(CryptoJS.enc.Hex)
    const signParam = {
        "app_id": finalAppId,
        "signature": signature,
        "noncestr": finalNoncestr,
        "timestamp": timestamp,
    }
    return signParam
}

///Start Sever
const app = new Koa()
const router = new Router();

//配置Session的中间件
app.keys = ['some secret hurr'];   /*cookie的签名*/
const koaSessionConfig = {
    key: 'lk_koa:session', /** 默认 */
    maxAge: 2 * 3600 * 1000,  /*  cookie的过期时间，单位 ms  */
    overwrite: true, /** (boolean) can overwrite or not (default true)  默认 */
    httpOnly: true, /**  true表示只有服务器端可以获取cookie */
    signed: true, /** 默认 签名 */
    rolling: true, /** 在每次请求时强行设置 cookie，这将重置 cookie 过期时间（默认：false） 【需要修改】 */
    renew: false, /** (boolean) renew session when session is nearly expired      【需要修改】*/
};
app.use(session(koaSessionConfig, app));

// Add body parser middleware to parse JSON request bodies
app.use(bodyParser({
  enableTypes: ['json'],
  jsonLimit: '10mb',
  strict: true,
  onerror: (err, ctx) => {
    console.error('❌ Body parser error:', err);
    ctx.throw(422, 'Body parse error');
  }
}));

//处理获取组织配置请求，验证组织是否存在
async function getOrganizationConfig(ctx) {
    console.log("\n-------------------[获取组织配置 BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)
    
    const organizationSlug = ctx.query["organization_slug"] || ""
    
    if (!organizationSlug) {
        ctx.body = serverUtil.failResponse("organization_slug parameter is required")
        return
    }
    
    // Validate organization exists
    const isValid = await validateOrganization(organizationSlug)
    if (!isValid) {
        ctx.body = serverUtil.failResponse(`Organization '${organizationSlug}' not found or inactive`)
        return
    }
    
    // Get organization info
    const orgInfo = await getOrganizationInfo(organizationSlug)
    if (!orgInfo) {
        ctx.body = serverUtil.failResponse(`Failed to retrieve organization info`)
        return
    }
    
    // Get Lark credentials to verify they're configured
    const larkCredentials = await getLarkCredentials(organizationSlug)
    if (!larkCredentials) {
        ctx.body = serverUtil.failResponse(`Lark credentials not configured for organization '${organizationSlug}'`)
        return
    }
    
    // ALWAYS query fresh from Supabase - ignore session cache completely
    // EXPLICITLY set to false - never trust session or any cached value
    let isAdmin = false
    
    // CRITICAL: Never use session.is_admin - always query fresh
    const sessionWasAdmin = ctx.session.is_admin
    ctx.session.is_admin = false // Clear it immediately
    
    try {
        const accessToken = ctx.session.userinfo
        if (accessToken && accessToken.user_id && orgInfo.id) {
            const larkUserId = accessToken.user_id
            
            console.log(`🔍 [getOrganizationConfig] Checking role for lark_user_id=${larkUserId}, org_id=${orgInfo.id}`)
            console.log(`🔍 [getOrganizationConfig] Session had is_admin=${sessionWasAdmin} (ignoring, querying fresh)`)
            
            // Query: Use RPC function to find auth user by lark_user_id, then link to individuals and organization_members
            const { data: authUserId, error: rpcError } = await supabase
                .rpc('get_auth_user_by_lark', {
                    p_lark_user_id: larkUserId,
                    p_email: null
                })
            
            if (!rpcError && authUserId) {
                console.log(`✅ [getOrganizationConfig] Found auth user via RPC: id=${authUserId}`)
                
                // Get individual by user_id
                const { data: individual, error: indError } = await supabase
                    .from('individuals')
                    .select('id')
                    .eq('user_id', authUserId)
                    .maybeSingle()
                
                if (individual && individual.id) {
                    console.log(`✅ [getOrganizationConfig] Found individual: id=${individual.id}`)
                    
                    // Get organization member role
                    const { data: orgMember, error: memberError } = await supabase
                        .from('organization_members')
                        .select('role_code')
                        .eq('individual_id', individual.id)
                        .eq('organization_id', orgInfo.id)
                        .maybeSingle()
                    
                    if (orgMember) {
                        isAdmin = orgMember.role_code === 'admin' || orgMember.role_code === 'owner'
                        console.log(`✅ [getOrganizationConfig] Role check RESULT: lark_user_id=${larkUserId}, role_code=${orgMember.role_code}, isAdmin=${isAdmin}`)
                    } else {
                        console.log(`⚠️ [getOrganizationConfig] No org member found for individual_id=${individual.id}, org_id=${orgInfo.id}:`, memberError)
                        isAdmin = false
                    }
                } else {
                    console.log(`⚠️ [getOrganizationConfig] No individual found for auth_user.id=${authUserId}:`, indError)
                    isAdmin = false
                }
            } else {
                console.log(`⚠️ [getOrganizationConfig] Auth user not found via RPC for lark_user_id=${larkUserId}:`, rpcError)
                isAdmin = false
            }
        } else {
            console.log(`⚠️ [getOrganizationConfig] Missing required data:`, { hasToken: !!accessToken, hasUserId: !!(accessToken?.user_id), orgId: orgInfo.id })
            isAdmin = false
        }
    } catch (roleError) {
        console.error('❌ [getOrganizationConfig] Failed to check user role:', roleError)
        isAdmin = false
    }
    
    // CRITICAL: Always return fresh value, never use session cache
    console.log(`📤 [getOrganizationConfig] FINAL RESULT: is_admin=${isAdmin} (fresh from DB, session was ${sessionWasAdmin})`)
    
    // Return organization config (without secrets)
    ctx.body = serverUtil.okResponse({
        organization_slug: orgInfo.slug,
        organization_name: orgInfo.name,
        organization_id: orgInfo.id,
        lark_app_id: larkCredentials.lark_app_id, // Safe to return app_id
        is_active: orgInfo.is_active,
        is_admin: isAdmin
    })
    
    console.log("-------------------[获取组织配置 END]-----------------------------\n")
}

async function getSupabaseMembers(ctx) {
    console.log("\n-------------------[获取组织成员 (Supabase) BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)

    const accessToken = ctx.session.userinfo
    if (!accessToken || !accessToken.access_token) {
        ctx.body = serverUtil.failResponse("用户未登录，请先登录")
        return
    }

    const organizationId = ctx.session.organization_id
    if (!organizationId) {
        ctx.body = serverUtil.failResponse("未检测到组织信息，请重新登录以选择组织")
        return
    }

    try {
        const { data, error } = await supabase
            .from('organization_members')
            .select('id, role_code, status, joined_at, individuals:individual_id (display_name, primary_email, profile)')
            .eq('organization_id', organizationId)
            .order('joined_at', { ascending: true })

        if (error) {
            console.error('❌ Failed to fetch organization members:', error)
            ctx.body = serverUtil.failResponse('获取组织成员失败')
            return
        }

        const members = (data || []).map((member) => {
            const profile = member.individuals?.profile || {}
            return {
                id: member.id,
                role_code: member.role_code,
                status: member.status,
                joined_at: member.joined_at,
                name: member.individuals?.display_name || 'Unknown User',
                email: member.individuals?.primary_email || null,
                avatar_url: profile?.avatar_url || null,
            }
        })

        ctx.body = serverUtil.okResponse(members)
        console.log(`成功返回 ${members.length} 个组织成员`)
    } catch (error) {
        console.error('❌ Exception fetching organization members:', error)
        ctx.body = serverUtil.failResponse('服务器内部错误')
    }

    console.log("-------------------[获取组织成员 (Supabase) END]-----------------------------\n")
}

// Fetch audit log entries for the authenticated organisation
async function getAuditLogs(ctx) {
    console.log("\n-------------------[获取审计日志 BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)

    const accessToken = ctx.session.userinfo
    if (!accessToken || !accessToken.access_token) {
        ctx.body = serverUtil.failResponse("用户未登录，请先登录")
        return
    }

    const organizationId = ctx.session.organization_id
    if (!organizationId) {
        ctx.body = serverUtil.failResponse("未检测到组织信息，请重新登录以选择组织")
        return
    }

    try {
        const { data, error } = await supabase
            .from('audit_events')
            .select('id,event_type,payload,occurred_at,ip,user_agent')
            .eq('organization_id', organizationId)
            .order('occurred_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error('❌ Failed to fetch audit logs:', error)
            ctx.body = serverUtil.failResponse('获取审计日志失败')
            return
        }

        ctx.body = serverUtil.okResponse(data || [])
        console.log(`成功返回 ${data?.length || 0} 条审计记录`)
    } catch (error) {
        console.error('❌ Exception fetching audit logs:', error)
        ctx.body = serverUtil.failResponse('服务器内部错误')
    }

    console.log("-------------------[获取审计日志 END]-----------------------------\n")
}

async function getOrganizationsAdmin(ctx) {
    console.log("\n-------------------[获取全部组织 BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)

    if (!ctx.session.is_admin) {
        ctx.body = serverUtil.failResponse('权限不足，仅管理员可访问')
        return
    }

    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('id, name, slug, is_active, created_at')
            .order('created_at', { ascending: true })

        if (error) {
            console.error('❌ Failed to fetch organizations:', error)
            ctx.body = serverUtil.failResponse('获取组织失败')
            return
        }

        ctx.body = serverUtil.okResponse(data || [])
        console.log(`成功返回 ${data?.length || 0} 个组织`)
    } catch (error) {
        console.error('❌ Exception fetching organizations:', error)
        ctx.body = serverUtil.failResponse('服务器内部错误')
    }

    console.log("-------------------[获取全部组织 END]-----------------------------\n")
}

async function createOrganizationAdmin(ctx) {
    console.log("\n-------------------[创建组织 BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)

    if (!ctx.session.is_admin) {
        ctx.body = serverUtil.failResponse('权限不足，仅管理员可访问')
        return
    }

    const name = (ctx.query.name || '').trim()
    let customSlug = (ctx.query.slug || '').trim()

    if (!name) {
        ctx.body = serverUtil.failResponse('组织名称不能为空')
        return
    }

    if (!customSlug) {
        customSlug = slugify(name)
    } else {
        customSlug = slugify(customSlug)
    }

    if (!customSlug) {
        ctx.body = serverUtil.failResponse('无法生成有效的组织标识')
        return
    }

    try {
        const { data, error } = await supabase
            .from('organizations')
            .insert({
                name,
                slug: customSlug,
                is_active: true,
            })
            .select('id, name, slug, is_active, created_at')
            .single()

        if (error) {
            console.error('❌ Failed to create organization:', error)
            ctx.body = serverUtil.failResponse(error.message || '创建组织失败')
            return
        }

        ctx.body = serverUtil.okResponse(data)
        console.log(`成功创建组织 ${data.name}`)
    } catch (error) {
        console.error('❌ Exception creating organization:', error)
        ctx.body = serverUtil.failResponse('服务器内部错误')
    }

    console.log("-------------------[创建组织 END]-----------------------------\n")
}

//注册服务端路由和处理
router.get(serverConfig.config.getUserAccessTokenPath, getUserAccessToken)
router.get(serverConfig.config.getSignParametersPath, getSignParameters)
router.get("/api/get_organization_config", getOrganizationConfig) // New endpoint
router.get(serverConfig.config.getOrganizationMembersPath, getOrganizationMembers)
router.get(serverConfig.config.getDepartmentsPath, getDepartments)
router.get(serverConfig.config.getDepartmentUsersPath, getDepartmentUsers)
router.get(serverConfig.config.getBitableTablesPath, getBitableTables)
router.get('/api/get_audit_logs', getAuditLogs)
router.get('/api/get_supabase_members', getSupabaseMembers)
router.get('/api/admin/organizations', getOrganizationsAdmin)
router.post('/api/admin/organizations', createOrganizationAdmin)

// Strategic Map API routes
router.get('/api/strategic_map', requireProductAccess('strategic_map'), async (ctx) => {
    const strategicMapHandler = require('./api_handlers/strategic_map_v2')
    await strategicMapHandler({ 
        method: ctx.method, 
        query: ctx.query, 
        body: ctx.request.body,
        headers: ctx.headers 
    }, {
        status: (code) => ({ json: (data) => { ctx.status = code; ctx.body = data } }),
        json: (data) => { ctx.body = data },
        setHeader: (name, value) => { ctx.set(name, value) },
    })
})

router.post('/api/strategic_map', requireProductAccess('strategic_map'), async (ctx) => {
    const strategicMapHandler = require('./api_handlers/strategic_map_v2')
    
    // Body is now automatically parsed by koa-bodyparser middleware
    console.log('🔍 Koa POST /api/strategic_map');
    console.log('  - Method:', ctx.method);
    console.log('  - Query:', ctx.query);
    console.log('  - Body type:', typeof ctx.request.body);
    console.log('  - Body:', JSON.stringify(ctx.request.body, null, 2));
    console.log('  - Body keys:', ctx.request.body ? Object.keys(ctx.request.body) : 'null/undefined');
    console.log('  - organization_slug in body:', ctx.request.body?.organization_slug);
    
    const reqBody = ctx.request.body || {};
    
    await strategicMapHandler({ 
        method: ctx.method, 
        query: ctx.query, 
        body: reqBody,
        headers: ctx.headers 
    }, {
        status: (code) => {
            console.log('📤 Setting status:', code);
            return {
                json: (data) => {
                    console.log('📤 Sending JSON response:', JSON.stringify(data, null, 2));
                    ctx.status = code;
                    ctx.body = data;
                }
            };
        },
        json: (data) => {
            console.log('📤 Sending JSON response (direct):', JSON.stringify(data, null, 2));
            ctx.body = data;
        },
        setHeader: (name, value) => { ctx.set(name, value) },
    })
})

router.delete('/api/strategic_map', requireProductAccess('strategic_map'), async (ctx) => {
    serverUtil.configAccessControl(ctx)

    // Handle OPTIONS preflight request
    if (ctx.method === 'OPTIONS') {
        ctx.status = 200
        return
    }

    const strategicMapHandler = require('./api_handlers/strategic_map_v2')

    console.log('🔍 Koa DELETE /api/strategic_map');
    console.log('  - Method:', ctx.method);
    console.log('  - Query:', ctx.query);
    console.log('  - ID:', ctx.query.id);

    await strategicMapHandler({
        method: ctx.method,
        query: ctx.query,
        body: ctx.request.body || {},
        headers: ctx.headers
    }, {
        status: (code) => {
            console.log('📤 Setting status:', code);
            return {
                json: (data) => {
                    console.log('📤 Sending JSON response:', JSON.stringify(data, null, 2));
                    ctx.status = code;
                    ctx.body = data;
                }
            };
        },
        json: (data) => {
            console.log('📤 Sending JSON response (direct):', JSON.stringify(data, null, 2));
            ctx.body = data;
        },
        setHeader: (name, value) => {
            ctx.set(name, value);
        },
    })
})

// Organization API route (for realtime sync)
router.get('/api/organization', async (ctx) => {
    const organizationHandler = require('./api_handlers/organization')
    await organizationHandler(ctx)
})

// Current user API route
router.get('/api/current_user', async (ctx) => {
    const serverUtil = require('./server_util');
    serverUtil.configAccessControl(ctx);

    try {
        // Return session info including individual_id
        const userInfo = {
            individual_id: ctx.session.individual_id || null,
            organization_id: ctx.session.organization_id || null,
            organization_slug: ctx.session.organization_slug || null,
            is_admin: ctx.session.is_admin || false,
            lark_user_id: ctx.session.userinfo?.data?.user_id || null,
        };

        ctx.body = serverUtil.okResponse(userInfo);
    } catch (error) {
        console.error('Error getting current user:', error);
        ctx.body = serverUtil.failResponse('Failed to get current user info');
    }
})

// Strategic Map v2 API routes (new backend with auto-cascading)

// OPTIONS handler for CORS preflight
router.options('/api/strategic_map_v2', async (ctx) => {
    const serverUtil = require('./server_util');
    serverUtil.configAccessControl(ctx);
    ctx.status = 200;
})

router.get('/api/strategic_map_v2', async (ctx) => {
    // Set CORS headers first
    const serverUtil = require('./server_util');
    serverUtil.configAccessControl(ctx);

    const strategicMapV2Handler = require('./api_handlers/strategic_map_v2')
    await strategicMapV2Handler({
        method: ctx.method,
        query: ctx.query,
        body: ctx.request.body,
        headers: ctx.headers
    }, {
        status: (code) => ({ json: (data) => { ctx.status = code; ctx.body = data } }),
        json: (data) => { ctx.body = data },
        setHeader: (name, value) => { ctx.set(name, value) },
    })
})

router.post('/api/strategic_map_v2', async (ctx) => {
    // Set CORS headers first
    const serverUtil = require('./server_util');
    serverUtil.configAccessControl(ctx);

    const strategicMapV2Handler = require('./api_handlers/strategic_map_v2')
    await strategicMapV2Handler({
        method: ctx.method,
        query: ctx.query,
        body: ctx.request.body || {},
        headers: ctx.headers
    }, {
        status: (code) => ({ json: (data) => { ctx.status = code; ctx.body = data } }),
        json: (data) => { ctx.body = data },
        setHeader: (name, value) => { ctx.set(name, value) },
    })
})

router.put('/api/strategic_map_v2', async (ctx) => {
    // Set CORS headers first
    const serverUtil = require('./server_util');
    serverUtil.configAccessControl(ctx);

    const strategicMapV2Handler = require('./api_handlers/strategic_map_v2')
    await strategicMapV2Handler({
        method: ctx.method,
        query: ctx.query,
        body: ctx.request.body || {},
        headers: ctx.headers
    }, {
        status: (code) => ({ json: (data) => { ctx.status = code; ctx.body = data } }),
        json: (data) => { ctx.body = data },
        setHeader: (name, value) => { ctx.set(name, value) },
    })
})

router.delete('/api/strategic_map_v2', async (ctx) => {
    // Set CORS headers first
    const serverUtil = require('./server_util');
    serverUtil.configAccessControl(ctx);

    const strategicMapV2Handler = require('./api_handlers/strategic_map_v2')
    await strategicMapV2Handler({
        method: ctx.method,
        query: ctx.query,
        body: ctx.request.body || {},
        headers: ctx.headers
    }, {
        status: (code) => ({ json: (data) => { ctx.status = code; ctx.body = data } }),
        json: (data) => { ctx.body = data },
        setHeader: (name, value) => { ctx.set(name, value) },
    })
})

// OPTIONS handler for batch endpoint CORS preflight
router.options('/api/strategic_map_v2/batch', async (ctx) => {
    const serverUtil = require('./server_util');
    serverUtil.configAccessControl(ctx);
    ctx.status = 200;
})

router.post('/api/strategic_map_v2/batch', async (ctx) => {
    // Set CORS headers first
    const serverUtil = require('./server_util');
    serverUtil.configAccessControl(ctx);

    const strategicMapV2BatchHandler = require('./api_handlers/strategic_map_v2_batch')
    await strategicMapV2BatchHandler({
        method: ctx.method,
        query: ctx.query,
        body: ctx.request.body || {},
        headers: ctx.headers
    }, {
        status: (code) => ({ json: (data) => { ctx.status = code; ctx.body = data } }),
        json: (data) => { ctx.body = data },
        setHeader: (name, value) => { ctx.set(name, value) },
    })
})

// ============================================================================
// Contact Management Routes
// ============================================================================

const contactController = require('./contact_management_controller')

// Contacts (specific routes before parameterized routes)
router.get('/api/contacts/data-quality', requireProductAccess('contact_management'), contactController.getDataQualityMetrics)
router.get('/api/contacts', requireProductAccess('contact_management'), contactController.getContacts)
router.post('/api/contacts', requireProductAccess('contact_management'), contactController.createContact)
router.put('/api/contacts/:id', requireProductAccess('contact_management'), contactController.updateContact)
router.delete('/api/contacts/:id', requireProductAccess('contact_management'), contactController.deleteContact)

// Contact Stages
router.get('/api/contact-stages', requireProductAccess('contact_management'), contactController.getContactStages)
router.post('/api/contact-stages', requireProductAccess('contact_management'), contactController.createContactStage)
router.put('/api/contact-stages/:id', requireProductAccess('contact_management'), contactController.updateContactStage)
router.delete('/api/contact-stages/:id', requireProductAccess('contact_management'), contactController.deleteContactStage)

// Traffic Channels
router.get('/api/traffic-channels', requireProductAccess('contact_management'), contactController.getTrafficChannels)
router.post('/api/traffic-channels', requireProductAccess('contact_management'), contactController.createTrafficChannel)
router.delete('/api/traffic-channels/:id', requireProductAccess('contact_management'), contactController.deleteTrafficChannel)

// Organization Members
router.get('/api/organization-members', requireProductAccess('contact_management'), contactController.getOrganizationMembers)

// Contact Tags
router.get('/api/contact-tags', requireProductAccess('contact_management'), contactController.getContactTags)
router.post('/api/contact-tags', requireProductAccess('contact_management'), contactController.createContactTag)
router.put('/api/contact-tags/:id', requireProductAccess('contact_management'), contactController.updateContactTag)
router.delete('/api/contact-tags/:id', requireProductAccess('contact_management'), contactController.deleteContactTag)

// Contact Tag Assignments
router.get('/api/contacts/:id/tags', requireProductAccess('contact_management'), contactController.getContactTagsForContact)
router.post('/api/contacts/:id/tags', requireProductAccess('contact_management'), contactController.assignTagsToContact)

// Contact Import
router.options('/api/contacts/import/validate', async (ctx) => {
  const serverUtil = require('./server_util');
  serverUtil.configAccessControl(ctx);
  ctx.status = 200;
})
router.options('/api/contacts/import/execute', async (ctx) => {
  const serverUtil = require('./server_util');
  serverUtil.configAccessControl(ctx);
  ctx.status = 200;
})
router.get('/api/contacts/import/template', requireProductAccess('contact_management'), contactController.getImportTemplate)
router.post('/api/contacts/import/validate', requireProductAccess('contact_management'), contactController.validateImportData)
router.post('/api/contacts/import/execute', requireProductAccess('contact_management'), contactController.executeImport)

// Contact Settings
router.get('/api/contact-settings', requireProductAccess('contact_management'), contactController.getContactSettings)
router.put('/api/contact-settings', requireProductAccess('contact_management'), contactController.updateContactSettings)

// =============================================================================
// Products API - Organization Product Access
// =============================================================================

// OPTIONS handler for CORS preflight
router.options('/api/products', async (ctx) => {
  serverUtil.configAccessControl(ctx);
  ctx.status = 200;
})

// OPTIONS handler for dashboard endpoint
router.options('/api/products/dashboard', async (ctx) => {
  serverUtil.configAccessControl(ctx);
  ctx.status = 200;
})

// Route: GET /api/products/dashboard?organization_slug={slug}
// Returns products for dashboard display (includes coming_soon products)
// Coming soon products are shown to all orgs without access check
router.get('/api/products/dashboard', async (ctx) => {
  serverUtil.configAccessControl(ctx)

  const organizationSlug = ctx.query.organization_slug

  if (!organizationSlug) {
    ctx.status = 400
    ctx.body = serverUtil.failResponse('Missing required parameter: organization_slug')
    return
  }

  try {
    console.log(`📋 Fetching dashboard products for organization: ${organizationSlug}`)
    const products = await getDashboardProducts(organizationSlug)

    if (products === null) {
      ctx.status = 500
      ctx.body = serverUtil.failResponse('Failed to fetch dashboard products')
      return
    }

    ctx.body = {
      code: 0,
      msg: 'Success',
      data: products
    }
  } catch (error) {
    console.error('❌ Dashboard products API error:', error)
    ctx.status = error.status || 500
    ctx.body = serverUtil.failResponse(error.message || 'Internal server error')
  }
})

// Route: GET /api/products?organization_slug={slug}
// Returns list of products accessible to an organization (for access control)
router.get('/api/products', async (ctx) => {
  serverUtil.configAccessControl(ctx)

  const organizationSlug = ctx.query.organization_slug

  try {
    // If no organization_slug provided, return all products (admin use)
    if (!organizationSlug) {
      console.log('📋 Fetching all products (admin mode)')
      const products = await getAllProducts()

      if (products === null) {
        ctx.status = 500
        ctx.body = serverUtil.failResponse('Failed to fetch products')
        return
      }

      ctx.body = {
        code: 0,
        msg: 'Success',
        data: products
      }
      return
    }

    // Fetch products accessible to the organization
    console.log(`📋 Fetching products for organization: ${organizationSlug}`)
    const products = await getOrganizationProducts(organizationSlug)

    if (products === null) {
      ctx.status = 500
      ctx.body = serverUtil.failResponse('Failed to fetch organization products')
      return
    }

    if (products.length === 0) {
      console.warn(`⚠️  No products enabled for organization: ${organizationSlug}`)
    }

    ctx.body = {
      code: 0,
      msg: 'Success',
      data: products
    }
  } catch (error) {
    console.error('❌ Products API error:', error)
    ctx.status = error.status || 500
    ctx.body = serverUtil.failResponse(error.message || 'Internal server error')
  }
})

var port = process.env.PORT || serverConfig.config.apiPort;
app.use(router.routes()).use(router.allowedMethods());
app.listen(port, () => {
    console.log(`server is start, listening on port ${port}`);
})