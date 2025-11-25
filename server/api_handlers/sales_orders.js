/**
 * Vercel API Handler for Sales Orders
 * Mirrors sales_order_controller.js for serverless deployment
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
 * Apply visibility filter based on organization settings
 */
async function applyVisibilityFilter(query, organizationId, currentIndividualId) {
  const { data: settings } = await supabase
    .from('sales_document_settings')
    .select('sales_order_visibility, enable_sales_teams')
    .eq('organization_id', organizationId)
    .eq('document_type', 'sales_order')
    .single();

  const visibility = settings?.sales_order_visibility || 'organization';

  switch (visibility) {
    case 'assigned_only':
      return query.eq('sales_person_individual_id', currentIndividualId);

    case 'team_based':
      if (settings?.enable_sales_teams) {
        const { data: ledTeams } = await supabase
          .from('sales_teams')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('team_lead_individual_id', currentIndividualId);

        if (ledTeams && ledTeams.length > 0) {
          const teamIds = ledTeams.map((t) => t.id);
          const { data: members } = await supabase
            .from('sales_team_members')
            .select('individual_id')
            .in('sales_team_id', teamIds);

          const memberIds = members?.map((m) => m.individual_id) || [];
          const visibleIds = [currentIndividualId, ...memberIds];

          return query.in('sales_person_individual_id', visibleIds);
        }
      }
      return query.eq('sales_person_individual_id', currentIndividualId);

    case 'organization':
    default:
      return query;
  }
}

/**
 * Main handler
 */
