/**
 * Inventory Controller
 * Handles CRUD operations for Inventory Management
 *
 * Similar pattern to strategic_map_controller.js
 */

const { createClient } = require('@supabase/supabase-js');
const { getOrganizationInfo } = require('./organization_helper');

class InventoryController {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get all inventory items with product and location details
   * @param {string} organizationSlug - Organization identifier
   * @param {object} filters - Optional filters (category, search, location)
   * @returns {object} - { success, data, metadata }
   */
  async getInventoryItems(organizationSlug, filters = {}) {
    try {
      // 1. Validate organization
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) {
        throw new Error('Organization not found');
      }

      // 2. Build query with joins
      let query = this.supabase
        .from('inventory_stock_items')
        .select(`
          *,
          product:inventory_products!inner (
            id, sku, name, category, unit, description
          ),
          location:inventory_locations (
            id, name, code
          )
        `)
        .eq('organization_id', org.id);

      // Apply filters
      if (filters.category) {
        query = query.eq('product.category', filters.category);
      }

      if (filters.location_id) {
        query = query.eq('location_id', filters.location_id);
      }

      if (filters.search) {
        // Search in product name or SKU
        query = query.or(`product.name.ilike.%${filters.search}%,product.sku.ilike.%${filters.search}%`);
      }

      // 3. Execute query
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error in getInventoryItems:', error);
        throw error;
      }

      // 4. Calculate stock status for each item
      const itemsWithStatus = (data || []).map(item => {
        const available = item.quantity - item.reserved_quantity;
        let status = 'normal';

        if (available === 0) {
          status = 'out_of_stock';
        } else if (available <= item.low_stock_threshold) {
          status = 'low_stock';
        }

        return {
          ...item,
          available_quantity: available,
          stock_status: status
        };
      });

