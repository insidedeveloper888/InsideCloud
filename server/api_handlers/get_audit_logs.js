const { handleCors, okResponse, failResponse, getAuthFromCookie } = require('../../api/_utils');
const { getLarkCredentials, supabase } = require('../../api/_supabase_helper');

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
      .from('audit_events')
      .select('id,event_type,payload,occurred_at,ip,user_agent')
      .eq('organization_id', credentials.organization_id)
      .order('occurred_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ Failed to fetch audit logs (api):', error);
      res.status(500).json(failResponse('获取审计日志失败'));
      return;
    }

    res.status(200).json(okResponse(data || []));
  } catch (error) {
    console.error('❌ Exception fetching audit logs (api):', error);
    res.status(500).json(failResponse('服务器内部错误'));
  }
};
