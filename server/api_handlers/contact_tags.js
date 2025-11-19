const { handleCors, failResponse } = require('../../api/_utils');
const contactController = require('../contact_management_controller');

/**
 * Contact Tags API Handler for Vercel
 * Handles all /api/contact-tags routes
 */
module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  const method = req.method;
  const query = req.query || {};
  const body = req.body || {};
  const url = req.url || '';

  console.log('🔍 Contact Tags API - Request:', {
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

    // Route: GET /api/contact-tags (list all)
    if (method === 'GET') {
      await contactController.getContactTags(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    // Route: POST /api/contact-tags (create)
    if (method === 'POST') {
      await contactController.createContactTag(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    // Route: PUT /api/contact-tags/:id (update)
    if (method === 'PUT') {
      const id = query.id || url.split('/contact-tags/')[1]?.split('?')[0];
      if (!id) {
        return res.status(400).json(failResponse('Tag ID is required'));
      }
      ctx.params = { id };
      await contactController.updateContactTag(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    // Route: DELETE /api/contact-tags/:id (delete)
    if (method === 'DELETE') {
      const id = query.id || url.split('/contact-tags/')[1]?.split('?')[0];
      if (!id) {
        return res.status(400).json(failResponse('Tag ID is required'));
      }
      ctx.params = { id };
      await contactController.deleteContactTag(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    return res.status(405).json(failResponse('Method not allowed'));
  } catch (error) {
    console.error('❌ Contact Tags API error:', error);
    return res.status(error.status || 500).json(failResponse(error.message || 'Internal server error'));
  }
};
