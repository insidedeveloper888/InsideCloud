/**
 * Sales Order Controller
 * Handles all business logic for sales order management
 * Routes for: sales_orders, sales_order_items, sales_order_settings, sales_teams
 */

const { createClient } = require('@supabase/supabase-js');
const serverUtil = require('./server_util');
const {
  generateOrderCode,
  shouldResetCounter,
  validateFormat,
  previewFormat,
  getNextCounter,
} = require('./utils/order_code_generator');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get organization ID from slug
 */
async function getOrganizationId(organizationSlug) {
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', organizationSlug)
    .single();

  return org?.id || null;
}

/**
 * Get team member IDs for team-based visibility
 * Returns all individual IDs in teams where current user is lead or member
 */
async function getTeamMemberIds(organizationId, currentIndividualId) {
  console.log('🔍 getTeamMemberIds called for:', { organizationId, currentIndividualId });

  // Find teams where user is team lead
  const { data: ledTeams } = await supabase
    .from('sales_teams')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('team_lead_individual_id', currentIndividualId)
    .eq('is_active', true);

  console.log('🔍 Teams where user is lead:', ledTeams);

  // Find teams where user is a member
  const { data: memberTeams } = await supabase
    .from('sales_team_members')
    .select('sales_team_id')
    .eq('individual_id', currentIndividualId);

  console.log('🔍 Teams where user is member:', memberTeams);

  // Combine team IDs
  const teamIds = new Set([
    ...(ledTeams || []).map(t => t.id),
    ...(memberTeams || []).map(t => t.sales_team_id)
  ]);

  console.log('🔍 Combined team IDs:', Array.from(teamIds));

  if (teamIds.size === 0) {
    // User is not in any team, only show their own orders
    console.log('🔍 User not in any team, returning only current user ID');
    return [currentIndividualId];
  }

  // Get all members from these teams
  const { data: allMembers } = await supabase
    .from('sales_team_members')
    .select('individual_id')
    .in('sales_team_id', Array.from(teamIds));

  console.log('🔍 All team members:', allMembers);

  // Also get team leads
  const { data: allLeads } = await supabase
    .from('sales_teams')
    .select('team_lead_individual_id')
    .in('id', Array.from(teamIds));

  console.log('🔍 All team leads:', allLeads);

  // Combine all individual IDs (members + leads + current user)
  const individualIds = new Set([
    currentIndividualId,
    ...(allMembers || []).map(m => m.individual_id),
    ...(allLeads || []).map(l => l.team_lead_individual_id)
  ]);

  const result = Array.from(individualIds).filter(Boolean);
  console.log('🔍 Final team member IDs to filter by:', result);

  return result;
}

/**
 * Apply visibility filter based on organization settings
 * @returns {object} Query builder with visibility filters applied or null if async needed
 */
function applyVisibilityFilter(query, organizationId, currentIndividualId, settings) {
  console.log('🔍 applyVisibilityFilter called with:', { organizationId, currentIndividualId, queryType: typeof query });

  const visibility = settings?.sales_order_visibility || 'organization';
  console.log('🔍 Visibility setting:', visibility);

  // If no current user, default to organization-wide visibility
  if (!currentIndividualId) {
    console.log('🔍 No currentIndividualId, returning query as-is');
    return query;
  }

  switch (visibility) {
    case 'assigned_only':
      // Only show orders assigned to current user
      console.log('🔍 Applying assigned_only filter');
      return query.eq('sales_person_individual_id', currentIndividualId);

    case 'team_based':
      // This case requires async operations, return null to signal async handling needed
      console.log('🔍 Team-based visibility - needs async handling');
      return null;

    case 'organization':
    default:
      // No filter, show all orders
      console.log('🔍 Organization-wide visibility, returning query as-is');
      return query;
  }
}

// ============================================================================
// SALES ORDER SETTINGS ENDPOINTS
// ============================================================================

/**
 * GET /api/sales_order_settings
 * Fetch organization settings
 */
