const { handleCors, okResponse, failResponse, getAuthFromCookie } = require('./_utils');
const { getLarkCredentials, supabase } = require('./supabase_helper');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  const existingAuth = getAuthFromCookie(req);
  if (!existingAuth || !existingAuth.access_token) {
    res.status(401).json(failResponse('用户未登录，请先登录'));
    return;
  }

  const organizationSlug = req.query.organization_slug || '';
  if (!organizationSlug) {
    res.status(400).json(failResponse('organization_slug is required'));
    return;
  }

  try {
    const credentials = await getLarkCredentials(organizationSlug);
    if (!credentials || !credentials.organization_id) {
      res.status(404).json(failResponse(`Organization '${organizationSlug}' not found or inactive`));
      return;
    }

    const { data, error } = await supabase
      .from('organization_members')
      .select('id, role_code, status, joined_at, individuals:individual_id (display_name, primary_email, profile)')
      .eq('organization_id', credentials.organization_id)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('❌ Failed to fetch organization members (api):', error);
      res.status(500).json(failResponse('获取组织成员失败'));
      return;
    }

    const members = (data || []).map((member) => {
      const profile = member.individuals?.profile || {};
      return {
        id: member.id,
        role_code: member.role_code,
        status: member.status,
        joined_at: member.joined_at,
        name: member.individuals?.display_name || 'Unknown User',
        email: member.individuals?.primary_email || null,
        avatar_url: profile?.avatar_url || null,
      };
    });

    res.status(200).json(okResponse(members));
  } catch (error) {
    console.error('❌ Exception fetching organization members (api):', error);
    res.status(500).json(failResponse('服务器内部错误'));
  }
};
