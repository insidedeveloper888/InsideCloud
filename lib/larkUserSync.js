const axios = require('axios');

function getAvatarUrl(profile) {
    if (!profile) {
        return null;
    }

    if (profile.avatar_url) {
        return profile.avatar_url;
    }

    const avatar = profile.avatar || {};
    return avatar.avatar_240 || avatar.avatar_72 || avatar.avatar_origin || null;
}

async function fetchLarkUserInfo(accessToken) {
    if (!accessToken) {
        return null;
    }

    try {
        const response = await axios.get('https://open.larksuite.com/open-apis/authen/v1/user_info', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.data || response.data.code !== 0) {
            console.warn('⚠️  Failed to fetch Lark user profile:', response.data?.msg || 'Unknown error');
            return null;
        }

        return response.data.data || null;
    } catch (error) {
        console.error('❌  Error fetching Lark user profile:', error.response?.data || error.message);
        return null;
    }
}

async function syncLarkUser({ supabaseClient, accessTokenData, organizationId }) {
    if (!supabaseClient) {
        console.warn('⚠️  Supabase client not configured. Skipping Lark user sync.');
        return null;
    }

    console.log('ℹ️  Supabase client ready:', !!supabaseClient);
    if (typeof supabaseClient.rpc !== 'function') {
        console.warn('⚠️  Supabase client missing rpc method. Current value:', typeof supabaseClient.rpc);
        return null;
    }

    if (!accessTokenData || !accessTokenData.user_id) {
        console.warn('⚠️  Missing Lark user information in access token. Skipping sync.');
        return null;
    }

    const userAccessToken = accessTokenData.access_token;
    const profile = await fetchLarkUserInfo(userAccessToken);

    const larkUserId = profile?.user_id || accessTokenData.user_id;
    if (!larkUserId) {
        console.warn('⚠️  Unable to determine Lark user ID. Skipping sync.');
        return null;
    }

    const payload = {
        p_lark_user_id: larkUserId,
        p_open_id: profile?.open_id || null,
        p_union_id: profile?.union_id || null,
        p_tenant_key: profile?.tenant_key || accessTokenData.tenant_key || null,
        p_name: profile?.name || profile?.en_name || null,
        p_email: profile?.email || profile?.enterprise_email || null,
        p_mobile: profile?.mobile || null,
        p_avatar_url: getAvatarUrl(profile),
        p_organization_id: organizationId || null,
        p_raw_user: {
            profile: profile || null,
            token: {
                user_id: accessTokenData.user_id,
                tenant_key: accessTokenData.tenant_key || null,
                scope: accessTokenData.scope || null,
                expires_in: accessTokenData.expires_in || null
            }
        }
    };

    console.log('ℹ️  syncLarkUser payload:', {
        lark_user_id: payload.p_lark_user_id,
        organization_id: payload.p_organization_id,
        email: payload.p_email
    });

    try {
        const { data, error } = await supabaseClient.rpc('upsert_lark_user', payload);
        if (error) {
            console.error('❌  Supabase upsert_lark_user error:', error);
            throw error;
        }

        console.log('✅  Supabase upsert_lark_user success');
        return data || null;
    } catch (error) {
        console.error('❌  Error syncing Lark user to Supabase:', error);
        return null;
    }
}

module.exports = {
    syncLarkUser,
    fetchLarkUserInfo
};
