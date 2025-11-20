/**
 * Inventory API Handler
 * Handles REST API requests for inventory management
 *
 * Routes:
 *   GET  /api/inventory?organization_slug=xxx&type=items|products|movements|locations|suppliers|purchase-orders
 *   POST /api/inventory - Create product, stock movement, or purchase order
 *   PUT  /api/inventory/:id - Update inventory quantity
 *
 * Pattern matches strategic_map_v2.js
 */

const { handleCors, okResponse, failResponse } = require('../../api/_utils');
const InventoryController = require('../inventory_controller');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
  // Handle CORS preflight
  if (handleCors(req, res)) return;

  const controller = new InventoryController(supabaseUrl, supabaseKey);
  const method = req.method;
  const queryParams = req.query || {};
  const bodyParams = req.body || {};

  // Extract ID from URL path if present (e.g., /api/inventory/123)
  const url = req.url || '';
  const urlParts = url.split('?')[0].split('/');
  const resourceId = urlParts[urlParts.length - 1] !== 'inventory' ? urlParts[urlParts.length - 1] : null;

  // Extract organization_slug and type (check both query and body)
  const organization_slug = queryParams.organization_slug || bodyParams.organization_slug;
  const { type = 'items', ...filters } = queryParams;

  if (!organization_slug) {
    return res.status(400).json(failResponse('organization_slug is required'));
  }

  try {
    // ========================================================================
    // GET: Fetch data (items, products, movements, etc.)
    // ========================================================================
    if (method === 'GET') {
      let result;

      switch (type) {
        case 'items':
          // Get inventory stock items with product details
          result = await controller.getInventoryItems(organization_slug, filters);
          break;

        case 'products':
          // Get product catalog
          result = await controller.getProducts(organization_slug, filters);
          break;

        case 'locations':
          // Get warehouse/storage locations
          result = await controller.getLocations(organization_slug);
          break;

        case 'movements':
          // Get stock movement history
          result = await controller.getStockMovements(organization_slug, filters);
          break;

        case 'purchase-orders':
          // Get purchase orders with items
          result = await controller.getPurchaseOrders(organization_slug, filters);
          break;

        case 'suppliers':
          // Get suppliers list
          result = await controller.getSuppliers(organization_slug);
          break;

        case 'settings':
          // Get inventory settings
          result = await controller.getSettings(organization_slug);
          break;

        default:
          return res.status(400).json(failResponse(`Invalid type: ${type}. Valid types: items, products, locations, movements, purchase-orders, suppliers, settings`));
      }

      return res.status(200).json(okResponse(result.data, result.metadata));
    }

    // ========================================================================
    // POST: Create new record (product, movement, purchase order, etc.)
    // ========================================================================
    if (method === 'POST') {
      // Handle DO upload endpoint (special case)
      if (resourceId === 'upload-do') {
        // For now, return a placeholder response
        // In production, implement file upload to Supabase Storage or S3
        return res.status(200).json(okResponse({
          file_url: '/placeholder-do-file.pdf',
          uploaded_at: new Date().toISOString()
        }));
      }

      const { action, data, individual_id } = bodyParams;

      if (!action) {
        return res.status(400).json(failResponse('action is required (product, movement, location, supplier, purchase-order)'));
      }

      let result;

      switch (action) {
        case 'product':
          // Create new product
          result = await controller.createProduct(organization_slug, data, individual_id);
          break;

        case 'movement':
          // Create stock movement (IN/OUT/Adjustment)
          result = await controller.createStockMovement(organization_slug, data, individual_id);
          break;

        case 'location':
          // Create new warehouse/location
          result = await controller.createLocation(organization_slug, data, individual_id);
          break;

        case 'stock-item':
          // Create or update stock item
          result = await controller.upsertStockItem(organization_slug, data);
          break;

        case 'purchase-order':
          // Create purchase order with items
          result = await controller.createPurchaseOrder(organization_slug, data, individual_id);
          break;

        case 'supplier':
          // Create new supplier
          result = await controller.createSupplier(organization_slug, data, individual_id);
          break;

        case 'settings':
          // Update inventory settings
          result = await controller.updateSettings(organization_slug, data);
          break;

        case 'migrate-thresholds':
          // Migrate all stock items to use current threshold setting
          result = await controller.migrateStockThresholds(organization_slug);
          break;

        default:
          return res.status(400).json(failResponse(`Invalid action: ${action}. Valid actions: product, movement, location, stock-item, purchase-order, supplier, settings, migrate-thresholds`));
      }

      return res.status(201).json(okResponse(result.data, result.metadata));
    }

    // ========================================================================
    // PUT: Update existing record
    // ========================================================================
    if (method === 'PUT') {
      const { action, item_id, quantity, average_cost, status } = bodyParams;

      // Handle PO status update (ID in URL path)
      if (action === 'update-po-status' && resourceId) {
        if (!status) {
          return res.status(400).json(failResponse('status is required'));
        }

        const result = await controller.updatePOStatus(organization_slug, resourceId, status);
        return res.status(200).json(okResponse(result.data));
      }

      // Handle inventory quantity update
      if (!item_id && !resourceId) {
        return res.status(400).json(failResponse('item_id is required'));
      }

      const result = await controller.updateInventoryQuantity(
        organization_slug,
        item_id || resourceId,
        quantity,
        average_cost
      );

      return res.status(200).json(okResponse(result.data));
    }

    // ========================================================================
    // Method not allowed
    // ========================================================================
    return res.status(405).json(failResponse('Method not allowed. Supported: GET, POST, PUT'));

  } catch (error) {
    console.error('Inventory API error:', error);
    return res.status(500).json(failResponse(error.message || 'Internal server error'));
  }
};
