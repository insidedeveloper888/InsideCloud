const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { config, handleCors, okResponse, failResponse, getAuthFromCookie } = require('./_utils');

module.exports = async function handler(req, res) {
    // Handle CORS
    if (handleCors(req, res)) return;

    console.log("\n-------------------[获取部门用户列表 BEGIN]-----------------------------");
    console.log("接入服务方第① 步: 接收到获取部门用户列表请求");

    // Check if user is authenticated
    const accessToken = getAuthFromCookie(req);
    if (!accessToken || !accessToken.access_token) {
        console.log("用户未登录，返回错误");
        res.status(401).json(failResponse("用户未登录，请先登录"));
        return;
    }

    console.log("接入服务方第② 步: 读取部门配置文件");

    try {
        // Read department configuration file
        const configPath = path.join(process.cwd(), 'config/departments.json');
        
        if (!fs.existsSync(configPath)) {
            console.log("部门配置文件不存在");
            res.status(404).json(failResponse("部门配置文件不存在，请先配置部门ID"));
            return;
        }

        const departmentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const departments = departmentConfig.departments || [];

        if (departments.length === 0) {
            console.log("未配置任何部门");
            res.status(400).json(failResponse("未配置任何部门，请在config/departments.json中添加部门ID"));
            return;
        }

        console.log("接入服务方第③ 步: 获取tenant_access_token用于调用用户API");

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
        console.log("接入服务方第④ 步: 调用Lark API获取各部门用户列表");

        const allDepartmentUsers = [];

        // Get user list for each configured department
        for (const department of departments) {
            console.log(`正在获取部门 ${department.name} (${department.id}) 的用户列表`);

            // Get query parameters
            const pageSize = req.query.page_size || 50;
            const pageToken = req.query.page_token || '';

            // Build query parameters
            const queryParams = new URLSearchParams({
                user_id_type: 'user_id',
                department_id_type: 'open_department_id',
                department_id: department.id,
                page_size: pageSize
            });

            if (pageToken) {
                queryParams.append('page_token', pageToken);
            }

            // Call Lark users API
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
                
                // Provide more specific error messages based on error code
                if (usersResponse.data.code === 403) {
                    errorMsg = "权限不足，请检查应用权限配置";
                } else if (usersResponse.data.code === 429) {
                    errorMsg = "请求过于频繁，请稍后重试";
                }
                
                res.status(500).json(failResponse(errorMsg));
                return;
            }

            // Process user data
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

        res.status(200).json(okResponse(allDepartmentUsers));

    } catch (error) {
        console.error("获取部门用户列表时发生错误:", error);
        res.status(500).json(failResponse("服务器内部错误"));
    }
}