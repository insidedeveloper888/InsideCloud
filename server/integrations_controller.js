const { supabase } = require('./supabase_client');
const serverUtil = require('./server_util');
const { getLarkCredentials } = require('./organization_helper');

/**
 * List all integrations for an organization
 */
async function listIntegrations(ctx) {
    serverUtil.configAccessControl(ctx);
    const organizationSlug = ctx.query.organization_slug || ctx.session.organization_slug;

    if (!organizationSlug) {
        ctx.body = serverUtil.failResponse('Organization slug is required');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('integration_configurations')
            .select('id, integration_key, category, is_active, updated_at, sync_strategy')
            .eq('organization_slug', organizationSlug);

        if (error) throw error;

        ctx.body = serverUtil.okResponse(data || []);
    } catch (error) {
        console.error('Error listing integrations:', error);
        ctx.body = serverUtil.failResponse('Failed to list integrations');
    }
}

/**
 * Connect (create/update) an integration
 */
async function connectIntegration(ctx) {
    serverUtil.configAccessControl(ctx);
    const { organization_slug, integration_key, category, config } = ctx.request.body;

    if (!organization_slug || !integration_key || !config) {
        ctx.body = serverUtil.failResponse('Missing required fields');
        return;
    }

    try {
        // TODO: Encrypt config before saving
        // For now, we save as is (assuming SSL/TLS for transport)
        // In production, use a proper encryption helper

        const { data, error } = await supabase
            .from('integration_configurations')
            .upsert({
                organization_slug,
                integration_key,
                category,
                config, // Encrypt this!
                is_active: true,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'organization_slug, integration_key'
            })
            .select();

        if (error) throw error;

        ctx.body = serverUtil.okResponse(data[0]);
    } catch (error) {
        console.error('Error connecting integration:', error);
        ctx.body = serverUtil.failResponse('Failed to connect integration');
    }
}

/**
 * Disconnect (deactivate) an integration
 */
async function disconnectIntegration(ctx) {
    serverUtil.configAccessControl(ctx);
    const { organization_slug, integration_key } = ctx.request.body;

    if (!organization_slug || !integration_key) {
        ctx.body = serverUtil.failResponse('Missing required fields');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('integration_configurations')
            .update({ is_active: false, config: {} }) // Clear config on disconnect
            .eq('organization_slug', organization_slug)
            .eq('integration_key', integration_key)
            .select();

        if (error) throw error;

        ctx.body = serverUtil.okResponse(data[0]);
    } catch (error) {
        console.error('Error disconnecting integration:', error);
        ctx.body = serverUtil.failResponse('Failed to disconnect integration');
    }
}

module.exports = {
    listIntegrations,
    connectIntegration,
    disconnectIntegration
};
