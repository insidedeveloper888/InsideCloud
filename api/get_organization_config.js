const { handleCors, okResponse, failResponse } = require('./_utils');
const { supabase, getLarkCredentials } = require('./supabase_helper');

/**
 * Validate that an organization exists and is active
 */
async function validateOrganization(orgSlug) {
  if (!orgSlug || !supabase) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, slug, is_active')
      .eq('slug', orgSlug)
      .eq('is_active', true)
      .single();

    return !error && data !== null;
  } catch (error) {
    console.error('Error validating organization:', error);
    return false;
  }
}

/**
 * Get organization info by slug
 */
async function getOrganizationInfo(orgSlug) {
  if (!orgSlug || !supabase) {
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
    console.error('Error fetching organization info:', error);
    return null;
  }
}

module.exports = async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  console.log("\n-------------------[获取组织配置 BEGIN]-----------------------------");
  
  if (!supabase) {
    console.error('Supabase not configured');
    res.status(500).json(failResponse('Supabase configuration missing'));
    return;
  }

  const organizationSlug = req.query.organization_slug || "";
  
  if (!organizationSlug) {
    res.status(400).json(failResponse("organization_slug parameter is required"));
    return;
  }
  
  try {
    // Validate organization exists
    const isValid = await validateOrganization(organizationSlug);
    if (!isValid) {
      res.status(404).json(failResponse(`Organization '${organizationSlug}' not found or inactive`));
      return;
    }
    
    // Get organization info
    const orgInfo = await getOrganizationInfo(organizationSlug);
    if (!orgInfo) {
      res.status(500).json(failResponse(`Failed to retrieve organization info`));
      return;
    }
    
    // Get Lark credentials to verify they're configured
    const larkCredentials = await getLarkCredentials(organizationSlug);
    if (!larkCredentials) {
      res.status(404).json(failResponse(`Lark credentials not configured for organization '${organizationSlug}'`));
      return;
    }
    
    // Return organization config (without secrets)
    const responseData = {
      organization_slug: orgInfo.slug,
      organization_name: orgInfo.name,
      organization_id: orgInfo.id,
      lark_app_id: larkCredentials.lark_app_id, // Safe to return app_id
      is_active: orgInfo.is_active
    };
    
    console.log(`✅ Organization config retrieved for: ${organizationSlug}`);
    console.log("-------------------[获取组织配置 END]-----------------------------\n");
    
    res.status(200).json(okResponse(responseData));
    
  } catch (error) {
    console.error('Error getting organization config:', error);
    res.status(500).json(failResponse('Internal server error'));
  }
};

