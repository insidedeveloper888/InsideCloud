const { handleCors, failResponse } = require('./_utils');
const StrategicMapController = require('../server/strategic_map_controller');
const { getAuthFromCookie } = require('./_utils');
const { supabase } = require('./supabase_helper');
const cookie = require('cookie');

/**
 * Helper function to get individual_id from authentication
 * Reuses the same logic as the v1 API for consistency
 */
async function getIndividualIdFromAuth(req) {
  // Preferred path: use our own auth cookie if available
  const auth = getAuthFromCookie(req);
  if (auth && auth.user_id) {
    try {
      const { data: individual, error: individualError } = await supabase
        .from('individuals')
        .select('id')
        .eq('user_id', auth.user_id)
        .maybeSingle();

      if (individualError) {
        console.error('❌ Error querying individuals via auth_token:', individualError);
      }

      if (individual && individual.id) {
        return individual.id;
      }
    } catch (e) {
      console.error('❌ Error resolving individual via auth_token:', e);
    }
  }

  // Try lk_token from cookie or Authorization header
  let cookies = {};
  if (req.headers.cookie) {
    cookies = cookie.parse(req.headers.cookie);
  }

  const authHeader = req.headers.authorization || req.headers.Authorization || req.headers['authorization'];
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const lkToken = bearerToken || cookies.lk_token || cookies['lk_token'];

  if (!lkToken) {
    console.warn('⚠️ No lk_token found for authentication');
    return null;
  }

  try {
    const axios = require('axios');

    const userInfoRes = await axios.get("https://open.larksuite.com/open-apis/authen/v1/user_info", {
      headers: {
        "Authorization": `Bearer ${lkToken}`,
        "Content-Type": "application/json"
      },
      timeout: 10000
    });

    if (!userInfoRes.data || userInfoRes.data.code !== 0) {
      console.error('❌ Lark API error:', userInfoRes.data);
      return null;
    }

    const userInfo = userInfoRes.data.data;
    const larkUserId = userInfo.user_id;

    if (!larkUserId) {
      console.warn('⚠️ No user_id in Lark API response');
      return null;
    }

    // Use RPC function to get auth user ID
    const { data: authUserId, error: rpcError } = await supabase.rpc('get_auth_user_by_lark', {
      p_lark_user_id: larkUserId,
      p_email: null
    });

    if (rpcError || !authUserId) {
      console.error('❌ RPC error or no auth user found:', rpcError);
      return null;
    }

    const { data: individual, error: individualError } = await supabase
      .from('individuals')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle();

    if (individualError) {
      console.error('❌ Error querying individuals:', individualError);
      return null;
    }

    if (individual) {
      return individual.id;
    } else {
      console.warn('⚠️ No individual record found for user_id:', authUserId);
      return null;
    }
  } catch (e) {
    if (e.response) {
      console.error('❌ Lark API HTTP error:', e.response.status, e.response.data);
    } else if (e.request) {
      console.error('❌ Lark API request failed (no response):', e.message);
    } else {
      console.error('❌ Error getting user individual_id:', e.message);
    }
    return null;
  }
}

/**
 * Strategic Map v2 API Handler
 * Handles GET, POST, PUT, DELETE for strategic map items with auto-cascading
 */
module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  const method = req.method;
  const query = req.query || {};
  const body = req.body || {};

  console.log('🔍 Strategic Map v2 API - Request:', {
    method,
    query,
    body: method === 'GET' ? '(not logged for GET)' : body
  });

  // Initialize controller
  const controller = new StrategicMapController(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // GET: Fetch items
    if (method === 'GET') {
      const { organization_slug, timeframe } = query;

      if (!organization_slug) {
        return res.status(400).json(failResponse('organization_slug is required'));
      }

      console.log('📥 Fetching items for:', { organization_slug, timeframe });
      const result = await controller.getItems(organization_slug, timeframe);
      return res.status(200).json(result);
    }

    // POST: Create item
    if (method === 'POST') {
      const { organization_slug, ...itemData } = body;

      if (!organization_slug) {
        return res.status(400).json(failResponse('organization_slug is required'));
      }

      // Get individual_id from auth
      const individualId = await getIndividualIdFromAuth(req);

      if (!individualId) {
        return res.status(401).json(failResponse('Authentication required'));
      }

      console.log('📝 Creating item:', { organization_slug, itemData, individualId });
      const result = await controller.createItem(organization_slug, itemData, individualId);
      return res.status(200).json(result);
    }

    // PUT: Update item
    if (method === 'PUT') {
      const { id } = query;
      const { organization_slug, ...updates } = body;

      if (!id || !organization_slug) {
        return res.status(400).json(failResponse('id and organization_slug are required'));
      }

      const individualId = await getIndividualIdFromAuth(req);

      if (!individualId) {
        return res.status(401).json(failResponse('Authentication required'));
      }

      console.log('✏️ Updating item:', { id, organization_slug, updates, individualId });
      const result = await controller.updateItem(id, organization_slug, updates, individualId);
      return res.status(200).json(result);
    }

    // DELETE: Delete item
    if (method === 'DELETE') {
      const { id, organization_slug } = query;

      if (!id || !organization_slug) {
        return res.status(400).json(failResponse('id and organization_slug are required'));
      }

      const individualId = await getIndividualIdFromAuth(req);

      if (!individualId) {
        return res.status(401).json(failResponse('Authentication required'));
      }

      console.log('🗑️ Deleting item:', { id, organization_slug, individualId });
      const result = await controller.deleteItem(id, organization_slug, individualId);
      return res.status(200).json(result);
    }

    return res.status(405).json(failResponse('Method not allowed'));
  } catch (error) {
    console.error('❌ Strategic Map v2 API error:', error);
    return res.status(500).json(failResponse(error.message || 'Internal server error'));
  }
};
