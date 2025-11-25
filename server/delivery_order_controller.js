/**
 * Delivery Order Controller
 * Handles all business logic for delivery order management
 * Routes for: delivery_orders, delivery_order_items, delivery_order_settings
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
 */
async function getTeamMemberIds(organizationId, currentIndividualId) {
  const { data: ledTeams } = await supabase
    .from('sales_teams')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('team_lead_individual_id', currentIndividualId)
    .eq('is_active', true);

  const { data: memberTeams } = await supabase
    .from('sales_team_members')
    .select('sales_team_id')
    .eq('individual_id', currentIndividualId);

  const teamIds = new Set([
    ...(ledTeams || []).map(t => t.id),
    ...(memberTeams || []).map(t => t.sales_team_id)
  ]);

  if (teamIds.size === 0) {
    return [currentIndividualId];
  }

  const { data: allMembers } = await supabase
    .from('sales_team_members')
    .select('individual_id')
    .in('sales_team_id', Array.from(teamIds));

  const { data: allLeads } = await supabase
    .from('sales_teams')
    .select('team_lead_individual_id')
    .in('id', Array.from(teamIds));

  const individualIds = new Set([
    currentIndividualId,
    ...(allMembers || []).map(m => m.individual_id),
    ...(allLeads || []).map(l => l.team_lead_individual_id)
  ]);

  return Array.from(individualIds).filter(Boolean);
}

// ============================================================================
// DELIVERY ORDER SETTINGS ENDPOINTS
// ============================================================================

/**
 * GET /api/delivery_order_settings
 */
