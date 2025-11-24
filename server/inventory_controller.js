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
            id, sku, name, category, unit, base_unit, unit_conversion_factor, description
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
   * Update product
   * @param {string} organizationSlug
   * @param {string} productId - Product ID
   * @param {object} updateData - Fields to update { low_stock_threshold, name, etc. }
   * @returns {object}
   */
  async updateProduct(organizationSlug, productId, updateData) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { data, error } = await this.supabase
        .from('inventory_products')
        .update(updateData)
        .eq('id', productId)
        .eq('organization_id', org.id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateProduct:', error);
      throw error;
    }
  }

  /**
   * Update a product unit
   * @param {string} organizationSlug
   * @param {string} unitId - UUID of the product unit
   * @param {object} updateData - Fields to update { buying_price, selling_price, etc. }
   * @returns {object}
   */
  async updateProductUnit(organizationSlug, unitId, updateData) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { data, error } = await this.supabase
        .from('inventory_product_units')
        .update(updateData)
        .eq('id', unitId)
        .eq('organization_id', org.id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateProductUnit:', error);
      throw error;
    }
  }

  /**
   * Soft delete a product (sets is_deleted = true)
   * @param {string} organizationSlug
   * @param {string} productId
   * @returns {object}
   */
  async softDeleteProduct(organizationSlug, productId) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { data, error } = await this.supabase
        .from('inventory_products')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', productId)
        .eq('organization_id', org.id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error in softDeleteProduct:', error);
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

      if (error) {
        // Handle duplicate key error
        if (error.code === '23505') {
          throw new Error('Warehouse with this code already exists');
        }
        throw error;
      }

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
          product:inventory_products (id, sku, name, category, base_unit),
          location:inventory_locations (id, name, code),
          created_by:individuals!inventory_stock_movements_created_by_individual_id_fkey (id, display_name, avatar_url)
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

      // Fetch POs without supplier join (no FK relationship yet)
      let query = this.supabase
        .from('inventory_purchase_orders')
        .select(`
          *,
          items:inventory_purchase_order_items (
            *,
            product:inventory_products (id, sku, name, unit)
          )
        `)
        .eq('organization_id', org.id)
        .is('deleted_at', null);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique supplier IDs and fetch from contacts
      const supplierIds = [...new Set((data || []).map(po => po.supplier_id).filter(Boolean))];
      let suppliersMap = {};

      if (supplierIds.length > 0) {
        const { data: suppliers } = await this.supabase
          .from('contacts')
          .select('id, first_name, last_name, company_name, contact_person_name, entity_type')
          .in('id', supplierIds);

        (suppliers || []).forEach(s => {
          const name = s.entity_type === 'company'
            ? s.company_name
            : `${s.first_name || ''} ${s.last_name || ''}`.trim();
          suppliersMap[s.id] = {
            id: s.id,
            name: name,
            contact_person: s.contact_person_name || name
          };
        });
      }

      // Get creator individual IDs
      const creatorIds = [...new Set((data || []).map(po => po.created_by_individual_id).filter(Boolean))];
      let creatorsMap = {};

      if (creatorIds.length > 0) {
        const { data: creators } = await this.supabase
          .from('individuals')
          .select('id, display_name, avatar_url')
          .in('id', creatorIds);

        (creators || []).forEach(c => {
          creatorsMap[c.id] = c;
        });
      }

      // Flatten the nested product data for easier frontend consumption
      const flattenedData = data?.map(po => ({
        ...po,
        supplier: suppliersMap[po.supplier_id] || null,
        created_by: creatorsMap[po.created_by_individual_id] || null,
        items: po.items?.map(item => ({
          ...item,
          quantity: item.quantity_ordered,
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
   * Get suppliers list from contacts table
   * @param {string} organizationSlug
   * @returns {object}
   */
  async getSuppliers(organizationSlug) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      console.log('[getSuppliers] Fetching for org_id:', org.id);

      const { data, error } = await this.supabase
        .from('contacts')
        .select('id, first_name, last_name, company_name, email, phone_1, phone_2, contact_person_name, contact_person_phone, address_line_1, address_line_2, city, state, postal_code, notes, entity_type, contact_type, organization_id, is_deleted')
        .eq('organization_id', org.id)
        .eq('contact_type', 'supplier')
        .eq('is_deleted', false)
        .order('company_name');

      console.log('[getSuppliers] Found:', data?.length || 0, 'suppliers, error:', error);

      if (error) throw error;

      // Map to supplier-like format for compatibility
      const suppliers = (data || []).map(c => ({
        id: c.id,
        name: c.entity_type === 'company' ? c.company_name : `${c.first_name} ${c.last_name}`.trim(),
        contact_person: c.contact_person_name || `${c.first_name} ${c.last_name}`.trim(),
        email: c.email,
        phone: c.phone_1,
        address: [c.address_line_1, c.address_line_2, c.city, c.state, c.postal_code].filter(Boolean).join(', '),
        notes: c.notes,
        // Original fields for detail view
        _raw: c
      }));

      return { success: true, data: suppliers };
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
          created_by_individual_id: individualId,
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
   * Generate random avatar color (same as contact_management_controller)
   */
  _generateRandomAvatarColor() {
    const colors = [
      '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336',
      '#00BCD4', '#FF5722', '#3F51B5', '#8BC34A', '#E91E63',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Create new supplier (syncs to contacts table with contact_type='supplier')
   * Matches exact format used by contact_management_controller.createContact
   * @param {string} organizationSlug
   * @param {object} supplierData - All contact fields matching Contact Management
   * @param {string} individualId - Creator ID (optional)
   * @returns {object}
   */
  async createSupplier(organizationSlug, supplierData, individualId = null) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const {
        first_name, last_name, phone_1, phone_2, email,
        entity_type, company_name, industry,
        contact_person_name, contact_person_phone,
        address_line_1, address_line_2, postal_code, state, city,
        notes
      } = supplierData;

      if (!first_name || !last_name) {
        throw new Error('First name and last name are required');
      }
      if (!phone_1) {
        throw new Error('Phone 1 is required');
      }

      // Insert into contacts table as supplier (matching contact_management format exactly)
      const contactToInsert = {
        organization_id: org.id,
        // Personal Information (required)
        first_name: first_name,
        last_name: last_name,
        nickname: null,
        gender: null,
        // Contact Information
        email: email || null,
        phone_1: phone_1,
        phone_2: phone_2 || null,
        // Business Information
        company_name: company_name || null,
        industry: industry || null,
        entity_type: entity_type || 'company',
        contact_type: 'supplier',
        // Contact Person (for company entities)
        contact_person_name: contact_person_name || null,
        contact_person_phone: contact_person_phone || null,
        // Address Information
        address_line_1: address_line_1 || null,
        address_line_2: address_line_2 || null,
        postal_code: postal_code || null,
        city: city || null,
        state: state || null,
        // Source & Assignment
        traffic_source_id: null,
        sales_person_individual_id: null,
        customer_service_individual_id: null,
        // Referral System
        referred_by_contact_id: null,
        // Pipeline Status
        current_stage_id: null,
        // Avatar
        avatar_url: null,
        avatar_color: this._generateRandomAvatarColor(),
        // Rating
        rating: null,
        // Notes
        notes: notes || null,
        // Audit
        created_by_individual_id: individualId,
      };

      const { data, error } = await this.supabase
        .from('contacts')
        .insert([contactToInsert])
        .select()
        .single();

      if (error) {
        console.error('Error creating supplier in contacts:', error);
        throw error;
      }

      return {
        success: true,
        data: {
          id: data.id,
          name: data.company_name,
          contact_person: data.contact_person_name,
          email: data.email,
          phone: data.phone_1,
          address: data.address_line_1,
          notes: data.notes
        },
        metadata: { organizationId: org.id }
      };
    } catch (error) {
      console.error('Error in createSupplier:', error);
      throw error;
    }
  }

  /**
   * Delete supplier (soft delete - sets is_deleted=true in contacts table)
   * @param {string} organizationSlug
   * @param {string} supplierId
   * @returns {object}
   */
  async deleteSupplier(organizationSlug, supplierId) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      // Soft delete by setting is_deleted = true
      const { data, error } = await this.supabase
        .from('contacts')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', supplierId)
        .eq('organization_id', org.id)
        .eq('contact_type', 'supplier')
        .select()
        .single();

      if (error) {
        console.error('Error deleting supplier:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in deleteSupplier:', error);
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

      // If no settings exist, return empty defaults
      if (!data) {
        return {
          success: true,
          data: {
            low_stock_threshold: 10,
            custom_categories: [],
            custom_units: []
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
          low_stock_threshold: data.low_stock_threshold,
          custom_categories: data.custom_categories || [],
          custom_units: data.custom_units || []
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

      const { low_stock_threshold, custom_categories, custom_units } = settings;

      // Build update object with only provided fields
      const updateData = { updated_at: new Date().toISOString() };
      if (low_stock_threshold !== undefined) updateData.low_stock_threshold = low_stock_threshold;
      if (custom_categories !== undefined) updateData.custom_categories = custom_categories;
      if (custom_units !== undefined) updateData.custom_units = custom_units;

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
          .update(updateData)
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
            low_stock_threshold: low_stock_threshold || 10,
            custom_categories: custom_categories || ['CCTV', 'Lighting', 'AV System', 'Network', 'Accessories'],
            custom_units: custom_units || ['pcs', 'meter', 'box', 'set']
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
          low_stock_threshold: data.low_stock_threshold,
          custom_categories: data.custom_categories,
          custom_units: data.custom_units
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
  async updatePOStatus(organizationSlug, poId, newStatus, deliveryOrderUrl = null) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const validStatuses = ['draft', 'approved', 'ordered', 'in_transit', 'partially_received', 'received', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      // Get current PO status BEFORE updating
      const { data: currentPO, error: fetchError } = await this.supabase
        .from('inventory_purchase_orders')
        .select('status, delivery_order_url')
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

      // BUSINESS RULE: Require delivery order URL when marking as received
      if (newStatus === 'received' && !deliveryOrderUrl && !currentPO.delivery_order_url) {
        throw new Error('Delivery Order attachment is required to mark as Received');
      }

      // Update PO status (and delivery_order_url if provided)
      const updateData = { status: newStatus };
      if (deliveryOrderUrl) {
        updateData.delivery_order_url = deliveryOrderUrl;
      }
      if (newStatus === 'received') {
        updateData.received_at = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from('inventory_purchase_orders')
        .update(updateData)
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
   * Update PO details (expected delivery date, notes, etc.)
   * @param {string} organizationSlug
   * @param {string} poId - Purchase order ID
   * @param {object} updateData - { expected_delivery_date, notes, delivery_order_url }
   * @returns {object}
   */
  async updatePO(organizationSlug, poId, updateData) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      // Check current status - can't update if already received
      const { data: currentPO, error: fetchError } = await this.supabase
        .from('inventory_purchase_orders')
        .select('status')
        .eq('id', poId)
        .eq('organization_id', org.id)
        .single();

      if (fetchError) throw fetchError;

      if (currentPO.status === 'received') {
        throw new Error('Cannot update a received purchase order');
      }

      // Only allow specific fields to be updated
      const allowedFields = ['expected_delivery_date', 'notes', 'delivery_order_url'];
      const filteredData = {};
      for (const key of allowedFields) {
        if (updateData[key] !== undefined) {
          filteredData[key] = updateData[key];
        }
      }

      const { data, error } = await this.supabase
        .from('inventory_purchase_orders')
        .update(filteredData)
        .eq('id', poId)
        .eq('organization_id', org.id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error in updatePO:', error);
      throw error;
    }
  }

  /**
   * Soft delete a purchase order (only if not received)
   * @param {string} organizationSlug
   * @param {string} poId - Purchase order ID
   * @returns {object}
   */
  async softDeletePO(organizationSlug, poId) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      // Check current status
      const { data: currentPO, error: fetchError } = await this.supabase
        .from('inventory_purchase_orders')
        .select('status')
        .eq('id', poId)
        .eq('organization_id', org.id)
        .single();

      if (fetchError) throw fetchError;

      if (currentPO.status === 'received') {
        throw new Error('Cannot delete a received purchase order');
      }

      // Soft delete by setting deleted_at
      const { data, error } = await this.supabase
        .from('inventory_purchase_orders')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', poId)
        .eq('organization_id', org.id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error in softDeletePO:', error);
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
            created_by_individual_id: po.created_by_individual_id || po.created_by || null,
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

  /**
   * Get unit conversions for organization
   * @param {string} organizationSlug
   * @returns {object}
   */
  async getUnitConversions(organizationSlug) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { data, error } = await this.supabase
        .from('inventory_unit_conversions')
        .select('*')
        .eq('organization_id', org.id)
        .order('from_unit');

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getUnitConversions:', error);
      throw error;
    }
  }

  /**
   * Create or update unit conversion
   * @param {string} organizationSlug
   * @param {object} conversionData - { from_unit, to_unit, conversion_factor }
   * @returns {object}
   */
  async upsertUnitConversion(organizationSlug, conversionData) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { from_unit, to_unit, conversion_factor } = conversionData;

      const { data, error } = await this.supabase
        .from('inventory_unit_conversions')
        .upsert({
          organization_id: org.id,
          from_unit,
          to_unit,
          conversion_factor
        }, { onConflict: 'organization_id,from_unit,to_unit' })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error in upsertUnitConversion:', error);
      throw error;
    }
  }

  /**
   * Delete unit conversion
   * @param {string} organizationSlug
   * @param {string} conversionId
   * @returns {object}
   */
  async deleteUnitConversion(organizationSlug, conversionId) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { error } = await this.supabase
        .from('inventory_unit_conversions')
        .delete()
        .eq('id', conversionId)
        .eq('organization_id', org.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error in deleteUnitConversion:', error);
      throw error;
    }
  }

  // ==================== Product Units ====================

  /**
   * Get units for a specific product
   * @param {string} organizationSlug
   * @param {string} productId
   * @returns {object}
   */
  async getProductUnits(organizationSlug, productId) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { data, error } = await this.supabase
        .from('inventory_product_units')
        .select('*')
        .eq('organization_id', org.id)
        .eq('product_id', productId)
        .order('is_base_unit', { ascending: false })
        .order('unit_name');

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error in getProductUnits:', error);
      throw error;
    }
  }

  /**
   * Get all product units for organization (for bulk loading)
   * @param {string} organizationSlug
   * @returns {object}
   */
  async getAllProductUnits(organizationSlug) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { data, error } = await this.supabase
        .from('inventory_product_units')
        .select('*')
        .eq('organization_id', org.id)
        .order('product_id')
        .order('is_base_unit', { ascending: false });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error in getAllProductUnits:', error);
      throw error;
    }
  }

  /**
   * Create product unit
   * @param {string} organizationSlug
   * @param {object} unitData - { product_id, unit_name, conversion_to_base, is_base_unit }
   * @returns {object}
   */
  async createProductUnit(organizationSlug, unitData) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      // If this is base unit, ensure conversion is 1
      if (unitData.is_base_unit) {
        unitData.conversion_to_base = 1;
      }

      const { data, error } = await this.supabase
        .from('inventory_product_units')
        .insert({
          organization_id: org.id,
          product_id: unitData.product_id,
          unit_name: unitData.unit_name,
          conversion_to_base: unitData.conversion_to_base || 1,
          is_base_unit: unitData.is_base_unit || false
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('This unit already exists for this product');
        }
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in createProductUnit:', error);
      throw error;
    }
  }

  /**
   * Update product unit
   * @param {string} organizationSlug
   * @param {string} unitId
   * @param {object} unitData
   * @returns {object}
   */
  async updateProductUnit(organizationSlug, unitId, unitData) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { data, error } = await this.supabase
        .from('inventory_product_units')
        .update({
          unit_name: unitData.unit_name,
          conversion_to_base: unitData.conversion_to_base,
          is_base_unit: unitData.is_base_unit
        })
        .eq('id', unitId)
        .eq('organization_id', org.id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateProductUnit:', error);
      throw error;
    }
  }

  /**
   * Delete product unit
   * @param {string} organizationSlug
   * @param {string} unitId
   * @returns {object}
   */
  async deleteProductUnit(organizationSlug, unitId) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      const { error } = await this.supabase
        .from('inventory_product_units')
        .delete()
        .eq('id', unitId)
        .eq('organization_id', org.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error in deleteProductUnit:', error);
      throw error;
    }
  }

  // ========================================================================
  // DELIVERY ORDERS (OUT) METHODS
  // ========================================================================

  async getDeliveryOrders(organizationSlug, filters = {}) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      let query = this.supabase
        .from('inventory_delivery_orders')
        .select(`
          *,
          customer:contacts (id, first_name, last_name, company_name),
          location:inventory_locations (id, name, code)
        `)
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.customer_id) query = query.eq('customer_id', filters.customer_id);
      if (filters.location_id) query = query.eq('location_id', filters.location_id);

      const { data, error } = await query;
      if (error) throw error;

      // Get creator info
      const creatorIds = [...new Set((data || []).map(d => d.created_by_individual_id).filter(Boolean))];
      let creatorsMap = {};
      if (creatorIds.length > 0) {
        const { data: creators } = await this.supabase
          .from('individuals')
          .select('id, display_name, avatar_url')
          .in('id', creatorIds);
        (creators || []).forEach(c => { creatorsMap[c.id] = c; });
      }

      // Get items for each DO
      const doIds = (data || []).map(d => d.id);
      let itemsMap = {};
      if (doIds.length > 0) {
        const { data: items } = await this.supabase
          .from('inventory_delivery_order_items')
          .select(`
            *,
            product:inventory_products (id, sku, name, base_unit)
          `)
          .in('delivery_order_id', doIds);
        (items || []).forEach(item => {
          if (!itemsMap[item.delivery_order_id]) itemsMap[item.delivery_order_id] = [];
          itemsMap[item.delivery_order_id].push(item);
        });
      }

      const enrichedData = (data || []).map(d => ({
        ...d,
        created_by: creatorsMap[d.created_by_individual_id] || null,
        items: itemsMap[d.id] || []
      }));

      return { success: true, data: enrichedData };
    } catch (error) {
      console.error('Error in getDeliveryOrders:', error);
      throw error;
    }
  }

  async createDeliveryOrder(organizationSlug, doData, individualId) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      // Validate stock availability for all items
      for (const item of doData.items || []) {
        const { data: stockItem, error: stockError } = await this.supabase
          .from('inventory_stock_items')
          .select('quantity')
          .eq('organization_id', org.id)
          .eq('product_id', item.product_id)
          .eq('location_id', doData.location_id)
          .single();

        if (stockError && stockError.code !== 'PGRST116') throw stockError;

        const availableQty = stockItem?.quantity || 0;
        if (item.quantity > availableQty) {
          // Get product name for error message
          const { data: product } = await this.supabase
            .from('inventory_products')
            .select('name')
            .eq('id', item.product_id)
            .single();
          throw new Error(`Insufficient stock for ${product?.name || 'product'}. Available: ${availableQty}, Requested: ${item.quantity}`);
        }
      }

      // Generate DO number
      const { count } = await this.supabase
        .from('inventory_delivery_orders')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id);
      const doNumber = `DO-${String((count || 0) + 1).padStart(5, '0')}`;

      // Calculate total
      const totalAmount = (doData.items || []).reduce((sum, item) => sum + (item.quantity * (item.unit_price || 0)), 0);

      // Create DO
      const { data: newDO, error: doError } = await this.supabase
        .from('inventory_delivery_orders')
        .insert({
          organization_id: org.id,
          do_number: doData.do_number || doNumber,
          customer_id: doData.customer_id || null,
          customer_name: doData.customer_name || null,
          location_id: doData.location_id,
          delivery_address: doData.delivery_address || null,
          status: 'draft',
          order_date: doData.order_date || new Date().toISOString().split('T')[0],
          expected_delivery_date: doData.expected_delivery_date || null,
          notes: doData.notes || null,
          total_amount: totalAmount,
          created_by_individual_id: individualId || null
        })
        .select()
        .single();

      if (doError) throw doError;

      // Create items
      if (doData.items && doData.items.length > 0) {
        const itemsToInsert = doData.items.map(item => ({
          delivery_order_id: newDO.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit: item.unit || null,
          unit_price: item.unit_price || 0,
          notes: item.notes || null
        }));

        const { error: itemsError } = await this.supabase
          .from('inventory_delivery_order_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return { success: true, data: newDO };
    } catch (error) {
      console.error('Error in createDeliveryOrder:', error);
      throw error;
    }
  }

  async updateDOStatus(organizationSlug, doId, newStatus, deliveryOrderUrl = null) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      // Get current DO
      const { data: currentDO, error: fetchError } = await this.supabase
        .from('inventory_delivery_orders')
        .select('*, items:inventory_delivery_order_items(*)')
        .eq('id', doId)
        .eq('organization_id', org.id)
        .single();

      if (fetchError) throw fetchError;

      // Require DO attachment to confirm
      if (newStatus === 'confirmed' && !deliveryOrderUrl && !currentDO.delivery_order_url) {
        throw new Error('Delivery Order attachment is required to confirm');
      }

      // When confirming, deduct stock
      if (newStatus === 'confirmed' && currentDO.status === 'draft') {
        for (const item of currentDO.items || []) {
          // Get current stock
          const { data: stockItem, error: stockError } = await this.supabase
            .from('inventory_stock_items')
            .select('id, quantity')
            .eq('organization_id', org.id)
            .eq('product_id', item.product_id)
            .eq('location_id', currentDO.location_id)
            .single();

          if (stockError && stockError.code !== 'PGRST116') throw stockError;

          const availableQty = stockItem?.quantity || 0;
          if (item.quantity > availableQty) {
            throw new Error(`Insufficient stock. Available: ${availableQty}, Requested: ${item.quantity}`);
          }

          // Deduct stock
          if (stockItem) {
            const { error: updateError } = await this.supabase
              .from('inventory_stock_items')
              .update({ quantity: availableQty - item.quantity, updated_at: new Date().toISOString() })
              .eq('id', stockItem.id);

            if (updateError) throw updateError;

            // Create stock movement
            const { error: movementError } = await this.supabase
              .from('inventory_stock_movements')
              .insert({
                organization_id: org.id,
                product_id: item.product_id,
                location_id: currentDO.location_id,
                movement_type: 'stock_out',
                quantity: item.quantity,
                reference_type: 'delivery_order',
                reference_id: doId,
                created_by_individual_id: currentDO.created_by_individual_id || null,
                notes: `DO: ${currentDO.do_number}`
              });

            if (movementError) {
              console.error('Error creating stock movement:', movementError);
            }
          }
        }
      }

      // Update status
      const updateData = { status: newStatus, updated_at: new Date().toISOString() };
      if (deliveryOrderUrl) updateData.delivery_order_url = deliveryOrderUrl;
      if (newStatus === 'delivered') updateData.delivery_date = new Date().toISOString().split('T')[0];

      const { data, error } = await this.supabase
        .from('inventory_delivery_orders')
        .update(updateData)
        .eq('id', doId)
        .eq('organization_id', org.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error in updateDOStatus:', error);
      throw error;
    }
  }

  async cancelDeliveryOrder(organizationSlug, doId, cancellationReason, individualId) {
    try {
      const org = await getOrganizationInfo(organizationSlug);
      if (!org) throw new Error('Organization not found');

      // Get current DO with items
      const { data: currentDO, error: fetchError } = await this.supabase
        .from('inventory_delivery_orders')
        .select('*, items:inventory_delivery_order_items(*)')
        .eq('id', doId)
        .eq('organization_id', org.id)
        .single();

      if (fetchError) throw fetchError;

      // Cannot cancel if already delivered or cancelled
      if (currentDO.status === 'delivered') {
        throw new Error('Cannot cancel a delivered order. Use Stock In to process returns.');
      }
      if (currentDO.status === 'cancelled') {
        throw new Error('Order is already cancelled');
      }

      // If status was confirmed/dispatched, stock was already deducted - need to restore it
      if (currentDO.status === 'confirmed' || currentDO.status === 'dispatched') {
        for (const item of currentDO.items || []) {
          // Get current stock
          const { data: stockItem, error: stockError } = await this.supabase
            .from('inventory_stock_items')
            .select('id, quantity')
            .eq('organization_id', org.id)
            .eq('product_id', item.product_id)
            .eq('location_id', currentDO.location_id)
            .single();

          if (stockError && stockError.code !== 'PGRST116') throw stockError;

          // Restore stock
          if (stockItem) {
            const { error: updateError } = await this.supabase
              .from('inventory_stock_items')
              .update({
                quantity: stockItem.quantity + item.quantity,
                updated_at: new Date().toISOString()
              })
              .eq('id', stockItem.id);

            if (updateError) throw updateError;
          }
        }

        // Delete the stock movements that were created when confirming (as if the DO never happened)
        const { error: deleteMovementError } = await this.supabase
          .from('inventory_stock_movements')
          .delete()
          .eq('reference_type', 'delivery_order')
          .eq('reference_id', doId)
          .eq('organization_id', org.id);

        if (deleteMovementError) {
          console.error('Error deleting stock movements:', deleteMovementError);
        }
      }

      // Update DO status to cancelled
      const { data, error } = await this.supabase
        .from('inventory_delivery_orders')
        .update({
          status: 'cancelled',
          cancellation_reason: cancellationReason || null,
          cancelled_at: new Date().toISOString(),
          cancelled_by_individual_id: individualId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', doId)
        .eq('organization_id', org.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error in cancelDeliveryOrder:', error);
      throw error;
    }
  }
}

module.exports = InventoryController;
