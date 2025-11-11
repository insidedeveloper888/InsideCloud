const { handleCors, okResponse, failResponse } = require('./_utils');
const { supabase } = require('./supabase_helper');
const cookie = require('cookie');

/**
 * Helper function to get individual_id from lk_token cookie
 * The lk_token is a Lark access token (e.g., "u-6Rri7rfn..."), not JSON
 * We need to call Lark API to get user info, then look up in Supabase
 */
async function getIndividualIdFromCookie(req) {
  // Try multiple ways to get cookies
  let cookies = {};
  if (req.headers.cookie) {
    cookies = cookie.parse(req.headers.cookie);
  }
  
  // Also check if cookie is in a different format
  const cookieHeader = req.headers.cookie || req.headers.Cookie || '';
  console.log('🔍 Cookie header:', cookieHeader.substring(0, 100) + '...');
  console.log('🔍 Parsed cookies:', Object.keys(cookies));
  
  const lkToken = cookies.lk_token || cookies['lk_token'];

  if (!lkToken) {
    console.warn('⚠️ No lk_token cookie found');
    console.warn('⚠️ Available cookies:', Object.keys(cookies));
    return null;
  }

  try {
    // lk_token is a Lark access token, not JSON
    // Call Lark API to get user info
    const axios = require('axios');
    
    console.log('🔍 Calling Lark API with token (first 10 chars):', lkToken.substring(0, 10) + '...');
    
    const userInfoRes = await axios.get("https://open.larksuite.com/open-apis/authen/v1/user_info", {
      headers: {
        "Authorization": `Bearer ${lkToken}`,
        "Content-Type": "application/json"
      },
      timeout: 10000 // 10 second timeout
    });

    if (!userInfoRes.data || userInfoRes.data.code !== 0) {
      console.error('❌ Lark API error:', userInfoRes.data);
      return null;
    }

    const userInfo = userInfoRes.data.data;
    const larkUserId = userInfo.user_id;

    if (!larkUserId) {
      console.warn('⚠️ No user_id in Lark API response:', userInfo);
      return null;
    }

    console.log('🔍 Got lark_user_id from Lark API:', larkUserId);

    // Use RPC function to get auth user ID
    const { data: authUserId, error: rpcError } = await supabase.rpc('get_auth_user_by_lark', {
      p_lark_user_id: larkUserId,
      p_email: null
    });

    if (rpcError) {
      console.error('❌ RPC error:', rpcError);
      return null;
    }

    console.log('🔍 Auth user ID:', authUserId);

    if (!authUserId) {
      console.warn('⚠️ No auth user found for lark_user_id:', larkUserId);
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

    console.log('🔍 Individual found:', individual);

    if (individual) {
      return individual.id;
    } else {
      console.warn('⚠️ No individual record found for user_id:', authUserId);
      return null;
    }
  } catch (e) {
    // Handle axios errors specifically
    if (e.response) {
      console.error('❌ Lark API HTTP error:', e.response.status, e.response.data);
    } else if (e.request) {
      console.error('❌ Lark API request failed (no response):', e.message);
    } else {
      console.error('❌ Error getting user individual_id:', e.message);
    }
    console.error('Error stack:', e.stack);
    return null;
  }
}

/**
 * Get strategic map items for an organization
 * Supports both company and individual scope
 */
module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  const method = req.method;
  // Support both Express (req.query) and Koa (req.query from ctx.query)
  const queryParams = req.query || {};
  
  // Parse body for POST requests
  let bodyParams = {};
  if (method === 'POST') {
    try {
      if (req.body === undefined || req.body === null) {
        console.warn('⚠️ req.body is undefined/null, using empty object');
        bodyParams = {};
      } else if (typeof req.body === 'string') {
        bodyParams = JSON.parse(req.body);
      } else if (req.body && typeof req.body === 'object') {
        bodyParams = req.body;
      } else {
        console.warn('⚠️ req.body has unexpected type:', typeof req.body, req.body);
        bodyParams = {};
      }
    } catch (e) {
      console.error('❌ Error parsing body:', e);
      bodyParams = {};
    }
  }
  
  // Log for debugging
  console.log('🔍 API Handler - Request received:');
  console.log('  - Method:', method);
  console.log('  - Query params:', JSON.stringify(queryParams, null, 2));
  console.log('  - Body params:', JSON.stringify(bodyParams, null, 2));
  console.log('  - Raw body:', req.body);
  console.log('  - Body type:', typeof req.body);
  console.log('  - Body is null:', req.body === null);
  console.log('  - Body is undefined:', req.body === undefined);
  console.log('  - Body keys:', bodyParams ? Object.keys(bodyParams) : 'empty');
  console.log('  - organization_slug in bodyParams:', bodyParams.organization_slug);
  
  // For GET, use queryParams; for POST, use bodyParams (with queryParams as fallback)
  const mergedParams = method === 'GET' ? queryParams : { ...queryParams, ...bodyParams };
  console.log('  - Merged params:', JSON.stringify(mergedParams, null, 2));
  
  const { organization_slug, scope = 'company', timeframe = 'yearly', timeframe_value, individual_id } = mergedParams;

  console.log('🔍 Extracted params:');
  console.log('  - organization_slug:', organization_slug);
  console.log('  - scope:', scope);
  console.log('  - timeframe:', timeframe);
  console.log('  - timeframe_value:', timeframe_value);

  if (!organization_slug) {
    console.error('❌ Missing organization_slug:', { 
      queryParams, 
      bodyParams, 
      method, 
      rawBody: req.body,
      extracted: { organization_slug, scope, timeframe, timeframe_value }
    });
    res.status(400).json(failResponse('organization_slug is required'));
    return;
  }

  try {
    // Get organization ID
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (orgError || !org) {
      res.status(404).json(failResponse('Organization not found'));
      return;
    }

    if (method === 'GET') {
      // Get product_id for strategic_map
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('key', 'strategic_map')
        .single();

      if (productError || !product) {
        console.error('❌ Strategic map product not found:', productError);
        res.status(500).json(failResponse('Strategic map product not configured'));
        return;
      }

      // Get items
      let query = supabase
        .from('strategic_map_items')
        .select('*')
        .eq('organization_id', org.id)
        .eq('product_id', product.id)
        .eq('scope', scope)
        .eq('timeframe', timeframe);

      // For yearly timeframe, match any date within the year range
      // For monthly, match any date within that month
      // For weekly, match exact timeframe_value (start of week)
      if (timeframe_value) {
        if (timeframe === 'yearly') {
          // Extract year from timeframe_value (format: YYYY-MM-DD)
          const year = new Date(timeframe_value).getFullYear();
          // Match any date in that year
          query = query.gte('timeframe_value', `${year}-01-01`)
                       .lt('timeframe_value', `${year + 1}-01-01`);
        } else if (timeframe === 'monthly') {
          // Extract year-month from timeframe_value (format: YYYY-MM-DD)
          const date = new Date(timeframe_value);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const nextMonth = month === 12 ? 1 : month + 1;
          const nextYear = month === 12 ? year + 1 : year;
          // Match any date in that month
          query = query.gte('timeframe_value', `${year}-${String(month).padStart(2, '0')}-01`)
                       .lt('timeframe_value', `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`);
        } else {
          // Weekly and daily: match exact timeframe_value
          query = query.eq('timeframe_value', timeframe_value);
        }
      }

      if (scope === 'individual') {
        // Get individual_id from cookie
        const foundIndividualId = await getIndividualIdFromCookie(req);
        const finalIndividualId = foundIndividualId || individual_id;
        
        if (finalIndividualId) {
          query = query.eq('individual_id', finalIndividualId);
        } else {
          console.warn('⚠️ Individual scope but no individual_id found');
        }
      } else if (scope === 'company') {
        query = query.is('individual_id', null);
      }

      const { data, error } = await query
        .order('row_index', { ascending: true })
        .order('column_index', { ascending: true })
        .order('item_index', { ascending: true });

      if (error) {
        console.error('Error fetching strategic map items:', error);
        res.status(500).json(failResponse('Failed to fetch strategic map items'));
        return;
      }

      res.status(200).json(okResponse(data || []));
      return;
    }

    if (method === 'POST') {
      // Create or update item
      const { row_index, column_index, cell_value, cell_type, status, individual_id: reqIndividualId, item_index = 0, item_id } = bodyParams;

      console.log('📝 POST request body:', { row_index, column_index, cell_value, cell_type, status, scope, timeframe, timeframe_value: bodyParams.timeframe_value });

      if (row_index === undefined || column_index === undefined) {
        console.error('❌ Missing required fields:', { row_index, column_index });
        res.status(400).json(failResponse('row_index and column_index are required'));
        return;
      }

      // Validate row_index and column_index are numbers
      if (typeof row_index !== 'number' || typeof column_index !== 'number') {
        console.error('❌ Invalid row_index or column_index type:', { row_index, column_index, rowType: typeof row_index, colType: typeof column_index });
        res.status(400).json(failResponse('row_index and column_index must be numbers'));
        return;
      }

      // Get product_id for strategic_map
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('key', 'strategic_map')
        .single();

      if (productError || !product) {
        console.error('❌ Strategic map product not found:', productError);
        res.status(500).json(failResponse('Strategic map product not configured'));
        return;
      }

      // Get current user's individual_id if not provided
      let finalIndividualId = null;
      if (scope === 'individual') {
        // For individual scope, get from cookie
        const foundIndividualId = await getIndividualIdFromCookie(req);
        finalIndividualId = foundIndividualId || reqIndividualId;

        if (!finalIndividualId) {
          console.error('❌ Individual scope requires individual_id but none found');
          const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
          console.error('Debug info:', {
            hasLkToken: !!cookies.lk_token,
            reqIndividualId,
            cookieKeys: Object.keys(cookies),
          });
          res.status(400).json(failResponse('无法确定用户身份，请重新登录 (Unable to determine user identity, please login again)'));
          return;
        }
      } else {
        // Company scope: ensure individual_id is null
        finalIndividualId = null;
      }

      const timeframeValue = bodyParams.timeframe_value || timeframe_value;
      if (!timeframeValue) {
        console.error('❌ Missing timeframe_value');
        res.status(400).json(failResponse('timeframe_value is required'));
        return;
      }

      const timeframeDate = new Date(timeframeValue);
      if (isNaN(timeframeDate.getTime())) {
        console.error('❌ Invalid timeframe_value:', timeframeValue);
        res.status(400).json(failResponse('Invalid timeframe_value format'));
        return;
      }

      // Upsert item - use the unique index for conflict resolution
      const timeframeValueStr = timeframeDate.toISOString().split('T')[0];
      const itemIndex = parseInt(item_index) || 0;
      
      const itemData = {
        organization_id: org.id,
        product_id: product.id,
        individual_id: finalIndividualId,
        scope,
        row_index: parseInt(row_index),
        column_index: parseInt(column_index),
        item_index: itemIndex,
        cell_value: cell_value || null,
        cell_type: cell_type || 'text',
        status: status || 'neutral',
        timeframe: timeframe || 'yearly',
        timeframe_value: timeframeValueStr,
        updated_at: new Date().toISOString(),
      };

      console.log('💾 Saving item data:', itemData);

      // If item_id is provided, update that specific item
      let data, error;
      if (item_id) {
        console.log('🔄 Updating item by ID:', item_id);
        ({ data, error } = await supabase
          .from('strategic_map_items')
          .update(itemData)
          .eq('id', item_id)
          .select()
          .single());
      } else {
        // Manual upsert - find existing item first, then update or insert
        // The unique constraint uses COALESCE which Supabase upsert doesn't handle well
        console.log('🔍 Looking for existing item for upsert');
        
        const queryConditions = {
          organization_id: org.id,
          scope,
          row_index: parseInt(row_index),
          column_index: parseInt(column_index),
          timeframe: timeframe || 'yearly',
          timeframe_value: timeframeValueStr,
          item_index: itemIndex,
        };
        
        if (scope === 'company') {
          queryConditions.individual_id = null;
        } else {
          queryConditions.individual_id = finalIndividualId;
        }
        
        const { data: existing, error: queryError } = await supabase
          .from('strategic_map_items')
          .select('id')
          .match(queryConditions)
          .maybeSingle();
        
        if (queryError) {
          console.error('❌ Error querying existing item:', queryError);
        }
        
        if (existing && existing.id) {
          // Update existing
          console.log('🔄 Updating existing item:', existing.id);
          ({ data, error } = await supabase
            .from('strategic_map_items')
            .update(itemData)
            .eq('id', existing.id)
            .select()
            .single());
        } else {
          // Insert new
          console.log('➕ Inserting new item');
          ({ data, error } = await supabase
            .from('strategic_map_items')
            .insert(itemData)
            .select()
            .single());
        }
      }

      if (error) {
        console.error('❌ Error upserting strategic map item:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        res.status(500).json(failResponse(`Failed to save strategic map item: ${error.message || 'Unknown error'}`));
        return;
      }

      res.status(200).json(okResponse(data));
      return;
    }

    if (method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        res.status(400).json(failResponse('id is required'));
        return;
      }

      const { error } = await supabase
        .from('strategic_map_items')
        .delete()
        .eq('id', id)
        .eq('organization_id', org.id);

      if (error) {
        console.error('Error deleting strategic map item:', error);
        res.status(500).json(failResponse('Failed to delete strategic map item'));
        return;
      }

      res.status(200).json(okResponse({ success: true }));
      return;
    }

    res.status(405).json(failResponse('Method not allowed'));
  } catch (error) {
    console.error('Error in strategic_map API:', error);
    res.status(500).json(failResponse('Internal server error'));
  }
};