async function getDeliveryOrderSettings(ctx) {
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
      .from('sales_document_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('document_type', 'delivery_order')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      ctx.body = {
        order_code_format: 'DO-{YYMM}-{5digits}',
        current_counter: 0,
        reset_period: 'monthly',
        sales_order_visibility: 'organization',
        enable_sales_teams: false,
      };
    } else {
      ctx.body = data;
    }
  } catch (error) {
    console.error('Error fetching delivery order settings:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * PUT /api/delivery_order_settings
 */
async function updateDeliveryOrderSettings(ctx) {
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

    // Filter out fields that don't exist in sales_document_settings table
    const { default_status, ...validUpdates } = updates;

    const { data, error } = await supabase
      .from('sales_document_settings')
      .upsert({
        organization_id: organizationId,
        document_type: 'delivery_order',
        ...validUpdates,
      }, {
        onConflict: 'organization_id,document_type'
      })
      .select()
      .single();

    if (error) throw error;

    ctx.body = data;
  } catch (error) {
    console.error('Error updating delivery order settings:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/delivery_order_settings/preview
 */
async function previewDeliveryOrderFormat(ctx) {
  try {
    const { format, counter } = ctx.request.body;

    if (!format) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing format' });
    }

    const preview = previewFormat(format, counter || 1);
    ctx.body = { preview };
  } catch (error) {
    console.error('Error previewing format:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// ============================================================================
// DELIVERY ORDER ENDPOINTS
// ============================================================================

/**
 * GET /api/delivery_orders
 */
async function getDeliveryOrders(ctx) {
  try {
    const { organization_slug, status, customer_id, sales_order_id, sales_person_id, date_from, date_to } = ctx.query;

    if (!organization_slug) {
      return (ctx.status = 400), (ctx.body = { error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return (ctx.status = 404), (ctx.body = { error: 'Organization not found' });
    }

    const currentIndividualId = ctx.session?.individual_id;

    const { data: settings } = await supabase
      .from('sales_document_settings')
      .select('sales_order_visibility, enable_sales_teams')
      .eq('organization_id', organizationId)
      .eq('document_type', 'delivery_order')
      .single();

    let query = supabase
      .from('delivery_orders')
      .select(`
        *,
        customer:contacts!customer_contact_id (id, first_name, last_name, company_name),
        sales_person:individuals!sales_person_individual_id (id, display_name, primary_email, avatar_url),
        sales_order:sales_orders!sales_order_id (id, order_code)
      `)
      .eq('organization_id', organizationId)
      .eq('is_deleted', false);

    // Apply visibility filtering
    const visibility = settings?.sales_order_visibility || 'organization';
    if (visibility === 'team_based' && currentIndividualId) {
      const teamMemberIds = await getTeamMemberIds(organizationId, currentIndividualId);
      query = query.in('sales_person_individual_id', teamMemberIds);
    } else if (visibility === 'assigned_only' && currentIndividualId) {
      query = query.eq('sales_person_individual_id', currentIndividualId);
    }

    // Apply filters
    if (status) query = query.eq('status', status);
    if (customer_id) query = query.eq('customer_contact_id', customer_id);
    if (sales_order_id) query = query.eq('sales_order_id', sales_order_id);
    if (sales_person_id) query = query.eq('sales_person_individual_id', sales_person_id);
    if (date_from) query = query.gte('delivery_date', date_from);
    if (date_to) query = query.lte('delivery_date', date_to);

    query = query.order('delivery_date', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    ctx.body = data || [];
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * GET /api/delivery_orders/:id
 */
async function getDeliveryOrder(ctx) {
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

    // Fetch delivery order
    const { data: deliveryOrder, error: orderError } = await supabase
      .from('delivery_orders')
      .select(`
        *,
        customer:contacts!customer_contact_id (id, first_name, last_name, company_name, email, phone_1),
        sales_person:individuals!sales_person_individual_id (id, display_name, primary_email, avatar_url),
        sales_order:sales_orders!sales_order_id (id, order_code)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('is_deleted', false)
      .single();

    if (orderError) throw orderError;

    // Fetch items
    const { data: items, error: itemsError } = await supabase
      .from('delivery_order_items')
      .select(`
        *,
        product:inventory_products (id, sku, name, unit, category)
      `)
      .eq('delivery_order_id', id)
      .order('line_order', { ascending: true });

    if (itemsError) throw itemsError;

    ctx.body = {
      ...deliveryOrder,
      items: items || [],
    };
  } catch (error) {
    console.error('Error fetching delivery order:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/delivery_orders
 */
async function createDeliveryOrder(ctx) {
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

    // Get settings or create if not exists
    let { data: settings } = await supabase
      .from('sales_document_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('document_type', 'delivery_order')
      .single();

    // If settings don't exist, create defaults
    if (!settings) {
      const { data: newSettings, error: insertError } = await supabase
        .from('sales_document_settings')
        .insert({
          organization_id: organizationId,
          document_type: 'delivery_order',
          order_code_format: 'DO-{YYMM}-{5digits}',
          current_counter: 0,
          reset_period: 'monthly',
          default_status: 'draft',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      settings = newSettings;
    }

    // Generate order code
    const currentDate = new Date();
    const nextCounter = getNextCounter(
      settings.current_counter,
      settings.reset_period,
      settings.last_reset_date,
      currentDate
    );

    const orderCode = generateOrderCode(settings.order_code_format, nextCounter, currentDate);

    // Update counter BEFORE creating the order to prevent race conditions
    const { error: updateError } = await supabase
      .from('sales_document_settings')
      .update({
        current_counter: nextCounter,
        last_reset_date: currentDate.toISOString().split('T')[0],
      })
      .eq('organization_id', organizationId)
      .eq('document_type', 'delivery_order');

    if (updateError) throw updateError;

    // Insert delivery order
    const { data: newOrder, error: orderError } = await supabase
      .from('delivery_orders')
      .insert({
        organization_id: organizationId,
        delivery_order_code: orderCode,
        delivery_date: orderData.delivery_date,
        sales_order_id: orderData.sales_order_id || null,
        customer_contact_id: orderData.customer_contact_id,
        sales_person_individual_id: orderData.sales_person_individual_id,
        billing_address: orderData.billing_address,
        delivery_address: orderData.delivery_address,
        delivery_contact_name: orderData.delivery_contact_name,
        delivery_contact_phone: orderData.delivery_contact_phone,
        shipping_method: orderData.shipping_method,
        tracking_number: orderData.tracking_number,
        status: orderData.status || 'draft',
        notes: orderData.notes,
        internal_notes: orderData.internal_notes,
        created_by_individual_id: currentIndividualId,
        updated_by_individual_id: currentIndividualId,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert items
    if (orderData.items && orderData.items.length > 0) {
      const itemsToInsert = orderData.items.map((item, index) => ({
        delivery_order_id: newOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit: item.unit,
        sales_order_item_id: item.sales_order_item_id || null,
        notes: item.notes,
        line_order: index,
      }));

      const { error: itemsError } = await supabase
        .from('delivery_order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    ctx.body = newOrder;
  } catch (error) {
    console.error('Error creating delivery order:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * PUT /api/delivery_orders/:id
 */
async function updateDeliveryOrder(ctx) {
  try {
    const { id } = ctx.params;
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

    // Update delivery order
    const { data: updatedOrder, error: orderError } = await supabase
      .from('delivery_orders')
      .update({
        delivery_date: orderData.delivery_date,
        customer_contact_id: orderData.customer_contact_id,
        sales_person_individual_id: orderData.sales_person_individual_id,
        billing_address: orderData.billing_address,
        delivery_address: orderData.delivery_address,
        delivery_contact_name: orderData.delivery_contact_name,
        delivery_contact_phone: orderData.delivery_contact_phone,
        shipping_method: orderData.shipping_method,
        tracking_number: orderData.tracking_number,
        status: orderData.status,
        notes: orderData.notes,
        internal_notes: orderData.internal_notes,
        updated_by_individual_id: currentIndividualId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (orderError) throw orderError;

    // Update items
    if (orderData.items) {
      // Delete existing items
      await supabase.from('delivery_order_items').delete().eq('delivery_order_id', id);

      // Insert new items
      if (orderData.items.length > 0) {
        const itemsToInsert = orderData.items.map((item, index) => ({
          delivery_order_id: id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit: item.unit,
          sales_order_item_id: item.sales_order_item_id || null,
          notes: item.notes,
          line_order: index,
        }));

        await supabase.from('delivery_order_items').insert(itemsToInsert);
      }
    }

    ctx.body = updatedOrder;
  } catch (error) {
    console.error('Error updating delivery order:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * DELETE /api/delivery_orders/:id
 */
async function deleteDeliveryOrder(ctx) {
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

    // Soft delete
    const { error } = await supabase
      .from('delivery_orders')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    ctx.body = { success: true };
  } catch (error) {
    console.error('Error deleting delivery order:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * POST /api/delivery_orders/:id/mark-delivered
 */
async function markDelivered(ctx) {
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

    const currentIndividualId = ctx.session?.individual_id;

    const { data, error } = await supabase
      .from('delivery_orders')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        delivered_by_individual_id: currentIndividualId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;

    ctx.body = data;
  } catch (error) {
    console.error('Error marking delivery order as delivered:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}



// ============================================================================
// DELIVERY ORDER STATUS CONFIGURATION ENDPOINTS
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
 * GET /api/delivery_order_statuses
 * Get configured statuses for organization
 */
async function getDeliveryOrderStatuses(ctx) {
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
      .eq('document_type', 'delivery_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no statuses configured, return defaults
    if (!data || data.length === 0) {
      ctx.body = DEFAULT_STATUSES;
    } else {
      ctx.body = data;
    }
  } catch (error) {
    console.error('Error fetching delivery order statuses:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

/**
 * PUT /api/delivery_order_statuses
 * Update all statuses for organization (batch update)
 */
async function updateDeliveryOrderStatuses(ctx) {
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
      .eq('document_type', 'delivery_order');

    // Insert new statuses
    const statusesToInsert = statuses.map((status, index) => ({
      organization_id: organizationId,
      document_type: 'delivery_order',
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
    console.error('Error updating delivery order statuses:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

module.exports = {
  getDeliveryOrderSettings,
  updateDeliveryOrderSettings,
  previewDeliveryOrderFormat,
  getDeliveryOrders,
  getDeliveryOrder,
  createDeliveryOrder,
  updateDeliveryOrder,
  deleteDeliveryOrder,
  markDelivered,
  getDeliveryOrderStatuses,
  updateDeliveryOrderStatuses,
};
