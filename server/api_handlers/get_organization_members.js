const axios = require('axios');
const { config, handleCors, okResponse, failResponse, getAuthFromCookie } = require('../../api/_utils');

module.exports = async function handler(req, res) {
    // Handle CORS
    if (handleCors(req, res)) return;

    console.log("\n-------------------[获取组织成员 BEGIN]-----------------------------");
    console.log(`接入服务方第① 步: 接收到获取组织成员请求`);

    // Check if user is authenticated
    const accessToken = getAuthFromCookie(req);
    if (!accessToken || !accessToken.access_token) {
        res.status(401).json(failResponse("用户未登录，请先登录"));
        return;
    }

    try {
        console.log("接入服务方第② 步: 获取tenant_access_token用于调用组织API");
        
        // Get tenant_access_token
        const internalRes = await axios.post("https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal", {
            "app_id": config.appId,
            "app_secret": config.appSecret
        }, { headers: { "Content-Type": "application/json" } });

        if (!internalRes.data || internalRes.data.code != 0) {
            console.error("获取tenant_access_token失败:", internalRes.data);
            res.status(500).json(failResponse(`获取tenant_access_token失败: ${internalRes.data?.msg || '未知错误'}`));
            return;
        }

        const tenant_access_token = internalRes.data.tenant_access_token;

        console.log("接入服务方第③ 步: 调用Lark API获取组织成员列表");
        
        // Get pagination parameters
        const pageSize = Math.min(parseInt(req.query.page_size) || 50, 100); // Max 100
        const pageToken = req.query.page_token || '';

        // Call Lark API to get user list
        const usersRes = await axios.get("https://open.larksuite.com/open-apis/contact/v3/users", {
            headers: {
                "Authorization": "Bearer " + tenant_access_token,
                "Content-Type": "application/json"
            },
            params: {
                page_size: pageSize,
                page_token: pageToken,
                user_id_type: "user_id"
            }
        });

        if (!usersRes.data || usersRes.data.code != 0) {
            console.error("获取用户列表失败:", usersRes.data);
            res.status(500).json(failResponse(`获取用户列表失败: ${usersRes.data?.msg || '未知错误'}`));
            return;
        }

        console.log("接入服务方第④ 步: 处理用户数据并返回");
        const responseData = usersRes.data.data || {};
        const users = responseData.items || [];
        
        // Process user data with more fields
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
        }));

        // Return data structure expected by frontend
        res.status(200).json(okResponse(processedUsers));
        
        console.log(`成功获取 ${processedUsers.length} 个组织成员`);
        console.log("-------------------[获取组织成员 END]-----------------------------\n");

    } catch (error) {
        console.error("调用Lark API出错:", error.response?.data || error.message);
        
        // Return more specific error messages based on error type
        let errorMessage = "获取组织成员失败";
        if (error.response?.status === 403) {
            errorMessage = "权限不足，请检查应用权限配置";
        } else if (error.response?.status === 429) {
            errorMessage = "请求过于频繁，请稍后重试";
        } else if (error.response?.data?.msg) {
            errorMessage = error.response.data.msg;
        }
        
        res.status(500).json(failResponse(errorMessage));
    }
}