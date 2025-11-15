/**
 * Organization API Endpoint
 * GET /api/organization?slug=xxx
 *
 * Returns organization details by slug for realtime sync
 */

const { getOrganizationInfo } = require('../server/organization_helper');
const { configAccessControl } = require('../server/server_util');

module.exports = async (ctx) => {
  // Handle CORS
  configAccessControl(ctx);

  // Handle OPTIONS preflight
  if (ctx.method === 'OPTIONS') {
    ctx.status = 200;
    return;
  }

  const { slug } = ctx.query;

  if (!slug) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      error: 'Missing required parameter: slug',
    };
    return;
  }

  try {
    const org = await getOrganizationInfo(slug);

    if (!org) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        error: `Organization not found: ${slug}`,
      };
      return;
    }

    ctx.status = 200;
    ctx.body = {
      id: org.id,
      slug: org.slug,
      name: org.name,
      is_active: org.is_active,
    };
  } catch (error) {
    console.error('Error fetching organization:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Internal server error',
    };
  }
};
