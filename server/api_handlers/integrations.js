const { handleCors, failResponse } = require('../../api/_utils');
const integrationsController = require('../integrations_controller');

/**
 * Integrations API Handler for Vercel
 * Handles /api/integrations routes
 */
module.exports = async function handler(req, res) {
    // Handle CORS
    if (handleCors(req, res)) return;

    const method = req.method;
    const query = req.query || {};
    const body = req.body || {};
    const url = req.url || '';

    // Create mock Koa context
    const mockHeaders = {};
    const createMockCtx = () => ({
        request: {
            query,
            body,
            headers: req.headers
        },
        query,
        session: {}, // Session might need to be handled differently in Vercel
        params: {},
        headers: req.headers,
        set: (key, value) => {
            mockHeaders[key] = value;
        },
        _mockHeaders: mockHeaders,
        body: null
    });

    try {
        const ctx = createMockCtx();

        // Route: POST /api/integrations/connect
        if (method === 'POST' && url.includes('/connect')) {
            await integrationsController.connectIntegration(ctx);
            return res.status(200).json(ctx.body || {});
        }

        // Route: POST /api/integrations/disconnect
        if (method === 'POST' && url.includes('/disconnect')) {
            await integrationsController.disconnectIntegration(ctx);
            return res.status(200).json(ctx.body || {});
        }

        // Route: GET /api/integrations (list)
        if (method === 'GET') {
            await integrationsController.listIntegrations(ctx);
            return res.status(200).json(ctx.body || {});
        }

        return res.status(405).json(failResponse('Method not allowed'));
    } catch (error) {
        console.error('❌ Integrations API error:', error);
        return res.status(500).json(failResponse(error.message || 'Internal server error'));
    }
};
