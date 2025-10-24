const axios = require('axios');
const { config, handleCors, okResponse, failResponse, getAuthFromCookie } = require('./_utils');

export default async function handler(req, res) {
    // Handle CORS
    if (handleCors(req, res)) return;

    console.log("\n-------------------[获取部门列表 BEGIN]-----------------------------");
    console.log("接入服务方第① 步: 接收到获取部门列表请求");

    // Check if user is authenticated
    const accessToken = getAuthFromCookie(req);
    if (!accessToken || !accessToken.access_token) {
        console.log("用户未登录，返回错误");
        res.status(401).json(failResponse("用户未登录，请先登录"));
        return;
    }

    console.log("接入服务方第② 步: 获取tenant_access_token用于调用部门API");

    try {
        // Get tenant_access_token
        const tenantTokenResponse = await axios.post(
            'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
            {
                app_id: config.appId,
                app_secret: config.appSecret
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (tenantTokenResponse.data.code !== 0) {
            console.log("获取tenant_access_token失败:", tenantTokenResponse.data);
            res.status(500).json(failResponse("获取访问令牌失败"));
            return;
        }

        const tenantAccessToken = tenantTokenResponse.data.tenant_access_token;
        console.log("接入服务方第③ 步: 调用Lark API获取部门列表");

        // Get query parameters
        const pageSize = req.query.page_size || 50;
        const pageToken = req.query.page_token || '';
        const parentDepartmentId = req.query.parent_department_id || '';
        const fetchChild = req.query.fetch_child || false;

        // Build query parameters
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

        // Call Lark departments API
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
            
            // Provide more specific error messages based on error code
            if (departmentsResponse.data.code === 403) {
                errorMsg = "权限不足，请检查应用权限配置";
            } else if (departmentsResponse.data.code === 429) {
                errorMsg = "请求过于频繁，请稍后重试";
            }
            
            res.status(500).json(failResponse(errorMsg));
            return;
        }

        console.log("接入服务方第④ 步: 处理部门数据并返回");

        // Process department data
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

        res.status(200).json(okResponse(processedDepartments));

    } catch (error) {
        console.error("获取部门列表时发生错误:", error);
        res.status(500).json(failResponse("服务器内部错误"));
    }
}