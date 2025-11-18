/**
 * Organization API Endpoint
 * GET /api/organization?slug=xxx
 *
 * Returns organization details by slug for realtime sync
 */

const { getOrganizationInfo } = require('../organization_helper');
const { handleCors, failResponse } = require('../../api/_utils');

module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter: slug',
    });
  }

  try {
    const org = await getOrganizationInfo(slug);

    if (!org) {
      return res.status(404).json({
        success: false,
        error: `Organization not found: ${slug}`,
      });
    }

    return res.status(200).json({
      id: org.id,
      slug: org.slug,
      name: org.name,
      is_active: org.is_active,
    });
  } catch (error) {
    console.error('❌ Error fetching organization:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
