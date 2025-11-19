const { handleCors, failResponse } = require('../../api/_utils');
const contactController = require('../contact_management_controller');

/**
 * Contact Settings API Handler for Vercel
 * Handles all /api/contact-settings routes
 */
module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  const method = req.method;
  const query = req.query || {};
  const body = req.body || {};

  console.log('🔍 Contact Settings API - Request:', {
    method,
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

    // Route: GET /api/contact-settings (get settings)
    if (method === 'GET') {
      await contactController.getContactSettings(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    // Route: PUT /api/contact-settings (update settings)
    if (method === 'PUT') {
      await contactController.updateContactSettings(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    return res.status(405).json(failResponse('Method not allowed'));
  } catch (error) {
    console.error('❌ Contact Settings API error:', error);
    return res.status(error.status || 500).json(failResponse(error.message || 'Internal server error'));
  }
};
