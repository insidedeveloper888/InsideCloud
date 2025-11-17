/**
 * Current User API Endpoint
 * GET /api/current_user
 *
 * Returns current user information including individual_id
 */

const { handleCors } = require('./_utils');
const { createClient } = require('@supabase/supabase-js');
const cookie = require('cookie');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    // Parse cookies
    let cookies = {};
    if (req.headers.cookie) {
      cookies = cookie.parse(req.headers.cookie);
    }

    // Get lk_token from cookie or Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization || req.headers['authorization'];
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const lkToken = bearerToken || cookies.lk_token || cookies['lk_token'];

    if (!lkToken) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No authentication token found',
      });
    }

    // Call Lark API to get user info
    const axios = require('axios');
    const userInfoRes = await axios.get("https://open.larksuite.com/open-apis/authen/v1/user_info", {
      headers: {
        "Authorization": `Bearer ${lkToken}`,
        "Content-Type": "application/json"
      },
      timeout: 10000
    });

    if (!userInfoRes.data || userInfoRes.data.code !== 0) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or expired token',
        details: userInfoRes.data,
      });
    }

    const userInfo = userInfoRes.data.data;
    const larkUserId = userInfo.user_id;

    if (!larkUserId) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get user_id from Lark',
      });
    }

    // Query Supabase to get individual_id
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get auth user by lark_user_id
    const { data: authUserId, error: rpcError } = await supabase.rpc('get_auth_user_by_lark', {
      p_lark_user_id: larkUserId,
      p_email: userInfo.email || null
    });

    if (rpcError) {
      console.error('Error getting auth user:', rpcError);
      return res.status(500).json({
        success: false,
        error: 'Failed to lookup user',
      });
    }

    if (!authUserId) {
      // User not found in database
      return res.status(200).json({
        success: true,
        data: {
          lark_user_id: larkUserId,
          email: userInfo.email || null,
          name: userInfo.name || null,
          individual_id: null,
          message: 'User not synced to database yet',
        }
      });
    }

    // Get individual by user_id
    const { data: individual, error: indError } = await supabase
      .from('individuals')
      .select('id, display_name, email, avatar_url')
      .eq('user_id', authUserId)
      .maybeSingle();

    if (indError) {
      console.error('Error getting individual:', indError);
    }

    // Return user info
    return res.status(200).json({
      success: true,
      data: {
        lark_user_id: larkUserId,
        individual_id: individual?.id || null,
        display_name: individual?.display_name || userInfo.name || null,
        email: individual?.email || userInfo.email || null,
        avatar_url: individual?.avatar_url || userInfo.avatar_url || null,
      }
    });

  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
