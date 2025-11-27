const { handleCors, failResponse } = require('../../api/_utils');
const contactController = require('../contact_management_controller');

/**
 * Contact Types API Handler for Vercel
 * Handles all /api/contact-types routes
 *
 * Endpoints:
 * - GET /api/contact-types - List all contact types for organization
 * - POST /api/contact-types - Create new custom contact type
 * - PUT /api/contact-types/:id - Update contact type
 * - DELETE /api/contact-types/:id - Delete contact type (if not system and not in use)
 */
module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  const method = req.method;
  const query = req.query || {};
  const body = req.body || {};
  const url = req.url || '';

  console.log('🔍 Contact Types API - Request:', {
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

    // Route: GET /api/contact-types (list all)
    if (method === 'GET') {
      await contactController.getContactTypes(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    // Route: POST /api/contact-types (create)
    if (method === 'POST') {
      await contactController.createContactType(ctx);
      return res.status(ctx.status || 200).json(ctx.body || ctx.response?.body || {});
    }

    // Route: PUT /api/contact-types/:id (update)
    if (method === 'PUT') {
      const id = query.id || url.split('/contact-types/')[1]?.split('?')[0];
      if (!id) {
        return res.status(400).json(failResponse('Contact Type ID is required'));
      }
      ctx.params = { id };
      await contactController.updateContactType(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    // Route: DELETE /api/contact-types/:id (delete)
    if (method === 'DELETE') {
      const id = query.id || url.split('/contact-types/')[1]?.split('?')[0];
      if (!id) {
        return res.status(400).json(failResponse('Contact Type ID is required'));
      }
      ctx.params = { id };
      await contactController.deleteContactType(ctx);
      return res.status(ctx.status || 200).json(ctx.body || ctx.response?.body || {});
    }

    return res.status(405).json(failResponse('Method not allowed'));
  } catch (error) {
    console.error('❌ Contact Types API error:', error);
    return res.status(error.status || 500).json(failResponse(error.message || 'Internal server error'));
  }
};