module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  const { method, query } = req;
  let { organization_slug, id } = query;

  // Extract ID from URL if not in query (for catch-all routing)
  if (!id) {
    // Match UUID in path: /sales_orders/UUID
    const match = req.url.match(/\/sales_orders\/([a-f0-9-]{36})/);
    if (match) {
      id = match[1];
    }
  }

  try {
    // Settings endpoints
    if (req.url.includes('/sales_order_settings/preview_format')) {
      if (method === 'POST') {
        const { format, sample_counter = 1 } = req.body;
        const result = previewFormat(format, sample_counter);
        return res.status(200).json(result);
      }
    }

    if (req.url.includes('/sales_order_settings')) {
      if (method === 'GET') {
        const organizationId = await getOrganizationId(organization_slug);
        if (!organizationId) {
          return res.status(404).json({ error: 'Organization not found' });
        }

        const { data, error } = await supabase
          .from('sales_document_settings')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('document_type', 'sales_order')
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (!data) {
          return res.status(200).json({
            order_code_format: 'SO-{YYMM}-{5digits}',
            current_counter: 1,
            reset_period: 'monthly',
            default_tax_rate: 0.0,
            sales_order_visibility: 'organization',
            enable_sales_teams: false,
          });
        }

        return res.status(200).json(data);
      }

      if (method === 'PUT') {
        const organizationId = await getOrganizationId(organization_slug);
        if (!organizationId) {
          return res.status(404).json({ error: 'Organization not found' });
        }

        const updates = req.body;

        if (updates.order_code_format) {
          const validation = validateFormat(updates.order_code_format);
          if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
          }
        }

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
        return res.status(200).json(data);
      }
    }

    // Sales order status configuration endpoints
    if (req.url.includes('/sales_order_statuses')) {
      const organizationId = await getOrganizationId(organization_slug);
      if (!organizationId) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      // GET /api/sales_order_statuses
      if (method === 'GET') {
        const { data, error } = await supabase
          .from('sales_document_status_config')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('document_type', 'sales_order')
          .eq('is_active', true)
          .order('sort_order');

        if (error) throw error;

        // Return defaults if no statuses configured
        if (!data || data.length === 0) {
          const DEFAULT_STATUSES = [
            { status_key: 'draft', status_label: 'Draft', status_color: '#6B7280', is_completed_status: false, sort_order: 0 },
            { status_key: 'confirmed', status_label: 'Confirmed', status_color: '#3B82F6', is_completed_status: false, sort_order: 1 },
            { status_key: 'processing', status_label: 'Processing', status_color: '#F59E0B', is_completed_status: false, sort_order: 2 },
            { status_key: 'shipped', status_label: 'Shipped', status_color: '#8B5CF6', is_completed_status: false, sort_order: 3 },
            { status_key: 'delivered', status_label: 'Delivered', status_color: '#10B981', is_completed_status: true, sort_order: 4 },
            { status_key: 'cancelled', status_label: 'Cancelled', status_color: '#EF4444', is_completed_status: false, sort_order: 5 },
          ];
          return res.status(200).json(DEFAULT_STATUSES);
        }

        return res.status(200).json(data);
      }

      // PUT /api/sales_order_statuses (bulk update)
      if (method === 'PUT') {
        const statuses = req.body;

        // Validation: Exactly one completed status
        const completedCount = statuses.filter(s => s.is_completed_status).length;
        if (completedCount !== 1) {
          return res.status(400).json({
            error: 'Exactly one status must be marked as completed for revenue calculation'
          });
        }

        // Validation: All statuses must have labels
        if (statuses.some(s => !s.status_label || !s.status_label.trim())) {
          return res.status(400).json({
            error: 'All statuses must have a label'
          });
        }

        // Delete existing statuses
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
          sort_order: status.sort_order !== undefined ? status.sort_order : index,
          is_active: status.is_active !== undefined ? status.is_active : true,
        }));

        const { data, error } = await supabase
          .from('sales_document_status_config')
          .insert(statusesToInsert)
          .select();

        if (error) throw error;
        return res.status(200).json(data);
      }
    }

    // Sales orders endpoints
    if (req.url.includes('/sales_orders')) {
      const organizationId = await getOrganizationId(organization_slug);
      if (!organizationId) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      // GET /api/sales_orders (list)
      if (method === 'GET' && !id) {
        const { status, customer_id, sales_person_id, date_from, date_to } = query;
        const currentIndividualId = req.session?.individual_id;

        let queryBuilder = supabase
          .from('sales_orders')
          .select(`
            *,
            customer:contacts!customer_contact_id (id, first_name, last_name, company_name),
            sales_person:individuals!sales_person_individual_id (id, name, email)
          `)
          .eq('organization_id', organizationId)
          .eq('is_deleted', false);

        // Apply visibility filter (returns Promise<query builder>)
        queryBuilder = await applyVisibilityFilter(queryBuilder, organizationId, currentIndividualId);

        // Apply additional filters
        if (status) queryBuilder = queryBuilder.eq('status', status);
        if (customer_id) queryBuilder = queryBuilder.eq('customer_contact_id', customer_id);
        if (sales_person_id) queryBuilder = queryBuilder.eq('sales_person_individual_id', sales_person_id);
        if (date_from) queryBuilder = queryBuilder.gte('order_date', date_from);
        if (date_to) queryBuilder = queryBuilder.lte('order_date', date_to);

        // Apply ordering and execute query
        const { data, error } = await queryBuilder.order('order_date', { ascending: false });
        if (error) throw error;

        return res.status(200).json(data || []);
      }

      // GET /api/sales_orders/:id/delivery_summary (delivery progress)
      if (method === 'GET' && id && req.url.includes('/delivery_summary')) {
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

          return res.status(200).json(formattedData);
        } catch (err) {
          console.error('Error fetching delivery summary:', err);
          return res.status(500).json({ error: 'Failed to fetch delivery summary' });
        }
      }

      // GET /api/sales_orders/:id (single)
      if (method === 'GET' && id) {
        const { data: order, error: orderError } = await supabase
          .from('sales_orders')
          .select(`
            *,
            customer:contacts!customer_contact_id (id, first_name, last_name, company_name, email, phone_1),
            sales_person:individuals!sales_person_individual_id (id, name, email)
          `)
          .eq('id', id)
          .eq('organization_id', organizationId)
          .eq('is_deleted', false)
          .single();

        if (orderError) throw orderError;

        const { data: items, error: itemsError } = await supabase
          .from('sales_order_items')
          .select(`
            *,
            product:inventory_products (id, sku, name, unit, category)
          `)
          .eq('sales_order_id', id)
          .order('line_order', { ascending: true });

        if (itemsError) throw itemsError;

        return res.status(200).json({
          ...order,
          items: items || [],
        });
      }

      // POST /api/sales_orders (create)
      if (method === 'POST') {
        const orderData = req.body;
        const currentIndividualId = req.session?.individual_id;

        const { data: settings } = await supabase
          .from('sales_document_settings')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('document_type', 'sales_order')
          .single();

        if (!settings) {
          return res.status(400).json({ error: 'Sales order settings not configured' });
        }

        const currentDate = new Date();
        const nextCounter = getNextCounter(
          settings.current_counter,
          settings.reset_period,
          settings.last_reset_date,
          currentDate
        );

        const orderCode = generateOrderCode(settings.order_code_format, nextCounter, currentDate);

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

        await supabase
          .from('sales_document_settings')
          .update({
            current_counter: nextCounter,
            last_reset_date: currentDate.toISOString().split('T')[0],
          })
          .eq('organization_id', organizationId)
          .eq('document_type', 'sales_order');

        return res.status(200).json(order);
      }

      // PUT /api/sales_orders/:id (update)
      if (method === 'PUT' && id) {
        const updates = req.body;
        const currentIndividualId = req.session?.individual_id;

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

        if (updates.items) {
          await supabase.from('sales_order_items').delete().eq('sales_order_id', id);

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

        return res.status(200).json(order);
      }

      // DELETE /api/sales_orders/:id (soft delete)
      if (method === 'DELETE' && id) {
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
        return res.status(200).json({ success: true, data });
      }
    }

    // Sales teams endpoints (basic implementation)
    if (req.url.includes('/sales_teams')) {
      const organizationId = await getOrganizationId(organization_slug);
      if (!organizationId) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      if (method === 'GET' && !id) {
        const { data: teams, error } = await supabase
          .from('sales_teams')
          .select(`
            *,
            team_lead:individuals!team_lead_individual_id (id, name, email)
          `)
          .eq('organization_id', organizationId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

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

        return res.status(200).json(teamsWithCounts);
      }

      if (method === 'POST') {
        const teamData = req.body;
        const currentIndividualId = req.session?.individual_id;

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
        return res.status(200).json(data);
      }

      // POST /api/sales_teams/:id/members - Add team member
      if (method === 'POST' && id && req.url.includes('/members')) {
        const { individual_id, role = 'member' } = req.body;

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
        return res.status(200).json(data);
      }

      // DELETE /api/sales_teams/:id/members/:individualId - Remove team member
      if (method === 'DELETE' && id && req.url.includes('/members/')) {
        const memberMatch = req.url.match(/\/members\/([a-f0-9-]+)/);
        const individualId = memberMatch ? memberMatch[1] : null;

        if (!individualId) {
          return res.status(400).json({ error: 'Missing individual_id' });
        }

        const { error } = await supabase
          .from('sales_team_members')
          .delete()
          .eq('sales_team_id', id)
          .eq('individual_id', individualId);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }
    }

    // GET /api/sales_management/members - Get organization members for dropdowns
    if (method === 'GET' && path === '/api/sales_management/members') {
      const { organization_slug } = query;

      if (!organization_slug) {
        return res.status(400).json({ error: 'Missing organization_slug' });
      }

      const organizationId = await getOrganizationId(organization_slug);
      if (!organizationId) {
        return res.status(404).json({ error: 'Organization not found' });
      }

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
        .eq('organization_id', organizationId);

      if (error) throw error;

      // Transform to flat structure
      const individuals = members.map((member) => ({
        id: member.individuals.id,
        display_name: member.individuals.display_name,
        avatar_url: member.individuals.avatar_url,
        primary_email: member.individuals.primary_email,
        role_code: member.role_code,
      }));

      return res.status(200).json(individuals);
    }

    res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('Sales orders API error:', error);
    res.status(500).json({ error: error.message });
  }
};
