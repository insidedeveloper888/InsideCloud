/**
 * Vercel API Handler for Invoices
 * Mirrors invoice_controller.js for serverless deployment
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

/**
 * Recalculate invoice status based on payments
 */
function calculateInvoiceStatus(totalAmount, amountPaid, dueDate) {
  if (amountPaid >= totalAmount) {
    return 'paid';
  } else if (amountPaid > 0) {
    return 'partially_paid';
  } else if (dueDate && new Date(dueDate) < new Date()) {
    return 'overdue';
  }
  return 'draft';
}

// Default statuses (fallback if not configured)
const DEFAULT_STATUSES = [
  { status_key: 'draft', status_label: 'Draft', status_color: '#6B7280', is_completed_status: false, sort_order: 0 },
  { status_key: 'sent', status_label: 'Sent', status_color: '#3B82F6', is_completed_status: false, sort_order: 1 },
  { status_key: 'partially_paid', status_label: 'Partially Paid', status_color: '#F59E0B', is_completed_status: false, sort_order: 2 },
  { status_key: 'paid', status_label: 'Paid', status_color: '#10B981', is_completed_status: true, sort_order: 3 },
  { status_key: 'overdue', status_label: 'Overdue', status_color: '#EF4444', is_completed_status: false, sort_order: 4 },
  { status_key: 'cancelled', status_label: 'Cancelled', status_color: '#9CA3AF', is_completed_status: false, sort_order: 5 },
];

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/invoice_settings
 */
