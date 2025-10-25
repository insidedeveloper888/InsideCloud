const axios = require('axios');
const { handleCors, okResponse, failResponse, getAuthFromCookie } = require('./_utils');

module.exports = async function handler(req, res) {
    // Handle CORS
    if (handleCors(req, res)) return;

    console.log("\n-------------------[获取多维表格表列表 BEGIN]-----------------------------");
    console.log("接入服务方第① 步: 接收到获取多维表格表列表请求");

    // Check if user is authenticated
    const accessToken = getAuthFromCookie(req);
    if (!accessToken || !accessToken.access_token) {
        console.log("用户未登录，返回错误");
        res.status(401).json(failResponse("用户未登录，请先登录"));
        return;
    }

    try {
        const appToken = req.query.app_token || "J8tAbd9oEaxuLZsQbLwlNuHdgoc";
        console.log(`接入服务方第② 步: 使用AppToken ${appToken} 请求多维表格表列表`);

        const userAccessToken = accessToken.access_token;
        console.log("接入服务方第③ 步: 使用用户访问令牌请求Lark Base API");

        // Call Lark Base API to get table list
        const response = await axios.get(`https://open.larksuite.com/open-apis/bitable/v1/apps/${appToken}/tables`, {
            headers: {
                'Authorization': `Bearer ${userAccessToken}`,
                'Content-Type': 'application/json'
            },
            params: {
                page_size: 100 // Get up to 100 tables
            }
        });

        console.log("接入服务方第④ 步: 收到Lark Base API响应");

        if (response.data.code !== 0) {
            console.error("Lark Base API返回错误:", response.data);
            res.status(500).json(failResponse(`获取表列表失败: ${response.data.msg}`));
            return;
        }

        const tables = response.data.data.items || [];
        console.log(`接入服务方第⑤ 步: 成功获取 ${tables.length} 个表`);

        // Print table information
        tables.forEach((table, index) => {
            console.log(`表 ${index + 1}: ${table.name} (ID: ${table.table_id}, 主表: ${table.is_primary ? '是' : '否'})`);
        });

        console.log("-------------------[获取多维表格表列表 END]-----------------------------\n");

        res.status(200).json(okResponse({
            tables: tables,
            total: response.data.data.total || tables.length,
            app_token: appToken
        }));

    } catch (error) {
        console.error("获取多维表格表列表时发生错误:", error.response?.data || error.message);
        if (error.response?.status === 403) {
            res.status(403).json(failResponse("权限不足，请确保应用有访问该多维表格的权限"));
        } else if (error.response?.status === 404) {
            res.status(404).json(failResponse("多维表格不存在或AppToken无效"));
        } else {
            res.status(500).json(failResponse("服务器内部错误"));
        }
    }
}