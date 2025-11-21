/**
 * Tenant Info API Endpoint
 * GET /api/tenant_info
 *
 * Returns tenant/organization info including logo from Lark Tenant API
 */

const { handleCors, okResponse, failResponse } = require('../../api/_utils');
const axios = require('axios');

// Helper to get Lark credentials for an organization
async function getLarkCredentials(organizationSlug) {
  const { createClient } = require('@supabase/supabase-js');
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabase
    .from('organizations')
    .select('id, lark_app_id, lark_app_secret')
    .eq('slug', organizationSlug)
    .single();

  if (error || !data) {
    console.error('Failed to get org credentials:', error);
    return null;
  }

  return {
    organization_id: data.id,
    lark_app_id: data.lark_app_id,
    lark_app_secret: data.lark_app_secret
  };
}

module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json(failResponse('Method not allowed'));
  }

  try {
    const organizationSlug = req.query.organization_slug;

    // Get Lark credentials for this organization
    let appId, appSecret;
    if (organizationSlug) {
      const larkCredentials = await getLarkCredentials(organizationSlug);
      if (!larkCredentials) {
        return res.status(404).json(failResponse(`Organization '${organizationSlug}' not found`));
      }
      appId = larkCredentials.lark_app_id;
      appSecret = larkCredentials.lark_app_secret;
    } else {
      appId = process.env.LARK_APP_ID;
      appSecret = process.env.LARK_APP_SECRET;
    }

    // Get tenant_access_token
    const tenantTokenResponse = await axios.post(
      'https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal',
      { app_id: appId, app_secret: appSecret },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (tenantTokenResponse.data.code !== 0) {
      console.error('Failed to get tenant_access_token:', tenantTokenResponse.data);
      return res.status(500).json(failResponse('Failed to get access token'));
    }

    const tenantAccessToken = tenantTokenResponse.data.tenant_access_token;

    // Get tenant info
    const tenantResponse = await axios.get(
      'https://open.larksuite.com/open-apis/tenant/v2/tenant/query',
      {
        headers: {
          'Authorization': `Bearer ${tenantAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (tenantResponse.data.code !== 0) {
      console.error('Failed to get tenant info:', tenantResponse.data);
      return res.status(500).json(failResponse(`Failed to get tenant info: ${tenantResponse.data.msg}`));
    }

    const tenant = tenantResponse.data.data?.tenant || {};

    return res.status(200).json(okResponse({
      name: tenant.name || '',
      display_id: tenant.display_id || '',
      tenant_tag: tenant.tenant_tag || '',
      avatar: tenant.avatar || {}
    }));

  } catch (error) {
    console.error('Error getting tenant info:', error);
    return res.status(500).json(failResponse('Failed to get tenant info'));
  }
};
