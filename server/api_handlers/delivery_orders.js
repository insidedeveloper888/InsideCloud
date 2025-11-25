/**
 * Vercel API Handler for Delivery Orders
 * Mirrors delivery_order_controller.js for serverless deployment
 */

const { createClient } = require('@supabase/supabase-js');
const {
  generateOrderCode,
  shouldResetCounter,
  validateFormat,
  previewFormat,
  getNextCounter,
} = require('../utils/order_code_generator');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CORS helper
function handleCors(req, res) {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://inside-cloud.vercel.app',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

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

// Default statuses (fallback if not configured)
const DEFAULT_STATUSES = [
  { status_key: 'draft', status_label: 'Draft', status_color: '#6B7280', is_completed_status: false, sort_order: 0 },
  { status_key: 'confirmed', status_label: 'Confirmed', status_color: '#3B82F6', is_completed_status: false, sort_order: 1 },
  { status_key: 'processing', status_label: 'Processing', status_color: '#F59E0B', is_completed_status: false, sort_order: 2 },
  { status_key: 'shipped', status_label: 'Shipped', status_color: '#8B5CF6', is_completed_status: false, sort_order: 3 },
  { status_key: 'delivered', status_label: 'Delivered', status_color: '#10B981', is_completed_status: true, sort_order: 4 },
  { status_key: 'cancelled', status_label: 'Cancelled', status_color: '#EF4444', is_completed_status: false, sort_order: 5 },
];

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/delivery_order_settings
 */
async function getDeliveryOrderSettings(req, res) {
  try {
    const { organization_slug } = req.query;

    if (!organization_slug) {
      return res.status(400).json({ error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return res.status(404).json({ error: 'Organization not found' });
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
      return res.status(200).json({
        order_code_format: 'DO-{YYMM}-{5digits}',
        current_counter: 0,
        reset_period: 'monthly',
        sales_order_visibility: 'organization',
        enable_sales_teams: false,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching delivery order settings:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/delivery_order_settings
 */
async function updateDeliveryOrderSettings(req, res) {
  try {
    const { organization_slug } = req.query;
    const updates = req.body;

    if (!organization_slug) {
      return res.status(400).json({ error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return res.status(404).json({ error: 'Organization not found' });
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

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating delivery order settings:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/delivery_order_settings/preview_format
 */
async function previewDeliveryOrderFormat(req, res) {
  try {
    const { format, counter } = req.body;

    if (!format) {
      return res.status(400).json({ error: 'Missing format' });
    }

    const preview = previewFormat(format, counter || 1);
    return res.status(200).json({ preview });
  } catch (error) {
    console.error('Error previewing format:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/delivery_order_statuses
 */
async function getDeliveryOrderStatuses(req, res) {
  try {
    const { organization_slug } = req.query;

    if (!organization_slug) {
      return res.status(400).json({ error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return res.status(404).json({ error: 'Organization not found' });
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
      return res.status(200).json(DEFAULT_STATUSES);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching delivery order statuses:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/delivery_order_statuses
 */
async function updateDeliveryOrderStatuses(req, res) {
  try {
    const { organization_slug } = req.query;
    const statuses = req.body;

    if (!organization_slug) {
      return res.status(400).json({ error: 'Missing organization_slug' });
    }

    if (!Array.isArray(statuses) || statuses.length === 0) {
      return res.status(400).json({ error: 'Invalid statuses data' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Validation: Exactly one completed status
    const completedCount = statuses.filter(s => s.is_completed_status).length;
    if (completedCount !== 1) {
      return res.status(400).json({
        error: 'Exactly one status must be marked as completed'
      });
    }

    // Validation: All must have labels
    if (statuses.some(s => !s.status_label || !s.status_label.trim())) {
      return res.status(400).json({
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

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating delivery order statuses:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/delivery_orders
 */
async function getDeliveryOrders(req, res) {
  try {
    const { organization_slug, status, customer_id, sales_order_id, sales_person_id, date_from, date_to } = req.query;

    if (!organization_slug) {
      return res.status(400).json({ error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const currentIndividualId = req.session?.individual_id;

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

    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/delivery_orders/:id
 */
async function getDeliveryOrder(req, res, id) {
  try {
    const { organization_slug } = req.query;

    if (!organization_slug) {
      return res.status(400).json({ error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return res.status(404).json({ error: 'Organization not found' });
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

    return res.status(200).json({
      ...deliveryOrder,
      items: items || [],
    });
  } catch (error) {
    console.error('Error fetching delivery order:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/delivery_orders
 */
async function createDeliveryOrder(req, res) {
  try {
    const { organization_slug } = req.query;
    const orderData = req.body;

    if (!organization_slug) {
      return res.status(400).json({ error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const currentIndividualId = req.session?.individual_id;

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

    return res.status(200).json(newOrder);
  } catch (error) {
    console.error('Error creating delivery order:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/delivery_orders/:id
 */
async function updateDeliveryOrder(req, res, id) {
  try {
    const { organization_slug } = req.query;
    const orderData = req.body;

    if (!organization_slug) {
      return res.status(400).json({ error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const currentIndividualId = req.session?.individual_id;

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

    return res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error updating delivery order:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/delivery_orders/:id
 */
async function deleteDeliveryOrder(req, res, id) {
  try {
    const { organization_slug } = req.query;

    if (!organization_slug) {
      return res.status(400).json({ error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Soft delete
    const { error } = await supabase
      .from('delivery_orders')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting delivery order:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/delivery_orders/:id/mark-delivered
 */
async function markDelivered(req, res, id) {
  try {
    const { organization_slug } = req.query;

    if (!organization_slug) {
      return res.status(400).json({ error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const currentIndividualId = req.session?.individual_id;

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

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error marking delivery order as delivered:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * Main handler
 */
module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  const path = req.url.split('?')[0];
  const method = req.method;
  const { query } = req;

  // Extract ID from URL if present
  let id = query.id;
  if (!id) {
    // Match UUID in path: /delivery_orders/UUID
    const match = req.url.match(/\/delivery_orders\/([a-f0-9-]{36})/);
    if (match) {
      id = match[1];
    }
  }

  try {
    // Settings endpoints
    if (path.includes('/delivery_order_settings/preview_format')) {
      if (method === 'POST') {
        return previewDeliveryOrderFormat(req, res);
      }
    }

    if (path.includes('/delivery_order_settings')) {
      if (method === 'GET') {
        return getDeliveryOrderSettings(req, res);
      }
      if (method === 'PUT') {
        return updateDeliveryOrderSettings(req, res);
      }
    }

    // Status configuration endpoints
    if (path.includes('/delivery_order_statuses')) {
      if (method === 'GET') {
        return getDeliveryOrderStatuses(req, res);
      }
      if (method === 'PUT') {
        return updateDeliveryOrderStatuses(req, res);
      }
    }

    // Delivery orders endpoints
    if (path.includes('/delivery_orders')) {
      // POST /api/delivery_orders/:id/mark-delivered
      if (method === 'POST' && id && path.includes('/mark-delivered')) {
        return markDelivered(req, res, id);
      }

      // GET /api/delivery_orders (list)
      if (method === 'GET' && !id) {
        return getDeliveryOrders(req, res);
      }

      // GET /api/delivery_orders/:id (single)
      if (method === 'GET' && id) {
        return getDeliveryOrder(req, res, id);
      }

      // POST /api/delivery_orders (create)
      if (method === 'POST' && !id) {
        return createDeliveryOrder(req, res);
      }

      // PUT /api/delivery_orders/:id (update)
      if (method === 'PUT' && id) {
        return updateDeliveryOrder(req, res, id);
      }

      // DELETE /api/delivery_orders/:id (soft delete)
      if (method === 'DELETE' && id) {
        return deleteDeliveryOrder(req, res, id);
      }
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('Delivery orders API error:', error);
    return res.status(500).json({ error: error.message });
  }
};
