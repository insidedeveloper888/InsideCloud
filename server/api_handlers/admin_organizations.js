const { handleCors, okResponse, failResponse, getAuthFromCookie } = require('../../api/_utils');
const { supabase } = require('../../api/_supabase_helper');

const slugify = (value) =>
  (value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 60);

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  const existingAuth = getAuthFromCookie(req);
  if (!existingAuth || !existingAuth.access_token) {
    res.status(401).json(failResponse('用户未登录，请先登录'));
    return;
  }

  // TODO: Implement per-user admin checks. For now, allow execution when service role is present.

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, is_active, created_at')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      res.status(200).json(okResponse(data || []));
    } catch (error) {
      console.error('❌ Failed to fetch organizations (api):', error);
      res.status(500).json(failResponse('获取组织失败'));
    }
    return;
  }

  if (req.method === 'POST') {
    const name = (req.query.name || '').trim();
    let customSlug = (req.query.slug || '').trim();

    if (!name) {
      res.status(400).json(failResponse('组织名称不能为空'));
      return;
    }

    if (!customSlug) {
      customSlug = slugify(name);
    } else {
      customSlug = slugify(customSlug);
    }

    if (!customSlug) {
      res.status(400).json(failResponse('无法生成有效的组织标识'));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert({ name, slug: customSlug, is_active: true })
        .select('id, name, slug, is_active, created_at')
        .single();

      if (error) {
        throw error;
      }

      res.status(200).json(okResponse(data));
    } catch (error) {
      console.error('❌ Failed to create organization (api):', error);
      res.status(500).json(failResponse(error.message || '创建组织失败'));
    }
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).json(failResponse('Method not allowed'));
};
