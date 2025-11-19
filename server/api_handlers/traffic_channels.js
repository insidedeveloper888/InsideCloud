const { handleCors, failResponse } = require('../../api/_utils');
const contactController = require('../contact_management_controller');

/**
 * Traffic Channels API Handler for Vercel
 * Handles all /api/traffic-channels routes
 */
module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  const method = req.method;
  const query = req.query || {};
  const body = req.body || {};
  const url = req.url || '';

  console.log('🔍 Traffic Channels API - Request:', {
    method,
    url,
    query,
    body: method === 'GET' ? '(not logged for GET)' : body
  });

  // Create mock Koa context
  const createMockCtx = () => ({
    request: {
      query,
      body,
      headers: req.headers
    },
    query,
    params: {},
    headers: req.headers,
    throw: (status, message) => {
      const error = new Error(message);
      error.status = status;
      throw error;
    }
  });

  try {
    const ctx = createMockCtx();

    // Route: GET /api/traffic-channels (list all)
    if (method === 'GET') {
      await contactController.getTrafficChannels(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    // Route: POST /api/traffic-channels (create)
    if (method === 'POST') {
      await contactController.createTrafficChannel(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    // Route: DELETE /api/traffic-channels/:id (delete)
    if (method === 'DELETE') {
      const id = query.id || url.split('/traffic-channels/')[1]?.split('?')[0];
      if (!id) {
        return res.status(400).json(failResponse('Channel ID is required'));
      }
      ctx.params = { id };
      await contactController.deleteTrafficChannel(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    return res.status(405).json(failResponse('Method not allowed'));
  } catch (error) {
    console.error('❌ Traffic Channels API error:', error);
    return res.status(error.status || 500).json(failResponse(error.message || 'Internal server error'));
  }
};
