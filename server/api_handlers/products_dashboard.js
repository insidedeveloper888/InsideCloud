const { handleCors, failResponse } = require('../../api/_utils');
const { getDashboardProducts } = require('../product_helper');

/**
 * Products Dashboard API Handler for Vercel
 * Handles GET /api/products/dashboard - returns products for dashboard display
 * Includes coming_soon products (shown to all orgs without access check)
 */
module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  const method = req.method;
  const query = req.query || {};

  console.log('🔍 Products Dashboard API - Request:', {
    method,
    query
  });

  try {
    // Route: GET /api/products/dashboard?organization_slug={slug}
    if (method === 'GET') {
      const { organization_slug } = query;

      if (!organization_slug) {
        return res.status(400).json(failResponse('Missing required parameter: organization_slug'));
      }

      // Fetch products for dashboard (includes coming_soon)
      console.log(`📋 Fetching dashboard products for organization: ${organization_slug}`);
      const products = await getDashboardProducts(organization_slug);

      if (products === null) {
        return res.status(500).json(failResponse('Failed to fetch dashboard products'));
      }

      return res.status(200).json({
        code: 0,
        msg: 'Success',
        data: products
      });
    }

    return res.status(405).json(failResponse('Method not allowed'));
  } catch (error) {
    console.error('❌ Products Dashboard API error:', error);
    return res.status(error.status || 500).json(failResponse(error.message || 'Internal server error'));
  }
};
