import { NextResponse } from "next/server";

/**
 * Lark Authentication Health Check Endpoint
 *
 * This endpoint validates that Lark authentication is working properly.
 * Returns 200 if Lark API is accessible and credentials are valid.
 * Returns 503 if Lark authentication fails (meaning the service is down).
 *
 * Usage: Monitor this endpoint with uptime monitoring
 * URL: https://inside-cloud.vercel.app/api/health/lark
 */
export async function GET() {
    try {
        const appId = process.env.LARK_APP_ID;
        const appSecret = process.env.LARK_APP_SECRET;

        // Check if credentials are configured
        if (!appId || !appSecret) {
            console.error('[Health Check] Lark credentials not configured');
            return NextResponse.json(
                {
                    status: 'error',
                    message: 'Lark credentials not configured',
                    error: 'LARK_APP_ID or LARK_APP_SECRET environment variables are missing'
                },
                { status: 503 }
            );
        }

        // Get tenant access token from Lark
        // This validates that our App ID and Secret are valid and Lark API is accessible
        const tokenResponse = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                app_id: appId,
                app_secret: appSecret
            })
        });

        const tokenData = await tokenResponse.json();

        // Check if token request was successful
        if (tokenData.code !== 0 || !tokenData.tenant_access_token) {
            console.error('[Health Check] Failed to get Lark access token:', tokenData);
            return NextResponse.json(
                {
                    status: 'error',
                    message: 'Lark authentication failed',
                    error: tokenData.msg || 'Unable to obtain tenant access token',
                    code: tokenData.code
                },
                { status: 503 }
            );
        }

        // Success - Lark authentication is working
        console.log('[Health Check] Lark authentication successful');
        return NextResponse.json(
            {
                status: 'ok',
                message: 'Lark authentication is working',
                timestamp: new Date().toISOString(),
                service: 'inside-cloud',
                lark_connected: true
            },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                }
            }
        );

    } catch (error: any) {
        console.error('[Health Check] Exception:', error);
        return NextResponse.json(
            {
                status: 'error',
                message: 'Health check failed',
                error: error.message || 'Internal server error'
            },
            { status: 503 }
        );
    }
}
