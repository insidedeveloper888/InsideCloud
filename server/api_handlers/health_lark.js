/**
 * Health Check Handler for Lark Authentication
 *
 * This endpoint validates that Lark authentication is working properly for the "cloud" organization.
 * Used by uptime monitoring system to detect service issues.
 *
 * Returns:
 * - 200 OK if Lark API is accessible and credentials are valid
 * - 503 Service Unavailable if Lark authentication fails
 */

const axios = require('axios');
const { getLarkCredentials } = require('../organization_helper');

module.exports = async function handler(req, res) {
    try {
        console.log('[Health Check] Lark authentication check started');

        // Get Lark credentials for "cloud" organization (main Inside Cloud org)
        const larkCredentials = await getLarkCredentials('cloud');

        if (!larkCredentials || !larkCredentials.lark_app_id || !larkCredentials.lark_app_secret) {
            console.error('[Health Check] Lark credentials not configured for organization "cloud"');
            return res.status(503).json({
                status: 'error',
                message: 'Lark credentials not configured',
                error: 'Unable to retrieve credentials for organization "cloud"'
            });
        }

        // Get tenant access token from Lark API
        const tokenResponse = await axios.post(
            'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
            {
                app_id: larkCredentials.lark_app_id,
                app_secret: larkCredentials.lark_app_secret
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        const tokenData = tokenResponse.data;

        // Check if token request was successful
        if (tokenData.code !== 0 || !tokenData.tenant_access_token) {
            console.error('[Health Check] Failed to get Lark access token:', tokenData);
            return res.status(503).json({
                status: 'error',
                message: 'Lark authentication failed',
                error: tokenData.msg || 'Unable to obtain tenant access token',
                code: tokenData.code
            });
        }

        // Success - Lark authentication is working
        console.log('[Health Check] Lark authentication successful');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        return res.status(200).json({
            status: 'ok',
            message: 'Lark authentication is working',
            timestamp: new Date().toISOString(),
            service: 'inside-cloud',
            lark_connected: true
        });

    } catch (error) {
        console.error('[Health Check] Exception:', error);
        return res.status(503).json({
            status: 'error',
            message: 'Health check failed',
            error: error.message || 'Internal server error'
        });
    }
};
