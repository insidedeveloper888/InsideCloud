const { handleCors, failResponse } = require('../../api/_utils');
const { getOrganizationProducts, getAllProducts } = require('../product_helper');

/**
 * Products API Handler for Vercel
 * Handles GET /api/products - returns list of products accessible to an organization
 */
module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  const method = req.method;
  const query = req.query || {};

  console.log('🔍 Products API - Request:', {
    method,
    query
  });

  try {
    // Route: GET /api/products?organization_slug={slug}
    if (method === 'GET') {
      const { organization_slug } = query;

      // If no organization_slug provided, return all products (admin use)
      if (!organization_slug) {
        console.log('📋 Fetching all products (admin mode)');
        const products = await getAllProducts();

        if (products === null) {
          return res.status(500).json(failResponse('Failed to fetch products'));
        }

        return res.status(200).json({
          code: 0,
          msg: 'Success',
          data: products
        });
      }

      // Fetch products accessible to the organization
      console.log(`📋 Fetching products for organization: ${organization_slug}`);
      const products = await getOrganizationProducts(organization_slug);

      if (products === null) {
        return res.status(500).json(failResponse('Failed to fetch organization products'));
      }

      if (products.length === 0) {
        console.warn(`⚠️  No products enabled for organization: ${organization_slug}`);
      }

      return res.status(200).json({
        code: 0,
        msg: 'Success',
        data: products
      });
    }

    return res.status(405).json(failResponse('Method not allowed'));
  } catch (error) {
    console.error('❌ Products API error:', error);
    return res.status(error.status || 500).json(failResponse(error.message || 'Internal server error'));
  }
};
