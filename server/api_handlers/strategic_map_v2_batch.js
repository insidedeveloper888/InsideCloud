const { handleCors, failResponse } = require('../../api/_utils');
const StrategicMapController = require('../strategic_map_controller');
const { getAuthFromCookie } = require('../../api/_utils');
const { supabase } = require('../../api/_supabase_helper');
const cookie = require('cookie');

/**
 * Helper function to get individual_id from authentication
 */
async function getIndividualIdFromAuth(req) {
  const auth = getAuthFromCookie(req);
  if (auth && auth.user_id) {
    try {
      const { data: individual } = await supabase
        .from('individuals')
        .select('id')
        .eq('user_id', auth.user_id)
        .maybeSingle();

      if (individual && individual.id) {
        return individual.id;
      }
    } catch (e) {
      console.error('❌ Error resolving individual:', e);
    }
  }

  let cookies = {};
  if (req.headers.cookie) {
    cookies = cookie.parse(req.headers.cookie);
  }

  const authHeader = req.headers.authorization || req.headers.Authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const lkToken = bearerToken || cookies.lk_token;

  if (!lkToken) return null;

  try {
    const axios = require('axios');
    const userInfoRes = await axios.get("https://open.larksuite.com/open-apis/authen/v1/user_info", {
      headers: { "Authorization": `Bearer ${lkToken}` },
      timeout: 10000
    });

    if (userInfoRes.data?.code !== 0) return null;

    const larkUserId = userInfoRes.data.data.user_id;
    if (!larkUserId) return null;

    const { data: authUserId } = await supabase.rpc('get_auth_user_by_lark', {
      p_lark_user_id: larkUserId,
      p_email: null
    });

    if (!authUserId) return null;

    const { data: individual } = await supabase
      .from('individuals')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle();

    return individual?.id || null;
  } catch (e) {
    console.error('❌ Auth error:', e.message);
    return null;
  }
}

/**
 * Strategic Map v2 Batch API Handler
 * Handles batch upsert for data migration from localStorage
 */
module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  const method = req.method;

  if (method !== 'POST') {
    return res.status(405).json(failResponse('Method not allowed. Use POST for batch operations.'));
  }

  const { organization_slug, items } = req.body || {};

  console.log('🔍 Strategic Map v2 Batch API - Request:', {
    organization_slug,
    itemCount: items?.length || 0
  });

  if (!organization_slug) {
    return res.status(400).json(failResponse('organization_slug is required'));
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json(failResponse('items array is required and must not be empty'));
  }

  // Get individual_id from auth
  const individualId = await getIndividualIdFromAuth(req);

  if (!individualId) {
    return res.status(401).json(failResponse('Authentication required'));
  }

  // Initialize controller
  const controller = new StrategicMapController(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📦 Batch upserting', items.length, 'items for', organization_slug);
    const result = await controller.batchUpsert(organization_slug, items, individualId);

    console.log('✅ Batch upsert complete:', {
      created: result.data.created,
      failed: result.data.failed
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Strategic Map v2 Batch API error:', error);
    return res.status(500).json(failResponse(error.message || 'Internal server error'));
  }
};
