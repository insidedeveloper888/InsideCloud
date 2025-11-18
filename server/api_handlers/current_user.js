/**
 * Current User API Endpoint
 * GET /api/current_user
 *
 * Returns current user information including individual_id
 */

const { handleCors, getAuthFromCookie, okResponse, failResponse } = require('../../api/_utils');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json(failResponse('Method not allowed'));
  }

  try {
    // Get authentication from JWT cookie
    const authData = getAuthFromCookie(req);

    if (!authData || !authData.user_id) {
      return res.status(401).json(failResponse('Unauthorized: No authentication found'));
    }

    const larkUserId = authData.user_id;
    const userEmail = authData.email;

    console.log('🔍 Looking up individual - user_id:', larkUserId, 'email:', userEmail);

    // Query Supabase to get individual_id
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Query by email
    const { data: individuals, error: indError } = await supabase
      .from('individuals')
      .select('id, display_name, primary_email, avatar_url, user_id')
      .eq('primary_email', userEmail)
      .limit(1);

    if (indError) {
      console.error('❌ Error querying individuals by email:', indError);
      return res.status(500).json(failResponse('Failed to lookup user'));
    }

    const individual = individuals && individuals.length > 0 ? individuals[0] : null;

    if (!individual) {
      console.log('⚠️  Individual not found for email:', userEmail);
      return res.status(200).json(okResponse({
        lark_user_id: larkUserId,
        email: userEmail,
        display_name: authData.name,
        avatar_url: authData.avatar_url,
        individual_id: null,
        message: 'Individual not found in database'
      }));
    }

    console.log('✅ Found individual:', individual.id);

    // Return user info
    return res.status(200).json(okResponse({
      lark_user_id: larkUserId,
      individual_id: individual?.id || null,
      display_name: individual?.display_name || authData.name || null,
      email: individual?.primary_email || authData.email || null,
      avatar_url: individual?.avatar_url || authData.avatar_url || null,
    }));

  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return res.status(500).json(failResponse('Internal server error'));
  }
};
