// Organization helper functions for multi-tenant Lark authentication
const { supabase } = require('./supabase_client');

/**
 * Get Lark credentials for an organization by slug
 * @param {string} orgSlug - Organization slug identifier
 * @returns {Promise<{lark_app_id: string, lark_app_secret: string, noncestr: string, organization_id: string} | null>}
 */
async function getLarkCredentials(orgSlug) {
    if (!orgSlug) {
        console.error('❌ Organization slug is required');
        return null;
    }

    if (!supabase) {
        console.error('❌ Supabase client not initialized. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
        return null;
    }

    try {
        console.log(`🔍 Fetching Lark credentials for organization: ${orgSlug}`);
        
        // Call the database function we created
        const { data, error } = await supabase.rpc('get_lark_credentials', {
            org_slug: orgSlug
        });

        if (error) {
            console.error('❌ Error fetching Lark credentials:', error);
            return null;
        }

        if (!data || data.length === 0) {
            console.warn(`⚠️  No Lark credentials found for organization: ${orgSlug}`);
            return null;
        }

        const credentials = data[0];
        
        if (!credentials.lark_app_id || !credentials.lark_app_secret) {
            console.error('❌ Invalid Lark credentials structure');
            return null;
        }

        console.log(`✅ Found Lark credentials for organization: ${orgSlug}`);
        return {
            lark_app_id: credentials.lark_app_id,
            lark_app_secret: credentials.lark_app_secret,
            noncestr: credentials.noncestr || '',
            organization_id: credentials.organization_id,
            is_active: credentials.is_active
        };
    } catch (error) {
        console.error('❌ Exception fetching Lark credentials:', error);
        return null;
    }
}

/**
 * Validate that an organization exists and is active
 * @param {string} orgSlug - Organization slug identifier
 * @returns {Promise<boolean>}
 */
async function validateOrganization(orgSlug) {
    console.log(`🔍 [validateOrganization] Checking org: ${orgSlug}`);

    if (!orgSlug) {
        console.log('❌ [validateOrganization] No orgSlug provided');
        return false;
    }

    if (!supabase) {
        console.error('❌ Supabase client not initialized. Cannot validate organization.');
        return false;
    }

    try {
        console.log('🔍 [validateOrganization] Querying Supabase...');
        const { data, error } = await supabase
            .from('organizations')
            .select('id, slug, is_active')
            .eq('slug', orgSlug)
            .eq('is_active', true)
            .single();

        console.log('🔍 [validateOrganization] Query result:', { data, error });

        if (error || !data) {
            console.log(`❌ [validateOrganization] Failed: error=${error?.message}, hasData=${!!data}`);
            return false;
        }

        console.log(`✅ [validateOrganization] Success: ${orgSlug}`);
        return true;
    } catch (error) {
        console.error('❌ Error validating organization:', error);
        return false;
    }
}

/**
 * Get organization info by slug
 * @param {string} orgSlug - Organization slug identifier
 * @returns {Promise<{id: string, slug: string, name: string} | null>}
 */
async function getOrganizationInfo(orgSlug) {
    if (!orgSlug) {
        return null;
    }

    if (!supabase) {
        console.error('❌ Supabase client not initialized. Cannot fetch organization info.');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('id, slug, name, is_active')
            .eq('slug', orgSlug)
            .single();

        if (error || !data) {
            return null;
        }

        return {
            id: data.id,
            slug: data.slug,
            name: data.name,
            is_active: data.is_active
        };
    } catch (error) {
        console.error('❌ Error fetching organization info:', error);
        return null;
    }
}

module.exports = {
    getLarkCredentials,
    validateOrganization,
    getOrganizationInfo
};

