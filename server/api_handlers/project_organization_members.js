const { handleCors, failResponse } = require('../../api/_utils');
const contactController = require('../contact_management_controller');

/**
 * Project Organization Members API Handler for Vercel
 * Handles /api/project-organization-members route (for project team assignment dropdowns)
 * Uses same controller as /api/organization-members but with project_management access
 */
module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  const method = req.method;
  const query = req.query || {};

  console.log('[Project Org Members API] Request:', {
    method,
    query
  });

  // Create mock Koa context
  const createMockCtx = () => ({
    request: {
      query,
      headers: req.headers
    },
    query,
    headers: req.headers,
    throw: (status, message) => {
      const error = new Error(message);
      error.status = status;
      throw error;
    }
  });

  try {
    const ctx = createMockCtx();

    // Route: GET /api/project-organization-members (list all members for assignment dropdowns)
    if (method === 'GET') {
      await contactController.getOrganizationMembers(ctx);
      return res.status(200).json(ctx.body || ctx.response?.body || {});
    }

    return res.status(405).json(failResponse('Method not allowed'));
  } catch (error) {
    console.error('[Project Org Members API] Error:', error);
    return res.status(error.status || 500).json(failResponse(error.message || 'Internal server error'));
  }
};
