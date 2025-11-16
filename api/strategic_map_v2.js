const { handleCors, failResponse } = require('./_utils');
const StrategicMapController = require('../server/strategic_map_controller');
const { getAuthFromCookie } = require('./_utils');
const cookie = require('cookie');

/**
 * Helper function to get user ID from authentication for audit trail
 * Since we're in organization mode only (no individual mode), we just need
 * to verify the user is authenticated and return their Lark user_id for created_by/modified_by
 */
async function getIndividualIdFromAuth(req) {
  // First priority: use our own auth cookie if available
  const auth = getAuthFromCookie(req);
  if (auth && auth.user_id) {
    console.log('✅ Using Lark user_id from auth cookie:', auth.user_id);
    return auth.user_id; // Return Lark user_id directly (no individuals table lookup needed)
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
    console.warn('⚠️ No authentication found (no auth cookie or lk_token)');
    console.warn('   Cookie header:', req.headers.cookie ? 'present' : 'MISSING');
    console.warn('   Cookies found:', Object.keys(cookies).join(', ') || 'none');
    console.warn('   Authorization header:', authHeader ? 'present' : 'MISSING');
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

    console.log('✅ Using Lark user_id from lk_token:', larkUserId);
    return larkUserId; // Return Lark user_id directly (no individuals table lookup needed)
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
