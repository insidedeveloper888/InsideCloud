const { handleCors, okResponse, failResponse } = require('../../api/_utils');
const { supabase, getLarkCredentials } = require('../../api/_supabase_helper');

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
    let larkCredentials;
    try {
      larkCredentials = await getLarkCredentials(organizationSlug);
      if (!larkCredentials) {
        console.warn(`⚠️  No Lark credentials found for organization: ${organizationSlug}`);
        res.status(404).json(failResponse(`Lark credentials not configured for organization '${organizationSlug}'`));
        return;
      }
    } catch (credError) {
      console.error('❌ Error fetching Lark credentials:', credError);
      console.error('Credential error details:', {
        message: credError.message,
        stack: credError.stack,
        organizationSlug
      });
      res.status(500).json(failResponse(`Failed to fetch Lark credentials: ${credError.message || 'Unknown error'}`));
      return;
    }
    
    // ALWAYS query fresh from Supabase - check user's actual role
    let isAdmin = false;
    try {
      // Get user info from cookies (lk_token contains user info)
      const cookie = require('cookie');
      const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
      const lkToken = cookies.lk_token;
      
      if (lkToken) {
        // The lk_token is a JSON string containing user info
        // Parse it to get user_id
        let userInfo = null;
        try {
          userInfo = JSON.parse(Buffer.from(lkToken, 'base64').toString());
        } catch (e) {
          // Try direct JSON parse
          try {
            userInfo = JSON.parse(lkToken);
          } catch (e2) {
            console.log(`⚠️ [API] Cannot parse lk_token:`, e2.message);
          }
        }
        
        if (userInfo && userInfo.user_id && orgInfo.id) {
          const larkUserId = userInfo.user_id;
          console.log(`🔍 [API] Checking role for lark_user_id=${larkUserId}, org_id=${orgInfo.id}`);
          
          // Query: Use RPC function to find auth user by lark_user_id, then link to individuals and organization_members
          const { data: authUserId, error: rpcError } = await supabase
            .rpc('get_auth_user_by_lark', {
              p_lark_user_id: larkUserId,
              p_email: null
            });
          
          if (!rpcError && authUserId) {
            console.log(`✅ [API] Found auth user via RPC: id=${authUserId}`);
            
            // Get individual by user_id
            const { data: individual, error: indError } = await supabase
              .from('individuals')
              .select('id')
              .eq('user_id', authUserId)
              .maybeSingle();
            
            if (individual && individual.id) {
              console.log(`✅ [API] Found individual: id=${individual.id}`);
              
              // Get organization member role
              const { data: orgMember, error: memberError } = await supabase
                .from('organization_members')
                .select('role_code')
                .eq('individual_id', individual.id)
                .eq('organization_id', orgInfo.id)
                .maybeSingle();
              
              if (orgMember) {
                isAdmin = orgMember.role_code === 'admin' || orgMember.role_code === 'owner';
                console.log(`✅ [API] Role check RESULT: lark_user_id=${larkUserId}, role_code=${orgMember.role_code}, isAdmin=${isAdmin}`);
              } else {
                console.log(`⚠️ [API] No org member found for individual_id=${individual.id}, org_id=${orgInfo.id}:`, memberError);
                isAdmin = false;
              }
            } else {
              console.log(`⚠️ [API] No individual found for auth_user.id=${authUserId}:`, indError);
              isAdmin = false;
            }
          } else {
            console.log(`⚠️ [API] Auth user not found via RPC for lark_user_id=${larkUserId}:`, rpcError);
            isAdmin = false;
          }
        } else {
          console.log(`⚠️ [API] No user_id in token - defaulting to false`);
          isAdmin = false;
        }
      } else {
        console.log(`⚠️ [API] No lk_token cookie found - defaulting to false`);
        isAdmin = false;
      }
    } catch (roleError) {
      console.error('❌ [API] Failed to check user role:', roleError);
      isAdmin = false;
    }
    
    console.log(`📤 [API] FINAL RESULT: is_admin=${isAdmin} (fresh from DB)`);
    
    // Return organization config (without secrets)
    const responseData = {
      organization_slug: orgInfo.slug,
      organization_name: orgInfo.name,
      organization_id: orgInfo.id,
      lark_app_id: larkCredentials.lark_app_id, // Safe to return app_id
      is_active: orgInfo.is_active,
      is_admin: isAdmin // Always return false for now until we can properly get user from API context
    };
    
    console.log(`✅ Organization config retrieved for: ${organizationSlug}`);
    console.log("-------------------[获取组织配置 END]-----------------------------\n");
    
    res.status(200).json(okResponse(responseData));
    
  } catch (error) {
    console.error('❌ Error getting organization config:', error);
    console.error('Error stack:', error.stack);
    const errorMessage = error.message || 'Internal server error';
    res.status(500).json(failResponse(`Internal server error: ${errorMessage}`));
  }
};

