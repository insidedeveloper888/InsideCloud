// Supabase helper for Vercel serverless functions
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

/**
 * Get Lark credentials for an organization by slug
 */
async function getLarkCredentials(orgSlug) {
  if (!orgSlug || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.rpc('get_lark_credentials', {
      org_slug: orgSlug
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    const credentials = data[0];
    if (!credentials.lark_app_id || !credentials.lark_app_secret) {
      return null;
    }

    return {
      lark_app_id: credentials.lark_app_id,
      lark_app_secret: credentials.lark_app_secret,
      noncestr: credentials.noncestr || '',
      organization_id: credentials.organization_id,
      is_active: credentials.is_active
    };
  } catch (error) {
    console.error('Error fetching Lark credentials:', error);
    return null;
  }
}

module.exports = {
  supabase,
  getLarkCredentials
};

