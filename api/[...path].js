/**
 * Unified API Handler for Vercel Deployment
 *
 * This single serverless function handles ALL API routes to stay within Vercel's Hobby plan limit (12 functions).
 * Individual handler files (get_user_access_token.js, etc.) remain as modular code but are imported here
 * rather than being deployed as separate functions.
 *
 * How it works:
 * 1. All /api/* requests are routed to this single function by vercel.json
 * 2. This function looks up the path in the routes map
 * 3. Dispatches to the appropriate handler module
 *
 * This counts as only 1 serverless function instead of 11+
 */

const { handleCors } = require('./_utils');

// Import all API handlers from handlers subdirectory
const getUserAccessToken = require('../server/api_handlers/get_user_access_token');
const getSignParameters = require('../server/api_handlers/get_sign_parameters');
const getOrganizationConfig = require('../server/api_handlers/get_organization_config');
const getOrganizationMembers = require('../server/api_handlers/get_organization_members');
const getBitableTables = require('../server/api_handlers/get_bitable_tables');
const getAuditLogs = require('../server/api_handlers/get_audit_logs');
const getSupabaseMembers = require('../server/api_handlers/get_supabase_members');
const organization = require('../server/api_handlers/organization');
const currentUser = require('../server/api_handlers/current_user');
const strategicMapV2 = require('../server/api_handlers/strategic_map_v2');
const strategicMapV2Batch = require('../server/api_handlers/strategic_map_v2_batch');
const adminOrganizations = require('../server/api_handlers/admin_organizations');
const contacts = require('../server/api_handlers/contacts');
const contactStages = require('../server/api_handlers/contact_stages');
const trafficChannels = require('../server/api_handlers/traffic_channels');
const contactTags = require('../server/api_handlers/contact_tags');
const contactSettings = require('../server/api_handlers/contact_settings');
const organizationMembers = require('../server/api_handlers/organization_members');
const products = require('../server/api_handlers/products');
const productsDashboard = require('../server/api_handlers/products_dashboard');
const inventory = require('../server/api_handlers/inventory');
const userDepartment = require('../server/api_handlers/user_department');
const tenantInfo = require('../server/api_handlers/tenant_info');
const calendarEvents = require('../server/api_handlers/calendar_events');
const salesOrders = require('../server/api_handlers/sales_orders');
const quotations = require('../server/api_handlers/quotations');
const integrations = require('../server/api_handlers/integrations');
const templates = require('../server/api_handlers/templates');
const pdfGeneration = require('../server/api_handlers/pdf_generation');

/**
 * Route mapping: path -> handler
 * IMPORTANT: Order matters! More specific routes must come before generic ones.
 * Example: '/api/products/dashboard' must come before '/api/products'
 */
const routes = {
  '/api/get_user_access_token': getUserAccessToken,
  '/api/get_sign_parameters': getSignParameters,
  '/api/get_organization_config': getOrganizationConfig,
  '/api/get_organization_members': getOrganizationMembers,
  '/api/get_bitable_tables': getBitableTables,
  '/api/get_audit_logs': getAuditLogs,
  '/api/get_supabase_members': getSupabaseMembers,
  '/api/organization': organization,
  '/api/current_user': currentUser,
  '/api/strategic_map_v2': strategicMapV2,
  '/api/strategic_map_v2/batch': strategicMapV2Batch,
  '/api/admin/organizations': adminOrganizations,
  '/api/contacts': contacts,
  '/api/contact-stages': contactStages,
  '/api/traffic-channels': trafficChannels,
  '/api/contact-tags': contactTags,
  '/api/contact-settings': contactSettings,
  '/api/organization-members': organizationMembers,
  '/api/products/dashboard': productsDashboard, // More specific route first!
  '/api/products': products,
  '/api/inventory': inventory,
  '/api/user_department': userDepartment,
  '/api/tenant_info': tenantInfo,
  '/api/calendar/events': calendarEvents,
  '/api/sales_order_settings': salesOrders,
  '/api/sales_order_statuses': salesOrders,
  '/api/sales_orders': salesOrders,
  '/api/sales_teams': salesOrders,
  '/api/quotation_settings': quotations,
  '/api/quotation_statuses': quotations,
  '/api/sales_quotations': quotations,
  '/api/integrations': integrations,
  '/api/templates': templates,
  '/api/documents/pdf/generate': pdfGeneration,
};

/**
 * Main handler - dispatches to appropriate route handler
 */
module.exports = async function handler(req, res) {
  // Handle CORS preflight
  if (handleCors(req, res)) return;

  // Get the full path from the request (remove query string)
  let path = req.url.split('?')[0];

  // Normalize path: ensure it starts with /api
  if (!path.startsWith('/api/')) {
    path = '/api' + (path.startsWith('/') ? path : '/' + path);
  }

  console.log('🔀 Unified API Router - Path:', path, 'Method:', req.method);

  // Find matching route handler
  let routeHandler = routes[path];

  // If exact match not found, try without trailing slash
  if (!routeHandler && path.endsWith('/')) {
    routeHandler = routes[path.slice(0, -1)];
  }

  // If still not found, try with trailing slash
  if (!routeHandler && !path.endsWith('/')) {
    routeHandler = routes[path + '/'];
  }

  // If still not found, try prefix matching for routes with path parameters
  // e.g., /api/contacts/123 should match /api/contacts handler
  if (!routeHandler) {
    for (const [routePath, handler] of Object.entries(routes)) {
      if (path.startsWith(routePath + '/') || path.startsWith(routePath + '?')) {
        routeHandler = handler;
        break;
      }
    }
  }

  if (!routeHandler) {
    console.warn('❌ No route handler found for:', path);
    return res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      path,
      method: req.method,
      hint: 'Available routes listed below',
      availableRoutes: Object.keys(routes),
    });
  }

  // Dispatch to the appropriate handler
  try {
    console.log('✅ Dispatching to handler:', path);
    return await routeHandler(req, res);
  } catch (error) {
    console.error('❌ Error in route handler:', path, error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      path,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};