async function getInvoiceSettings(req, res) {
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
      .eq('document_type', 'invoice')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return res.status(200).json({
        order_code_format: 'INV-{YYMM}-{5digits}',
        current_counter: 0,
        reset_period: 'monthly',
        default_tax_rate: 0.0,
        sales_order_visibility: 'organization',
        enable_sales_teams: false,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching invoice settings:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/invoice_settings
 */
async function updateInvoiceSettings(req, res) {
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
        document_type: 'invoice',
        ...validUpdates,
      }, {
        onConflict: 'organization_id,document_type'
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating invoice settings:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/invoice_settings/preview_format
 */
async function previewInvoiceFormat(req, res) {
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
 * GET /api/invoice_statuses
 */
async function getInvoiceStatuses(req, res) {
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
      .eq('document_type', 'invoice')
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
    console.error('Error fetching invoice statuses:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/invoice_statuses
 */
async function updateInvoiceStatuses(req, res) {
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
      .eq('document_type', 'invoice');

    // Insert new statuses
    const statusesToInsert = statuses.map((status, index) => ({
      organization_id: organizationId,
      document_type: 'invoice',
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
    console.error('Error updating invoice statuses:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/invoices
 */
async function getInvoices(req, res) {
  try {
    const { organization_slug, status, customer_id, sales_order_id, sales_person_id, date_from, date_to, overdue } = req.query;

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
      .eq('document_type', 'invoice')
      .single();

    let query = supabase
      .from('invoices')
      .select(`
        *,
        customer:contacts!customer_contact_id (id, first_name, last_name, company_name),
        sales_person:individuals!sales_person_individual_id (id, display_name, primary_email, avatar_url),
        sales_order:sales_orders!sales_order_id (id, order_code),
        delivery_order:delivery_orders!delivery_order_id (id, delivery_order_code)
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
    if (date_from) query = query.gte('invoice_date', date_from);
    if (date_to) query = query.lte('invoice_date', date_to);
    if (overdue === 'true') {
      query = query.lt('due_date', new Date().toISOString().split('T')[0]);
      query = query.gt('amount_due', 0);
    }

    query = query.order('invoice_date', { ascending: false });

    const { data: invoices, error } = await query;

    if (error) throw error;

    // Fetch items for each invoice
    const invoicesWithItems = await Promise.all(
      (invoices || []).map(async (invoice) => {
        const { data: items } = await supabase
          .from('invoice_items')
          .select(`
            *,
            product:inventory_products (id, sku, name, unit, category)
          `)
          .eq('invoice_id', invoice.id)
          .order('line_order', { ascending: true });

        return {
          ...invoice,
          items: items || [],
        };
      })
    );

    // Fetch team information for sales persons
    const salesPersonIds = invoicesWithItems
      .map(inv => inv.sales_person_individual_id)
      .filter(Boolean);

    if (salesPersonIds.length > 0) {
      console.log('Sales person IDs to fetch teams for:', salesPersonIds);

      // Get team memberships
      const { data: teamMemberships, error: teamMembershipsError } = await supabase
        .from('sales_team_members')
        .select(`
          individual_id,
          sales_team:sales_teams!sales_team_id (
            id,
            name
          )
        `)
        .in('individual_id', salesPersonIds);

      console.log('Team memberships query result:', teamMemberships);
      console.log('Team memberships error:', teamMembershipsError);

      // Get team leads
      const { data: teamLeads, error: teamLeadsError } = await supabase
        .from('sales_teams')
        .select('id, name, team_lead_individual_id')
        .in('team_lead_individual_id', salesPersonIds);

      console.log('Team leads query result:', teamLeads);
      console.log('Team leads error:', teamLeadsError);

      // Create a map of individual_id to team_name
      const teamMap = new Map();

      (teamMemberships || []).forEach(tm => {
        console.log('Processing team membership:', tm);
        if (tm.sales_team) {
          teamMap.set(tm.individual_id, tm.sales_team.name);
        }
      });

      (teamLeads || []).forEach(tl => {
        console.log('Processing team lead:', tl);
        teamMap.set(tl.team_lead_individual_id, tl.name);
      });

      console.log('Final team map:', Array.from(teamMap.entries()));

      // Add team_name to sales_person objects
      invoicesWithItems.forEach(invoice => {
        if (invoice.sales_person && invoice.sales_person_individual_id) {
          const teamName = teamMap.get(invoice.sales_person_individual_id) || null;
          console.log(`Setting team_name for ${invoice.sales_person_individual_id}: ${teamName}`);
          invoice.sales_person.team_name = teamName;
        }
      });
    }

    return res.status(200).json(invoicesWithItems);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/invoices/:id
 */
async function getInvoice(req, res, id) {
  try {
    const { organization_slug } = req.query;

    if (!organization_slug) {
      return res.status(400).json({ error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:contacts!customer_contact_id (id, first_name, last_name, company_name, email, phone_1),
        sales_person:individuals!sales_person_individual_id (id, display_name, primary_email, avatar_url),
        sales_order:sales_orders!sales_order_id (id, order_code),
        delivery_order:delivery_orders!delivery_order_id (id, delivery_order_code)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('is_deleted', false)
      .single();

    if (invoiceError) throw invoiceError;

    // Fetch items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select(`
        *,
        product:inventory_products (id, sku, name, unit, category)
      `)
      .eq('invoice_id', id)
      .order('line_order', { ascending: true });

    if (itemsError) throw itemsError;

    // Fetch payments
    const { data: payments, error: paymentsError } = await supabase
      .from('invoice_payments')
      .select('*')
      .eq('invoice_id', id)
      .order('payment_date', { ascending: false });

    if (paymentsError) throw paymentsError;

    return res.status(200).json({
      ...invoice,
      items: items || [],
      payments: payments || [],
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/invoices
 */
async function createInvoice(req, res) {
  try {
    const { organization_slug } = req.query;
    const invoiceData = req.body;

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
      .eq('document_type', 'invoice')
      .single();

    // If settings don't exist, create defaults
    if (!settings) {
      const { data: newSettings, error: insertError } = await supabase
        .from('sales_document_settings')
        .insert({
          organization_id: organizationId,
          document_type: 'invoice',
          order_code_format: 'INV-{YYMM}-{5digits}',
          current_counter: 0,
          reset_period: 'monthly',
          default_tax_rate: 0.0,
          default_status: 'draft',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      settings = newSettings;
    }

    // Generate invoice code
    const currentDate = new Date();
    const nextCounter = getNextCounter(
      settings.current_counter,
      settings.reset_period,
      settings.last_reset_date,
      currentDate
    );

    const invoiceCode = generateOrderCode(settings.order_code_format, nextCounter, currentDate);

    // Update counter BEFORE creating the invoice to prevent race conditions
    const { error: updateError } = await supabase
      .from('sales_document_settings')
      .update({
        current_counter: nextCounter,
        last_reset_date: currentDate.toISOString().split('T')[0],
      })
      .eq('organization_id', organizationId)
      .eq('document_type', 'invoice');

    if (updateError) throw updateError;

    // Calculate totals
    const subtotal = parseFloat(invoiceData.subtotal || 0);
    const taxRate = parseFloat(invoiceData.tax_rate || 0);
    const taxAmount = subtotal * (taxRate / 100);
    const discountAmount = parseFloat(invoiceData.discount_amount || 0);
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Insert invoice
    const { data: newInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        organization_id: organizationId,
        invoice_code: invoiceCode,
        invoice_date: invoiceData.invoice_date,
        due_date: invoiceData.due_date,
        sales_order_id: invoiceData.sales_order_id || null,
        delivery_order_id: invoiceData.delivery_order_id || null,
        customer_contact_id: invoiceData.customer_contact_id,
        sales_person_individual_id: invoiceData.sales_person_individual_id,
        status: invoiceData.status || 'draft',
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        amount_paid: 0,
        amount_due: totalAmount,
        payment_terms: invoiceData.payment_terms,
        notes: invoiceData.notes,
        terms_and_conditions: invoiceData.terms_and_conditions,
        created_by_individual_id: currentIndividualId,
        updated_by_individual_id: currentIndividualId,
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Insert items
    if (invoiceData.items && invoiceData.items.length > 0) {
      const itemsToInsert = invoiceData.items.map((item, index) => ({
        invoice_id: newInvoice.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent || 0,
        discount_amount: item.discount_amount || 0,
        subtotal: item.subtotal,
        sales_order_item_id: item.sales_order_item_id || null,
        delivery_order_item_id: item.delivery_order_item_id || null,
        notes: item.notes,
        line_order: index,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return res.status(200).json(newInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/invoices/:id
 */
async function updateInvoice(req, res, id) {
  try {
    const { organization_slug } = req.query;
    const invoiceData = req.body;

    if (!organization_slug) {
      return res.status(400).json({ error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const currentIndividualId = req.session?.individual_id;

    // Calculate totals
    const subtotal = parseFloat(invoiceData.subtotal || 0);
    const taxRate = parseFloat(invoiceData.tax_rate || 0);
    const taxAmount = subtotal * (taxRate / 100);
    const discountAmount = parseFloat(invoiceData.discount_amount || 0);
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Get current amount_paid
    const { data: currentInvoice } = await supabase
      .from('invoices')
      .select('amount_paid')
      .eq('id', id)
      .single();

    const amountPaid = parseFloat(currentInvoice?.amount_paid || 0);
    const amountDue = totalAmount - amountPaid;

    // Update invoice
    const { data: updatedInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .update({
        invoice_date: invoiceData.invoice_date,
        due_date: invoiceData.due_date,
        customer_contact_id: invoiceData.customer_contact_id,
        sales_person_individual_id: invoiceData.sales_person_individual_id,
        status: invoiceData.status,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        amount_due: amountDue,
        payment_terms: invoiceData.payment_terms,
        notes: invoiceData.notes,
        terms_and_conditions: invoiceData.terms_and_conditions,
        updated_by_individual_id: currentIndividualId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Update items
    if (invoiceData.items) {
      // Delete existing items
      await supabase.from('invoice_items').delete().eq('invoice_id', id);

      // Insert new items
      if (invoiceData.items.length > 0) {
        const itemsToInsert = invoiceData.items.map((item, index) => ({
          invoice_id: id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          discount_percent: item.discount_percent || 0,
          discount_amount: item.discount_amount || 0,
          subtotal: item.subtotal,
          sales_order_item_id: item.sales_order_item_id || null,
          delivery_order_item_id: item.delivery_order_item_id || null,
          notes: item.notes,
          line_order: index,
        }));

        await supabase.from('invoice_items').insert(itemsToInsert);
      }
    }

    return res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/invoices/:id
 */
async function deleteInvoice(req, res, id) {
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
      .from('invoices')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/invoices/:id/payments
 */
async function getInvoicePayments(req, res, id) {
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
      .from('invoice_payments')
      .select('*')
      .eq('invoice_id', id)
      .eq('organization_id', organizationId)
      .order('payment_date', { ascending: false });

    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Error fetching invoice payments:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/invoices/:id/payments
 */
async function addInvoicePayment(req, res, id) {
  try {
    const { organization_slug } = req.query;
    const paymentData = req.body;

    if (!organization_slug) {
      return res.status(400).json({ error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const currentIndividualId = req.session?.individual_id;

    // Get current invoice
    const { data: invoice } = await supabase
      .from('invoices')
      .select('total_amount, amount_paid, due_date')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Insert payment
    const { data: payment, error: paymentError } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: id,
        organization_id: organizationId,
        payment_date: paymentData.payment_date,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        reference_number: paymentData.reference_number,
        notes: paymentData.notes,
        created_by_individual_id: currentIndividualId,
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update invoice amounts
    const newAmountPaid = parseFloat(invoice.amount_paid || 0) + parseFloat(paymentData.amount);
    const newAmountDue = parseFloat(invoice.total_amount) - newAmountPaid;
    const newStatus = calculateInvoiceStatus(invoice.total_amount, newAmountPaid, invoice.due_date);

    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        amount_paid: newAmountPaid,
        amount_due: newAmountDue,
        status: newStatus,
        paid_at: newAmountPaid >= invoice.total_amount ? new Date().toISOString() : null,
      })
      .eq('id', id);

    if (updateError) throw updateError;

    return res.status(200).json(payment);
  } catch (error) {
    console.error('Error adding invoice payment:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/invoices/:id/payments/:paymentId
 */
async function deleteInvoicePayment(req, res, id, paymentId) {
  try {
    const { organization_slug } = req.query;

    if (!organization_slug) {
      return res.status(400).json({ error: 'Missing organization_slug' });
    }

    const organizationId = await getOrganizationId(organization_slug);
    if (!organizationId) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Get payment amount before deleting
    const { data: payment } = await supabase
      .from('invoice_payments')
      .select('amount')
      .eq('id', paymentId)
      .eq('invoice_id', id)
      .single();

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Delete payment
    const { error: deleteError } = await supabase
      .from('invoice_payments')
      .delete()
      .eq('id', paymentId)
      .eq('invoice_id', id);

    if (deleteError) throw deleteError;

    // Get current invoice
    const { data: invoice } = await supabase
      .from('invoices')
      .select('total_amount, amount_paid, due_date')
      .eq('id', id)
      .single();

    // Update invoice amounts
    const newAmountPaid = parseFloat(invoice.amount_paid) - parseFloat(payment.amount);
    const newAmountDue = parseFloat(invoice.total_amount) - newAmountPaid;
    const newStatus = calculateInvoiceStatus(invoice.total_amount, newAmountPaid, invoice.due_date);

    await supabase
      .from('invoices')
      .update({
        amount_paid: newAmountPaid,
        amount_due: newAmountDue,
        status: newStatus,
        paid_at: null,
      })
      .eq('id', id);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice payment:', error);
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
  let paymentId = query.paymentId;

  if (!id) {
    // Match UUID in path: /invoices/UUID
    const match = req.url.match(/\/invoices\/([a-f0-9-]{36})/);
    if (match) {
      id = match[1];
    }
  }

  if (!paymentId && id) {
    // Match payment ID: /invoices/UUID/payments/UUID
    const match = req.url.match(/\/invoices\/[a-f0-9-]{36}\/payments\/([a-f0-9-]{36})/);
    if (match) {
      paymentId = match[1];
    }
  }

  try {
    // Settings endpoints
    if (path.includes('/invoice_settings/preview_format')) {
      if (method === 'POST') {
        return previewInvoiceFormat(req, res);
      }
    }

    if (path.includes('/invoice_settings')) {
      if (method === 'GET') {
        return getInvoiceSettings(req, res);
      }
      if (method === 'PUT') {
        return updateInvoiceSettings(req, res);
      }
    }

    // Status configuration endpoints
    if (path.includes('/invoice_statuses')) {
      if (method === 'GET') {
        return getInvoiceStatuses(req, res);
      }
      if (method === 'PUT') {
        return updateInvoiceStatuses(req, res);
      }
    }

    // Invoice payments endpoints
    if (path.includes('/invoices') && path.includes('/payments')) {
      // DELETE /api/invoices/:id/payments/:paymentId
      if (method === 'DELETE' && id && paymentId) {
        return deleteInvoicePayment(req, res, id, paymentId);
      }

      // POST /api/invoices/:id/payments
      if (method === 'POST' && id) {
        return addInvoicePayment(req, res, id);
      }

      // GET /api/invoices/:id/payments
      if (method === 'GET' && id) {
        return getInvoicePayments(req, res, id);
      }
    }

    // Invoices endpoints
    if (path.includes('/invoices')) {
      // GET /api/invoices (list)
      if (method === 'GET' && !id) {
        return getInvoices(req, res);
      }

      // GET /api/invoices/:id (single)
      if (method === 'GET' && id) {
        return getInvoice(req, res, id);
      }

      // POST /api/invoices (create)
      if (method === 'POST' && !id) {
        return createInvoice(req, res);
      }

      // PUT /api/invoices/:id (update)
      if (method === 'PUT' && id) {
        return updateInvoice(req, res, id);
      }

      // DELETE /api/invoices/:id (soft delete)
      if (method === 'DELETE' && id) {
        return deleteInvoice(req, res, id);
      }
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('Invoices API error:', error);
    return res.status(500).json({ error: error.message });
  }
};
