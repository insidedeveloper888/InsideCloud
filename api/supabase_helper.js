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

if (!supabase) {
  console.warn('⚠️  [API] Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
} else {
  console.log('ℹ️  [API] Supabase client configured. URL present:', !!supabaseUrl, 'Service role key present:', !!supabaseServiceRoleKey);
}

/**
 * Get Lark credentials for an organization by slug
 */
async function getLarkCredentials(orgSlug) {
  if (!orgSlug || !supabase) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    return null;
  }

  try {
    console.log(`🔍 Fetching Lark credentials for organization slug: ${orgSlug}`);
    const { data, error } = await supabase.rpc('get_lark_credentials', {
      org_slug: orgSlug
    });

    if (error) {
      console.error('❌ Supabase RPC error:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Supabase RPC error: ${error.message || 'Unknown error'}`);
    }

    if (!data || data.length === 0) {
      console.warn(`⚠️  No credentials found for organization slug: ${orgSlug}`);
      return null;
    }

    const credentials = data[0];
    if (!credentials.lark_app_id || !credentials.lark_app_secret) {
      console.warn(`⚠️  Incomplete credentials for organization slug: ${orgSlug}`);
      return null;
    }

    console.log(`✅ Lark credentials retrieved for organization: ${orgSlug}`);
    return {
      lark_app_id: credentials.lark_app_id,
      lark_app_secret: credentials.lark_app_secret,
      noncestr: credentials.noncestr || '',
      organization_id: credentials.organization_id,
      is_active: credentials.is_active
    };
  } catch (error) {
    console.error('❌ Error fetching Lark credentials:', error);
    // Re-throw to let caller handle it
    throw error;
  }
}

module.exports = {
  supabase,
  getLarkCredentials
};

