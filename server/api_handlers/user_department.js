/**
 * User Department API Endpoint
 * GET /api/user_department
 *
 * Returns user's department info, job title, join time, and leader name from Lark Contact API
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
    const userId = req.query.user_id;
    const organizationSlug = req.query.organization_slug;

    if (!userId) {
      return res.status(400).json(failResponse('user_id is required'));
    }

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

    // Get user info including department_ids, leader
    const userResponse = await axios.get(
      `https://open.larksuite.com/open-apis/contact/v3/users/${userId}?user_id_type=user_id&department_id_type=open_department_id`,
      {
        headers: {
          'Authorization': `Bearer ${tenantAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (userResponse.data.code !== 0) {
      console.error('Failed to get user info:', userResponse.data);
      return res.status(500).json(failResponse(`Failed to get user info: ${userResponse.data.msg}`));
    }

    const user = userResponse.data.data?.user || {};
    const departmentIds = user.department_ids || [];

    // Get department names for each department_id (skip root "0")
    const departments = [];
    for (const deptId of departmentIds) {
      if (deptId === '0') continue; // Skip root department
      try {
        const deptResponse = await axios.get(
          `https://open.larksuite.com/open-apis/contact/v3/departments/${deptId}?department_id_type=open_department_id`,
          {
            headers: {
              'Authorization': `Bearer ${tenantAccessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        if (deptResponse.data.code === 0 && deptResponse.data.data?.department) {
          departments.push({
            id: deptId,
            name: deptResponse.data.data.department.name,
            en_name: deptResponse.data.data.department.i18n_name?.en_us
          });
        }
      } catch (e) {
        console.error(`Failed to get department ${deptId}:`, e.message);
      }
    }

    // Get leader name if leader_user_id exists
    let leaderName = '';
    if (user.leader_user_id) {
      try {
        const leaderResponse = await axios.get(
          `https://open.larksuite.com/open-apis/contact/v3/users/${user.leader_user_id}?user_id_type=user_id`,
          {
            headers: {
              'Authorization': `Bearer ${tenantAccessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        if (leaderResponse.data.code === 0 && leaderResponse.data.data?.user) {
          const leader = leaderResponse.data.data.user;
          leaderName = leader.en_name || leader.name || '';
        }
      } catch (e) {
        console.error('Failed to get leader info:', e.message);
      }
    }

    return res.status(200).json(okResponse({
      user_id: userId,
      department_ids: departmentIds,
      departments: departments,
      job_title: user.job_title || '',
      join_time: user.join_time || null,
      leader_name: leaderName
    }));

  } catch (error) {
    console.error('Error getting user department:', error);
    return res.status(500).json(failResponse('Failed to get user department info'));
  }
};
