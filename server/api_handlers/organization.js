/**
 * Organization API Endpoint
 * GET /api/organization?slug=xxx
 *
 * Returns organization details by slug for realtime sync
 *
 * This handler works with Koa context (ctx), not Express req/res
 */

const { getOrganizationInfo } = require('../organization_helper');
const serverUtil = require('../server_util');

module.exports = async function handler(ctx) {
  // Handle CORS using Koa's context
  serverUtil.configAccessControl(ctx);

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
    console.error('❌ Error fetching organization:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    };
  }
};
