const { handleCors, failResponse } = require('../../api/_utils');
const contactController = require('../contact_management_controller');

/**
 * Contacts API Handler for Vercel
 * Handles all /api/contacts routes including data-quality, import, tags
 */
module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  const method = req.method;
  const query = req.query || {};
  const body = req.body || {};
  const url = req.url || '';

  console.log('🔍 Contacts API - Request:', {
    method,
    url,
    query,
    body: method === 'GET' ? '(not logged for GET)' : body
  });

  // Create mock Koa context
  const mockHeaders = {};
  const createMockCtx = () => ({
    request: {
      query,
      body,
      headers: req.headers
    },
    query,
    params: {},
    headers: req.headers,
    set: (key, value) => {
      mockHeaders[key] = value;
    },
    _mockHeaders: mockHeaders,
    throw: (status, message) => {
      const error = new Error(message);
      error.status = status;
      throw error;
    }
  });

  try {
    const ctx = createMockCtx();

    // Route: GET /api/contacts/data-quality
    if (method === 'GET' && url.includes('/data-quality')) {
      await contactController.getDataQualityMetrics(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    // Route: GET /api/contacts/import/template
    if (method === 'GET' && url.includes('/import/template')) {
      await contactController.getImportTemplate(ctx);
      // Set CSV headers from mock context
      Object.keys(ctx._mockHeaders).forEach(key => {
        res.setHeader(key, ctx._mockHeaders[key]);
      });
      return res.status(200).send(ctx.body);
    }

    // Route: POST /api/contacts/import/validate
    if (method === 'POST' && url.includes('/import/validate')) {
      await contactController.validateImportData(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    // Route: POST /api/contacts/import/execute
    if (method === 'POST' && url.includes('/import/execute')) {
      await contactController.executeImport(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    // Route: GET /api/contacts/:id/tags
    if (method === 'GET' && url.match(/\/contacts\/[^\/]+\/tags/)) {
      const id = url.split('/contacts/')[1]?.split('/tags')[0];
      ctx.params = { id };
      await contactController.getContactTagsForContact(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    // Route: POST /api/contacts/:id/tags
    if (method === 'POST' && url.match(/\/contacts\/[^\/]+\/tags/)) {
      const id = url.split('/contacts/')[1]?.split('/tags')[0];
      ctx.params = { id };
      await contactController.assignTagsToContact(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    // Route: GET /api/contacts (list all)
    if (method === 'GET') {
      await contactController.getContacts(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    // Route: POST /api/contacts (create)
    if (method === 'POST') {
      await contactController.createContact(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    // Route: PUT /api/contacts/:id (update)
    if (method === 'PUT') {
      const id = query.id || url.split('/contacts/')[1]?.split('?')[0];
      if (!id) {
        return res.status(400).json(failResponse('Contact ID is required'));
      }
      ctx.params = { id };
      await contactController.updateContact(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    // Route: DELETE /api/contacts/:id (delete)
    if (method === 'DELETE') {
      const id = query.id || url.split('/contacts/')[1]?.split('?')[0];
      if (!id) {
        return res.status(400).json(failResponse('Contact ID is required'));
      }
      ctx.params = { id };
      await contactController.deleteContact(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    return res.status(405).json(failResponse('Method not allowed'));
  } catch (error) {
    console.error('❌ Contacts API error:', error);
    return res.status(error.status || 500).json(failResponse(error.message || 'Internal server error'));
  }
};