      return {
        success: true,
        data: itemsWithStatus,
        metadata: {
          totalItems: itemsWithStatus.length,
          organizationId: org.id,
          organizationSlug: organizationSlug
        }
      };
    } catch (error) {
      console.error('Error in getInventoryItems:', error);
      throw error;
    }
  }

  /**
   * Get products list
   * @param {string} organizationSlug
   * @param {object} filters - Optional filters
   * @returns {object}
   */
  async getProducts(organizationSlug, filters = {}) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      let query = this.supabase
        .from('inventory_products')
        .select('*')
        .eq('organization_id', org.id)
        .eq('active', true);

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        metadata: { totalProducts: data ? data.length : 0 }
      };
    } catch (error) {
      console.error('Error in getProducts:', error);
      throw error;
    }
  }

  /**
   * Get inventory locations
   * @param {string} organizationSlug
   * @returns {object}
   */
  async getLocations(organizationSlug) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { data, error } = await this.supabase
        .from('inventory_locations')
        .select('*')
        .eq('organization_id', org.id)
        .eq('active', true)
        .order('name');

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getLocations:', error);
      throw error;
    }
  }

  /**
   * Create new product
   * @param {string} organizationSlug
   * @param {object} productData - { sku, name, category, unit, description }
   * @param {string} individualId - Creator's individual ID
   * @returns {object}
   */
  async createProduct(organizationSlug, productData, individualId) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { data, error} = await this.supabase
        .from('inventory_products')
        .insert({
          organization_id: org.id,
          created_by_individual_id: individualId || null,
          ...productData
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error in createProduct:', error);
      throw error;
    }
  }

  /**
   * Create new warehouse/location
   * @param {string} organizationSlug
   * @param {object} locationData - { name, code, address }
   * @param {string} individualId - User creating the location
   * @returns {object}
   */
  async createLocation(organizationSlug, locationData, individualId) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { data, error } = await this.supabase
        .from('inventory_locations')
        .insert({
          organization_id: org.id,
          created_by_individual_id: individualId || null,
          ...locationData
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error in createLocation:', error);
      throw error;
    }
  }

  /**
   * Create or update inventory stock item
   * @param {string} organizationSlug
   * @param {object} itemData - { product_id, location_id, quantity, average_cost }
   * @returns {object}
   */
  async upsertStockItem(organizationSlug, itemData) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { data, error } = await this.supabase
        .from('inventory_stock_items')
        .upsert({
          organization_id: org.id,
          ...itemData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'organization_id,product_id,location_id'
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error in upsertStockItem:', error);
      throw error;
    }
  }

  /**
   * Update inventory quantity (adjustment)
   * @param {string} organizationSlug
   * @param {string} itemId - Stock item ID
   * @param {number} quantity - New quantity
   * @param {number} averageCost - New average cost (optional)
   * @returns {object}
   */
  async updateInventoryQuantity(organizationSlug, itemId, quantity, averageCost) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const updateData = {
        quantity,
        updated_at: new Date().toISOString()
      };

      if (averageCost !== undefined) {
        updateData.average_cost = averageCost;
      }

      const { data, error } = await this.supabase
        .from('inventory_stock_items')
        .update(updateData)
        .eq('id', itemId)
        .eq('organization_id', org.id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateInventoryQuantity:', error);
      throw error;
    }
  }

  /**
   * Get stock movements with filters
   * @param {string} organizationSlug
   * @param {object} filters - { product_id, location_id, limit }
   * @returns {object}
   */
  async getStockMovements(organizationSlug, filters = {}) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      let query = this.supabase
        .from('inventory_stock_movements')
        .select(`
          *,
          product:inventory_products (id, sku, name, category),
          location:inventory_locations (id, name, code)
        `)
        .eq('organization_id', org.id);

      if (filters.product_id) {
        query = query.eq('product_id', filters.product_id);
      }

      if (filters.location_id) {
        query = query.eq('location_id', filters.location_id);
      }

      if (filters.movement_type) {
        query = query.eq('movement_type', filters.movement_type);
      }

      const { data, error } = await query
        .order('occurred_at', { ascending: false })
        .limit(filters.limit || 100);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        metadata: { totalMovements: data ? data.length : 0 }
      };
    } catch (error) {
      console.error('Error in getStockMovements:', error);
      throw error;
    }
  }

  /**
   * Create stock movement and update inventory
   * @param {string} organizationSlug
   * @param {object} movementData - { product_id, location_id, movement_type, quantity, unit_cost, notes }
   * @param {string} individualId - Creator's individual ID
   * @returns {object}
   */
  async createStockMovement(organizationSlug, movementData, individualId) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      // 1. Insert movement record
      const { data: movement, error: mvError } = await this.supabase
        .from('inventory_stock_movements')
        .insert({
          organization_id: org.id,
          created_by_individual_id: individualId || null,
          occurred_at: movementData.occurred_at || new Date().toISOString(),
          ...movementData
        })
        .select()
        .single();

      if (mvError) throw mvError;

      // 2. Update inventory_stock_items quantity
      const { data: stockItem, error: stockError } = await this.supabase
        .from('inventory_stock_items')
        .select('quantity, average_cost')
        .eq('product_id', movementData.product_id)
        .eq('location_id', movementData.location_id)
        .eq('organization_id', org.id)
        .maybeSingle();

      if (stockError) throw stockError;

      let newQty = stockItem ? stockItem.quantity : 0;

      // Calculate new quantity based on movement type
      if (movementData.movement_type === 'stock_in') {
        newQty += movementData.quantity;
      } else if (movementData.movement_type === 'stock_out') {
        newQty -= movementData.quantity;
      } else if (movementData.movement_type === 'adjustment') {
        newQty = movementData.quantity; // Direct set
      }

      // Prevent negative stock
      if (newQty < 0) {
        throw new Error('Insufficient stock for this operation');
      }

      // Update or insert stock item
      if (stockItem) {
        await this.supabase
          .from('inventory_stock_items')
          .update({
            quantity: newQty,
            updated_at: new Date().toISOString()
          })
          .eq('product_id', movementData.product_id)
          .eq('location_id', movementData.location_id)
          .eq('organization_id', org.id);
      } else {
        // Create new stock item if doesn't exist
        // Get organization's low stock threshold setting
        const settingsResult = await this.getSettings(organizationSlug);
        const lowStockThreshold = settingsResult.data?.low_stock_threshold || 10;

        await this.supabase
          .from('inventory_stock_items')
          .insert({
            organization_id: org.id,
            product_id: movementData.product_id,
            location_id: movementData.location_id,
            quantity: newQty,
            average_cost: movementData.unit_cost || 0,
            low_stock_threshold: lowStockThreshold
          });
      }

      return {
        success: true,
        data: movement,
        metadata: {
          newQuantity: newQty,
          movementType: movementData.movement_type
        }
      };
    } catch (error) {
      console.error('Error in createStockMovement:', error);
      throw error;
    }
  }

  /**
   * Get purchase orders with items
   * @param {string} organizationSlug
   * @param {object} filters - { status, supplier_id }
   * @returns {object}
   */
  async getPurchaseOrders(organizationSlug, filters = {}) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      let query = this.supabase
        .from('inventory_purchase_orders')
        .select(`
          *,
          supplier:inventory_suppliers (id, name, contact_person),
          items:inventory_purchase_order_items (
            *,
            product:inventory_products (id, sku, name, unit)
          )
        `)
        .eq('organization_id', org.id);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Flatten the nested product data for easier frontend consumption
      const flattenedData = data?.map(po => ({
        ...po,
        items: po.items?.map(item => ({
          ...item,
          quantity: item.quantity_ordered,  // Map quantity_ordered to quantity for frontend
          product_name: item.product?.name,
          product_sku: item.product?.sku,
          product_unit: item.product?.unit
        }))
      })) || [];

      return {
        success: true,
        data: flattenedData,
        metadata: { totalPOs: flattenedData.length }
      };
    } catch (error) {
      console.error('Error in getPurchaseOrders:', error);
      throw error;
    }
  }

  /**
   * Get suppliers list
   * @param {string} organizationSlug
   * @returns {object}
   */
  async getSuppliers(organizationSlug) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { data, error } = await this.supabase
        .from('inventory_suppliers')
        .select('*')
        .eq('organization_id', org.id)
        .eq('active', true)
        .order('name');

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getSuppliers:', error);
      throw error;
    }
  }

  /**
   * Create purchase order with items
   * @param {string} organizationSlug
   * @param {object} poData - { supplier_id, po_number, expected_delivery_date, notes, items: [{ product_id, quantity, unit_cost }] }
   * @param {string} individualId - Creator ID (optional)
   * @returns {object}
   */
  async createPurchaseOrder(organizationSlug, poData, individualId = null) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { supplier_id, po_number, expected_delivery_date, notes, items, location_id } = poData;

      // Validate required fields
      if (!supplier_id || !po_number || !items || items.length === 0) {
        throw new Error('supplier_id, po_number, and at least one item are required');
      }

      // Validate or get default location
      let receivingLocationId = location_id;
      if (!receivingLocationId) {
        // Get first available location as default
        const { data: locations } = await this.supabase
          .from('inventory_locations')
          .select('id')
          .eq('organization_id', org.id)
          .limit(1);

        if (locations && locations.length > 0) {
          receivingLocationId = locations[0].id;
        }
      }

      // Validate each item has required fields
      for (const item of items) {
        if (!item.product_id) {
          throw new Error('Each item must have a product_id');
        }
        if (item.quantity === undefined || item.quantity === null || item.quantity <= 0) {
          throw new Error('Each item must have a valid quantity greater than 0');
        }
        if (item.unit_cost === undefined || item.unit_cost === null || item.unit_cost < 0) {
          throw new Error('Each item must have a valid unit_cost');
        }
      }

      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => {
        return sum + (item.quantity * item.unit_cost);
      }, 0);

      // Create purchase order
      const { data: poRecord, error: poError} = await this.supabase
        .from('inventory_purchase_orders')
        .insert({
          organization_id: org.id,
          supplier_id,
          po_number,
          order_date: new Date().toISOString(),
          expected_delivery_date: expected_delivery_date || null,
          status: 'draft',
          total_amount: totalAmount,
          notes,
          created_by: individualId,
          location_id: receivingLocationId  // Add receiving warehouse
        })
        .select()
        .single();

      if (poError) {
        console.error('Error creating PO:', poError);
        // Handle specific error cases
        if (poError.code === '23505') {
          // Unique constraint violation
          if (poError.message.includes('unique_po_number_per_org')) {
            throw new Error(`Purchase order number '${po_number}' already exists. Please use a different PO number.`);
          }
          throw new Error('A purchase order with this information already exists.');
        }
        throw poError;
      }

      // Create PO items
      const poItems = items.map(item => {
        console.log('Mapping item:', item);
        const mappedItem = {
          purchase_order_id: poRecord.id,
          product_id: item.product_id,
          quantity_ordered: item.quantity,  // Database column is 'quantity_ordered'
          unit_cost: item.unit_cost,
          received_quantity: 0
        };
        console.log('Mapped to:', mappedItem);
        return mappedItem;
      });

      const { data: itemsData, error: itemsError } = await this.supabase
        .from('inventory_purchase_order_items')
        .insert(poItems)
        .select();

      if (itemsError) {
        console.error('Error creating PO items:', itemsError);
        // Rollback: Delete the PO if items fail
        await this.supabase
          .from('inventory_purchase_orders')
          .delete()
          .eq('id', poRecord.id);

        // Handle specific error cases
        if (itemsError.code === '23502') {
          // NOT NULL constraint violation
          if (itemsError.message.includes('quantity_ordered')) {
            throw new Error('Quantity is required for all items. Please ensure all items have a valid quantity.');
          }
          throw new Error('Missing required field in purchase order items.');
        }
        if (itemsError.code === '23503') {
          // Foreign key violation
          throw new Error('Invalid product or purchase order reference. Please check your data.');
        }
        throw itemsError;
      }

      return {
        success: true,
        data: {
          ...poRecord,
          items: itemsData
        },
        metadata: {
          organizationId: org.id,
          itemCount: itemsData.length
        }
      };
    } catch (error) {
      console.error('Error in createPurchaseOrder:', error);
      throw error;
    }
  }

  /**
   * Create new supplier
   * @param {string} organizationSlug
   * @param {object} supplierData - { name, contact_person, email, phone, address, notes }
   * @param {string} individualId - Creator ID (optional)
   * @returns {object}
   */
  async createSupplier(organizationSlug, supplierData, individualId = null) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { name, contact_person, email, phone, address, notes } = supplierData;

      if (!name) {
        throw new Error('Supplier name is required');
      }

      const { data, error } = await this.supabase
        .from('inventory_suppliers')
        .insert({
          organization_id: org.id,
          name,
          contact_person: contact_person || null,
          email: email || null,
          phone: phone || null,
          address: address || null,
          notes: notes || null,
          active: true,
          created_by: individualId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating supplier:', error);
        throw error;
      }

      return {
        success: true,
        data,
        metadata: {
          organizationId: org.id
        }
      };
    } catch (error) {
      console.error('Error in createSupplier:', error);
      throw error;
    }
  }

  /**
   * Get inventory settings for organization
   * @param {string} organizationSlug
   * @returns {object}
   */
  async getSettings(organizationSlug) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { data, error } = await this.supabase
        .from('inventory_settings')
        .select('*')
        .eq('organization_id', org.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
        throw error;
      }

      // If no settings exist, return defaults
      if (!data) {
        return {
          success: true,
          data: {
            low_stock_threshold: 10
          },
          metadata: {
            organizationId: org.id,
            isDefault: true
          }
        };
      }

      return {
        success: true,
        data: {
          low_stock_threshold: data.low_stock_threshold
        },
        metadata: {
          organizationId: org.id,
          isDefault: false
        }
      };
    } catch (error) {
      console.error('Error in getSettings:', error);
      throw error;
    }
  }

  /**
   * Update or create inventory settings for organization
   * @param {string} organizationSlug
   * @param {object} settings - { low_stock_threshold }
   * @returns {object}
   */
  async updateSettings(organizationSlug, settings) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { low_stock_threshold } = settings;

      if (low_stock_threshold === undefined || low_stock_threshold === null) {
        throw new Error('low_stock_threshold is required');
      }

      // Try to update existing settings first
      const { data: existingData } = await this.supabase
        .from('inventory_settings')
        .select('id')
        .eq('organization_id', org.id)
        .single();

      let data, error;

      if (existingData) {
        // Update existing settings
        const result = await this.supabase
          .from('inventory_settings')
          .update({
            low_stock_threshold,
            updated_at: new Date().toISOString()
          })
          .eq('organization_id', org.id)
          .select()
          .single();

        data = result.data;
        error = result.error;
      } else {
        // Insert new settings
        const result = await this.supabase
          .from('inventory_settings')
          .insert({
            organization_id: org.id,
            low_stock_threshold
          })
          .select()
          .single();

        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error updating settings:', error);
        throw error;
      }

      return {
        success: true,
        data: {
          low_stock_threshold: data.low_stock_threshold
        },
        metadata: {
          organizationId: org.id
        }
      };
    } catch (error) {
      console.error('Error in updateSettings:', error);
      throw error;
    }
  }

  /**
   * Migrate all existing stock items to use current threshold setting
   * @param {string} organizationSlug
   * @returns {object}
   */
  async migrateStockThresholds(organizationSlug) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      // Get current threshold setting
      const settingsResult = await this.getSettings(organizationSlug);
      const threshold = settingsResult.data?.low_stock_threshold || 10;

      // Update all stock items for this organization
      const { data, error } = await this.supabase
        .from('inventory_stock_items')
        .update({ low_stock_threshold: threshold })
        .eq('organization_id', org.id)
        .select('id');

      if (error) throw error;

      return {
        success: true,
        data: {
          updatedCount: data?.length || 0,
          threshold: threshold
        },
        metadata: {
          organizationId: org.id
        }
      };
    } catch (error) {
      console.error('Error in migrateStockThresholds:', error);
      throw error;
    }
  }

  /**
   * Update purchase order status
   * @param {string} organizationSlug
   * @param {string} poId - Purchase order ID
   * @param {string} newStatus - New status (draft, approved, ordered, partially_received, received, cancelled)
   * @returns {object}
   */
  async updatePOStatus(organizationSlug, poId, newStatus) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const validStatuses = ['draft', 'approved', 'ordered', 'partially_received', 'received', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      // Get current PO status BEFORE updating
      const { data: currentPO, error: fetchError } = await this.supabase
        .from('inventory_purchase_orders')
        .select('status')
        .eq('id', poId)
        .eq('organization_id', org.id)
        .single();

      if (fetchError) {
        console.error('Error fetching current PO:', fetchError);
        throw fetchError;
      }

      const oldStatus = currentPO.status;

      // BUSINESS RULE: Prevent reverting from 'received' to earlier statuses
      // This prevents inventory corruption. Use stock adjustments for corrections.
      if (oldStatus === 'received' && newStatus !== 'received') {
        throw new Error(
          'Cannot change status from "Received" back to another status. ' +
          'Stock has already been added to inventory. ' +
          'For returns or corrections, please use Stock Out movements or create a new adjustment.'
        );
      }

      // Update PO status
      const { data, error } = await this.supabase
        .from('inventory_purchase_orders')
        .update({ status: newStatus })
        .eq('id', poId)
        .eq('organization_id', org.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating PO status:', error);
        throw error;
      }

      // If status is 'received', trigger auto stock-in logic
      if (newStatus === 'received') {
        await this.autoStockInFromPO(organizationSlug, poId);
      }

      return {
        success: true,
        data,
        metadata: {
          organizationId: org.id,
          statusChanged: true,
          oldStatus: oldStatus,
          newStatus: newStatus
        }
      };
    } catch (error) {
      console.error('Error in updatePOStatus:', error);
      throw error;
    }
  }

  /**
   * Auto stock-in from purchase order when status changes to 'received'
   * @param {string} organizationSlug
   * @param {string} poId - Purchase order ID
   * @returns {object}
   */
  async autoStockInFromPO(organizationSlug, poId) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      // Check if stock-in movements already exist for this PO
      const { data: existingMovements } = await this.supabase
        .from('inventory_stock_movements')
        .select('id')
        .eq('reference_type', 'purchase_order')
        .eq('reference_id', poId)
        .limit(1);

      if (existingMovements && existingMovements.length > 0) {
        console.log(`Stock movements already exist for PO ${poId}`);
        console.log(`Checking if stock items were properly updated...`);

        // Even if movements exist, we should ensure stock items are updated
        // This handles cases where movement was created but stock update failed
        // We'll continue processing but won't create duplicate movements
      }

      // Get PO items
      const { data: poItems, error: itemsError } = await this.supabase
        .from('inventory_purchase_order_items')
        .select('*, product:product_id(id, sku, name)')
        .eq('purchase_order_id', poId);

      if (itemsError) {
        console.error('Error fetching PO items:', itemsError);
        throw itemsError;
      }

      // Get PO details including receiving location
      const { data: po, error: poError } = await this.supabase
        .from('inventory_purchase_orders')
        .select('*, location:location_id(id, name, code)')
        .eq('id', poId)
        .single();

      if (poError) {
        console.error('Error fetching PO:', poError);
        throw poError;
      }

      // Use PO's specified location, or get default location as fallback
      let receivingLocation = null;
      if (po.location_id) {
        receivingLocation = { id: po.location_id };
      } else {
        // Fallback: Get first available location
        let { data: locations, error: locError } = await this.supabase
          .from('inventory_locations')
          .select('*')
          .eq('organization_id', org.id)
          .limit(1);

        if (locError) {
          console.error('Error fetching locations:', locError);
          throw locError;
        }

        receivingLocation = locations && locations[0];
        if (!receivingLocation) {
          // Create default location if none exists
          const { data: newLoc, error: createLocError } = await this.supabase
            .from('inventory_locations')
            .insert({
              organization_id: org.id,
              name: 'Default Warehouse',
              code: 'DEFAULT',
              address: null
            })
            .select()
            .single();

          if (createLocError) {
            console.error('Error creating default location:', createLocError);
            throw createLocError;
          }
          receivingLocation = newLoc;
        }
      }

      // Process each item: create stock movement and update/create stock item
      const movements = [];
      const movementsAlreadyExist = existingMovements && existingMovements.length > 0;

      for (const item of poItems) {
        let movementData = null;

        // Only create movement if it doesn't already exist
        if (!movementsAlreadyExist) {
          // Create stock movement (stock_in)
          const movement = {
            organization_id: org.id,
            product_id: item.product_id,
            location_id: receivingLocation.id,
            movement_type: 'stock_in',
            quantity: item.quantity_ordered,
            unit_cost: item.unit_cost,
            reference_type: 'purchase_order',
            reference_id: poId,
            notes: `Auto stock-in from PO ${po.code || po.po_number || poId}`
          };

          const { data: createdMovement, error: movementError } = await this.supabase
            .from('inventory_stock_movements')
            .insert(movement)
            .select()
            .single();

          if (movementError) {
            console.error('Error creating stock movement:', movementError);
            throw movementError;
          }

          movementData = createdMovement;
          movements.push(movementData);
          console.log('Stock movement created:', movementData.id);
        } else {
          console.log(`Skipping movement creation for product ${item.product_id} - already exists`);
        }

        // Update or create stock item
        const { data: existingItem, error: fetchError } = await this.supabase
          .from('inventory_stock_items')
          .select('*')
          .eq('product_id', item.product_id)
          .eq('location_id', receivingLocation.id)
          .eq('organization_id', org.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching stock item:', fetchError);
          throw fetchError;
        }

        if (existingItem) {
          // Update existing stock item
          const newQuantity = existingItem.quantity + item.quantity_ordered;
          const newAverageCost = ((existingItem.quantity * existingItem.average_cost) + (item.quantity_ordered * item.unit_cost)) / newQuantity;

          console.log(`Updating stock item ${existingItem.id}: ${existingItem.quantity} + ${item.quantity_ordered} = ${newQuantity}`);

          const { data: updatedItem, error: updateError } = await this.supabase
            .from('inventory_stock_items')
            .update({
              quantity: newQuantity,
              average_cost: newAverageCost,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingItem.id)
            .select();

          if (updateError) {
            console.error('Error updating stock item:', updateError);
            throw updateError;
          }

          console.log('Stock item updated successfully:', updatedItem);
        } else {
          // Create new stock item with proper threshold
          const settingsResult = await this.getSettings(organizationSlug);
          const lowStockThreshold = settingsResult.data?.low_stock_threshold || 10;

          console.log(`Creating new stock item for product ${item.product_id} at location ${receivingLocation.id} with quantity ${item.quantity_ordered}`);

          const { data: newItem, error: insertError } = await this.supabase
            .from('inventory_stock_items')
            .insert({
              organization_id: org.id,
              product_id: item.product_id,
              location_id: receivingLocation.id,
              quantity: item.quantity_ordered,
              average_cost: item.unit_cost,
              low_stock_threshold: lowStockThreshold
            })
            .select();

          if (insertError) {
            console.error('Error creating stock item:', insertError);
            throw insertError;
          }

          console.log('New stock item created:', newItem);
        }
      }

      return {
        success: true,
        data: {
          movementsCreated: movements.length,
          movements
        },
        metadata: {
          organizationId: org.id,
          poId
        }
      };
    } catch (error) {
      console.error('Error in autoStockInFromPO:', error);
      throw error;
    }
  }
}

module.exports = InventoryController;
