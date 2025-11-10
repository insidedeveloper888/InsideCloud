const Koa = require('koa')
const Router = require('koa-router')
const axios = require('axios')
const CryptoJS = require('crypto-js')
const session = require('koa-session');
const serverConfig = require('./server_config')
const serverUtil = require('./server_util')
const { getLarkCredentials, validateOrganization, getOrganizationInfo } = require('./organization_helper')

const LJ_JSTICKET_KEY = 'lk_jsticket'
const LJ_TOKEN_KEY = 'lk_token'

//处理免登请求，返回用户的user_access_token
async function getUserAccessToken(ctx) {

    console.log("\n-------------------[接入服务端免登处理 BEGIN]-----------------------------")
    serverUtil.configAccessControl(ctx)
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
        ctx.body = serverUtil.okResponse(accessToken)
        console.log("-------------------[接入服务端免登处理 END]-----------------------------\n")
        return
    }

    let code = ctx.query["code"] || ""
    console.log("接入服务方第② 步: 获取登录预授权码code")
    if (code.length == 0) { //code不存在
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
    
    // Return organization config (without secrets)
    ctx.body = serverUtil.okResponse({
        organization_slug: orgInfo.slug,
        organization_name: orgInfo.name,
        organization_id: orgInfo.id,
        lark_app_id: larkCredentials.lark_app_id, // Safe to return app_id
        is_active: orgInfo.is_active
    })
    
    console.log("-------------------[获取组织配置 END]-----------------------------\n")
}

//注册服务端路由和处理
router.get(serverConfig.config.getUserAccessTokenPath, getUserAccessToken)
router.get(serverConfig.config.getSignParametersPath, getSignParameters)
router.get("/api/get_organization_config", getOrganizationConfig) // New endpoint
router.get(serverConfig.config.getOrganizationMembersPath, getOrganizationMembers)
router.get(serverConfig.config.getDepartmentsPath, getDepartments)
router.get(serverConfig.config.getDepartmentUsersPath, getDepartmentUsers)
router.get(serverConfig.config.getBitableTablesPath, getBitableTables)
var port = process.env.PORT || serverConfig.config.apiPort;
app.use(router.routes()).use(router.allowedMethods());
app.listen(port, () => {
    console.log(`server is start, listening on port ${port}`);
})