async function getSalesOrderSettings(ctx) {
  try {
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Fetch settings from generalized table
    const { data, error } = await supabase
      .from('sales_document_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('document_type', 'sales_order')
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw error;
    }

    // If no settings exist, return defaults
    if (!data) {
      ctx.body = {
        order_code_format: 'SO-{YYMM}-{5digits}',
        current_counter: 0,
        reset_period: 'monthly',
        default_tax_rate: 0.0,
        sales_order_visibility: 'organization',
        enable_sales_teams: false,
      };
    } else {
      ctx.body = data;
    }
  } catch (error) {
    console.error('Error fetching sales order settings:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * PUT /api/sales_order_settings
 * Update organization settings
 */
async function updateSalesOrderSettings(ctx) {
  try {
    const { organization_slug } = ctx.query;
    const updates = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Validate format if provided
    if (updates.order_code_format) {
      const validation = validateFormat(updates.order_code_format);
      if (!validation.valid) {
        return (ctx.status = 400), (ctx.body = { error: validation.error });
      }
    }

    // Upsert settings
    const { data, error } = await supabase
      .from('sales_document_settings')
      .upsert(
        {
          organization_id: organizationId,
          document_type: 'sales_order',
          ...updates,
        },
        { onConflict: 'organization_id,document_type' }
      )
      .select()
      .single();

    if (error) throw error;

    ctx.body = data;
  } catch (error) {
    console.error('Error updating sales order settings:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/sales_order_settings/preview_format
 * Preview order code format with sample data
 */
async function previewOrderFormat(ctx) {
  try {
    const { format, sample_counter = 1 } = ctx.request.body;

    if (!format) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing format' });
    }

    const result = previewFormat(format, sample_counter);
    ctx.body = result;
  } catch (error) {
    console.error('Error previewing format:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// ============================================================================
// SALES ORDERS ENDPOINTS
// ============================================================================

/**
 * GET /api/sales_orders
 * Fetch all sales orders (with visibility filtering)
 */
async function getSalesOrders(ctx) {
  try {
    const { organization_slug, status, customer_id, sales_person_id, date_from, date_to } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Get current user's individual_id from session
    const currentIndividualId = ctx.session?.individual_id;

    // Get organization settings for visibility
    const { data: settings } = await supabase
      .from('sales_document_settings')
      .select('sales_order_visibility, enable_sales_teams')
      .eq('organization_id', organizationId)
      .eq('document_type', 'sales_order')
      .single();

    // Build base query
    let query = supabase
      .from('sales_orders')
      .select(`
        *,
        customer:contacts!customer_contact_id (id, first_name, last_name, company_name),
        sales_person:individuals!sales_person_individual_id (id, display_name, primary_email, avatar_url)
      `)
      .eq('organization_id', organizationId)
      .eq('is_deleted', false);

    console.log('🔍 Query BEFORE visibility filter:', typeof query, query?.constructor?.name);
    console.log('🔍 Query BEFORE has .order method?', typeof query?.order);

    // Check if team-based visibility requires async handling
    const visibility = settings?.sales_order_visibility || 'organization';
    if (visibility === 'team_based' && currentIndividualId) {
      // Get team member IDs
      const teamMemberIds = await getTeamMemberIds(organizationId, currentIndividualId);
      console.log('🔍 Team-based visibility - filtering by team member IDs:', teamMemberIds);
      query = query.in('sales_person_individual_id', teamMemberIds);
    } else {
      // Apply visibility filter (synchronous)
      query = applyVisibilityFilter(query, organizationId, currentIndividualId, settings);
    }

    console.log('🔍 Query after visibility filter:', typeof query, query?.constructor?.name);
    console.log('🔍 Query has .order method?', typeof query?.order);
    console.log('🔍 Query has .eq method?', typeof query?.eq);

    // Apply optional filters
    if (status) query = query.eq('status', status);
    if (customer_id) query = query.eq('customer_contact_id', customer_id);
    if (sales_person_id) query = query.eq('sales_person_individual_id', sales_person_id);
    if (date_from) query = query.gte('order_date', date_from);
    if (date_to) query = query.lte('order_date', date_to);

    // Order by date descending
    query = query.order('order_date', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    ctx.body = data || [];
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * GET /api/sales_orders/:id
 * Fetch single sales order with items
 */
async function getSalesOrder(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Fetch order header
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:contacts!customer_contact_id (id, first_name, last_name, company_name, email, phone_1),
        sales_person:individuals!sales_person_individual_id (id, display_name, primary_email, avatar_url)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('is_deleted', false)
      .single();

    if (orderError) throw orderError;

    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from('sales_order_items')
      .select(`
        *,
        product:inventory_products (id, sku, name, unit, category)
      `)
      .eq('sales_order_id', id)
      .order('line_order', { ascending: true });

    if (itemsError) throw itemsError;

    ctx.body = {
      ...order,
      items: items || [],
    };
  } catch (error) {
    console.error('Error fetching sales order:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/sales_orders
 * Create new sales order
 */
async function createSalesOrder(ctx) {
  try {
    const { organization_slug } = ctx.query;
    const orderData = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    const currentIndividualId = ctx.session?.individual_id;

    // Get settings to generate order code
    const { data: settings } = await supabase
      .from('sales_document_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('document_type', 'sales_order')
      .single();

    if (!settings) {
      return (ctx.status = 400), (ctx.body = { error: 'Sales order settings not configured' });
    }

    // Generate order code
    const currentDate = new Date();
    const nextCounter = getNextCounter(
      settings.current_counter || 0,
      settings.reset_period,
      settings.last_reset_date,
      currentDate
    );

    const orderCode = generateOrderCode(settings.order_code_format, nextCounter, currentDate);

    // Create order header
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .insert({
        organization_id: organizationId,
        order_code: orderCode,
        order_date: orderData.order_date || currentDate.toISOString().split('T')[0],
        customer_contact_id: orderData.customer_contact_id,
        sales_person_individual_id: orderData.sales_person_individual_id,
        status: orderData.status || 'draft',
        subtotal: orderData.subtotal || 0,
        tax_rate: orderData.tax_rate ?? settings.default_tax_rate,
        tax_amount: orderData.tax_amount || 0,
        discount_amount: orderData.discount_amount || 0,
        total_amount: orderData.total_amount || 0,
        notes: orderData.notes,
        created_by_individual_id: currentIndividualId,
        updated_by_individual_id: currentIndividualId,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    if (orderData.items && orderData.items.length > 0) {
      const itemsToInsert = orderData.items.map((item, index) => ({
        sales_order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent || 0,
        discount_amount: item.discount_amount || 0,
        notes: item.notes,
        line_order: index,
      }));

      const { error: itemsError } = await supabase
        .from('sales_order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    // Update settings counter
    await supabase
      .from('sales_document_settings')
      .update({
        current_counter: nextCounter,
        last_reset_date: currentDate.toISOString().split('T')[0],
      })
      .eq('organization_id', organizationId)
      .eq('document_type', 'sales_order');

    // Fetch the created order with joined data
    const { data: orderWithJoins } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:contacts!customer_contact_id (id, first_name, last_name, company_name),
        sales_person:individuals!sales_person_individual_id (id, display_name, primary_email, avatar_url)
      `)
      .eq('id', order.id)
      .single();

    ctx.body = orderWithJoins || order;
  } catch (error) {
    console.error('Error creating sales order:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * PUT /api/sales_orders/:id
 * Update existing sales order
 */
async function updateSalesOrder(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug } = ctx.query;
    const updates = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    const currentIndividualId = ctx.session?.individual_id;

    // Update order header
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .update({
        customer_contact_id: updates.customer_contact_id,
        sales_person_individual_id: updates.sales_person_individual_id,
        order_date: updates.order_date,
        status: updates.status,
        subtotal: updates.subtotal,
        tax_rate: updates.tax_rate,
        tax_amount: updates.tax_amount,
        discount_amount: updates.discount_amount,
        total_amount: updates.total_amount,
        notes: updates.notes,
        updated_by_individual_id: currentIndividualId,
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (orderError) throw orderError;

    // Update items if provided
    if (updates.items) {
      // Delete existing items
      await supabase.from('sales_order_items').delete().eq('sales_order_id', id);

      // Insert new items
      if (updates.items.length > 0) {
        const itemsToInsert = updates.items.map((item, index) => ({
          sales_order_id: id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percent: item.discount_percent || 0,
          discount_amount: item.discount_amount || 0,
          notes: item.notes,
          line_order: index,
        }));

        await supabase.from('sales_order_items').insert(itemsToInsert);
      }
    }

    // Fetch the updated order with joined data
    const { data: orderWithJoins } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:contacts!customer_contact_id (id, first_name, last_name, company_name),
        sales_person:individuals!sales_person_individual_id (id, display_name, primary_email, avatar_url)
      `)
      .eq('id', id)
      .single();

    ctx.body = orderWithJoins || order;
  } catch (error) {
    console.error('Error updating sales order:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * Get delivery summary for a sales order
 */
async function getDeliverySummary(ctx) {
  serverUtil.configAccessControl(ctx);
  const { id } = ctx.params;
  const organizationSlug = ctx.query.organization_slug;

  if (!id) {
    ctx.body = serverUtil.failResponse('Missing sales order ID');
    return;
  }

  try {
    // Call the PostgreSQL function to get delivery summary
    const { data, error } = await supabase
      .rpc('get_sales_order_delivery_summary', {
        p_sales_order_id: id
      });

    if (error) throw error;

    // Format the response to match frontend expectations
    const formattedData = (data || []).map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      unit: item.unit,
      ordered_qty: parseFloat(item.ordered_qty) || 0,
      delivered_qty: parseFloat(item.delivered_qty) || 0,
      remaining_qty: parseFloat(item.remaining_qty) || 0,
      delivery_status: item.delivery_status,
      delivery_percentage: parseFloat(item.delivery_percentage) || 0,
    }));

    ctx.body = formattedData; // Koa returns JSON directly
  } catch (err) {
    console.error('Error fetching delivery summary:', err);
    ctx.body = serverUtil.failResponse('Failed to fetch delivery summary');
  }
}

/**
 * DELETE /api/sales_orders/:id
 * Soft delete sales order (mark as cancelled)
 */
async function deleteSalesOrder(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Soft delete by marking as cancelled and is_deleted
    const { data, error } = await supabase
      .from('sales_orders')
      .update({
        status: 'cancelled',
        is_deleted: true,
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    ctx.body = { success: true, data };
  } catch (error) {
    console.error('Error deleting sales order:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// ============================================================================
// SALES TEAMS ENDPOINTS
// ============================================================================

/**
 * GET /api/sales_teams
 * Fetch all sales teams
 */
async function getSalesTeams(ctx) {
  try {
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Fetch teams with member counts
    const { data: teams, error } = await supabase
      .from('sales_teams')
      .select(`
        *,
        team_lead:individuals!team_lead_individual_id (id, display_name, primary_email)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get member counts for each team
    const teamIds = teams.map((t) => t.id);
    const { data: memberCounts } = await supabase
      .from('sales_team_members')
      .select('sales_team_id')
      .in('sales_team_id', teamIds);

    const countMap = {};
    memberCounts?.forEach((m) => {
      countMap[m.sales_team_id] = (countMap[m.sales_team_id] || 0) + 1;
    });

    const teamsWithCounts = teams.map((team) => ({
      ...team,
      member_count: countMap[team.id] || 0,
    }));

    ctx.body = teamsWithCounts;
  } catch (error) {
    console.error('Error fetching sales teams:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * GET /api/sales_teams/:id
 * Fetch single sales team with members
 */
async function getSalesTeam(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Fetch team
    const { data: team, error: teamError } = await supabase
      .from('sales_teams')
      .select(`
        *,
        team_lead:individuals!team_lead_individual_id (id, display_name, primary_email)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (teamError) throw teamError;

    // Fetch members
    const { data: members, error: membersError } = await supabase
      .from('sales_team_members')
      .select(`
        *,
        member:individuals!individual_id (id, display_name, primary_email)
      `)
      .eq('sales_team_id', id);

    if (membersError) throw membersError;

    ctx.body = {
      ...team,
      members: members || [],
    };
  } catch (error) {
    console.error('Error fetching sales team:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/sales_teams
 * Create new sales team
 */
async function createSalesTeam(ctx) {
  try {
    const { organization_slug } = ctx.query;
    const teamData = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    const currentIndividualId = ctx.session?.individual_id;

    const { data, error } = await supabase
      .from('sales_teams')
      .insert({
        organization_id: organizationId,
        name: teamData.name,
        description: teamData.description,
        color: teamData.color || '#3B82F6',
        team_lead_individual_id: teamData.team_lead_individual_id,
        created_by_individual_id: currentIndividualId,
      })
      .select()
      .single();

    if (error) throw error;

    ctx.body = data;
  } catch (error) {
    console.error('Error creating sales team:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * PUT /api/sales_teams/:id
 * Update sales team
 */
async function updateSalesTeam(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug } = ctx.query;
    const updates = ctx.request.body;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    const { data, error } = await supabase
      .from('sales_teams')
      .update({
        name: updates.name,
        description: updates.description,
        color: updates.color,
        team_lead_individual_id: updates.team_lead_individual_id,
        is_active: updates.is_active,
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    ctx.body = data;
  } catch (error) {
    console.error('Error updating sales team:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * DELETE /api/sales_teams/:id
 * Delete sales team
 */
async function deleteSalesTeam(ctx) {
  try {
    const { id } = ctx.params;
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    const { error } = await supabase
      .from('sales_teams')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    ctx.body = { success: true };
  } catch (error) {
    console.error('Error deleting sales team:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/sales_teams/:id/members
 * Add member to sales team
 */
async function addTeamMember(ctx) {
  try {
    const { id } = ctx.params;
    const { individual_id, role = 'member' } = ctx.request.body;

    const { data, error } = await supabase
      .from('sales_team_members')
      .insert({
        sales_team_id: id,
        individual_id,
        role,
      })
      .select()
      .single();

    if (error) throw error;

    ctx.body = data;
  } catch (error) {
    console.error('Error adding team member:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * DELETE /api/sales_teams/:id/members/:individual_id
 * Remove member from sales team
 */
async function removeTeamMember(ctx) {
  try {
    const { id, individual_id } = ctx.params;

    const { error } = await supabase
      .from('sales_team_members')
      .delete()
      .eq('sales_team_id', id)
      .eq('individual_id', individual_id);

    if (error) throw error;

    ctx.body = { success: true };
  } catch (error) {
    console.error('Error removing team member:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Get organization members (for sales person dropdown)
 */
async function getOrganizationMembers(ctx) {
  try {
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      ctx.status = 400;
      ctx.body = { error: 'Missing organization_slug' };
      return;
    }

    // Get organization ID
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organization_slug)
      .single();

    if (!org) {
      ctx.status = 404;
      ctx.body = { error: 'Organization not found' };
      return;
    }

    // Fetch organization members with individual details
    const { data: members, error } = await supabase
      .from('organization_members')
      .select(`
        individual_id,
        role_code,
        individuals!individual_id(
          id,
          display_name,
          avatar_url,
          primary_email
        )
      `)
      .eq('organization_id', org.id);

    if (error) throw error;

    // Transform to flat structure
    const individuals = members.map((member) => ({
      id: member.individuals.id,
      display_name: member.individuals.display_name,
      avatar_url: member.individuals.avatar_url,
      primary_email: member.individuals.primary_email,
      role_code: member.role_code,
    }));

    ctx.status = 200;
    ctx.body = individuals;
  } catch (error) {
    console.error('Error fetching organization members:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch organization members' };
  }
}

// ============================================================================
// SALES ORDER STATUS CONFIGURATION ENDPOINTS
// ============================================================================

// Default statuses (fallback if not configured)
const DEFAULT_STATUSES = [
  { status_key: 'draft', status_label: 'Draft', status_color: '#6B7280', is_completed_status: false, sort_order: 0 },
  { status_key: 'confirmed', status_label: 'Confirmed', status_color: '#3B82F6', is_completed_status: false, sort_order: 1 },
  { status_key: 'processing', status_label: 'Processing', status_color: '#F59E0B', is_completed_status: false, sort_order: 2 },
  { status_key: 'shipped', status_label: 'Shipped', status_color: '#8B5CF6', is_completed_status: false, sort_order: 3 },
  { status_key: 'delivered', status_label: 'Delivered', status_color: '#10B981', is_completed_status: true, sort_order: 4 },
  { status_key: 'cancelled', status_label: 'Cancelled', status_color: '#EF4444', is_completed_status: false, sort_order: 5 },
];

/**
 * GET /api/sales_order_statuses
 * Get configured statuses for organization
 */
async function getSalesOrderStatuses(ctx) {
  try {
    const { organization_slug } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    const { data, error } = await supabase
      .from('sales_document_status_config')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('document_type', 'sales_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw error;
    }

    // If no statuses configured, return defaults
    if (!data || data.length === 0) {
      ctx.body = DEFAULT_STATUSES;
    } else {
      ctx.body = data;
    }
  } catch (error) {
    console.error('Error fetching sales order statuses:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * PUT /api/sales_order_statuses
 * Update all statuses for organization (batch update)
 */
async function updateSalesOrderStatuses(ctx) {
  try {
    const { organization_slug } = ctx.query;
    const statuses = ctx.request.body; // Array of status objects

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    if (!Array.isArray(statuses) || statuses.length === 0) {
      return (ctx.status = 400), (ctx.body = { error: 'Invalid statuses data' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    // Validation: Exactly one completed status
    const completedCount = statuses.filter(s => s.is_completed_status).length;
    if (completedCount !== 1) {
      return (ctx.status = 400), (ctx.body = {
        error: 'Exactly one status must be marked as completed'
      });
    }

    // Validation: All must have labels
    if (statuses.some(s => !s.status_label || !s.status_label.trim())) {
      return (ctx.status = 400), (ctx.body = {
        error: 'All statuses must have a label'
      });
    }

    // Delete existing statuses for this document type
    await supabase
      .from('sales_document_status_config')
      .delete()
      .eq('organization_id', organizationId)
      .eq('document_type', 'sales_order');

    // Insert new statuses
    const statusesToInsert = statuses.map((status, index) => ({
      organization_id: organizationId,
      document_type: 'sales_order',
      status_key: status.status_key || status.status_label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      status_label: status.status_label,
      status_color: status.status_color || '#3B82F6',
      is_completed_status: status.is_completed_status || false,
      sort_order: index,
      is_active: true,
    }));

    const { data, error } = await supabase
      .from('sales_document_status_config')
      .insert(statusesToInsert)
      .select();

    if (error) throw error;

    ctx.body = data;
  } catch (error) {
    console.error('Error updating sales order statuses:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

module.exports = {
  // Settings
  getSalesOrderSettings,
  updateSalesOrderSettings,
  previewOrderFormat,

  // Sales Orders
  getSalesOrders,
  getSalesOrder,
  getDeliverySummary,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,

  // Sales Teams
  getSalesTeams,
  getSalesTeam,
  createSalesTeam,
  updateSalesTeam,
  deleteSalesTeam,
  addTeamMember,
  removeTeamMember,

  // Organization Members
  getOrganizationMembers,

  // Status Configuration
  getSalesOrderStatuses,
  updateSalesOrderStatuses,
};
