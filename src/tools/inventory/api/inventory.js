/**
 * Client-side API helper for Inventory Management
 * Similar pattern to strategic_map/api/strategic_map.js
 */

const API_BASE = process.env.REACT_APP_API_BASE || '';

export const InventoryAPI = {
  /**
   * Get inventory stock items
   * @param {string} organizationSlug
   * @param {object} filters - { category, location_id, search }
   * @returns {Promise}
   */
  async getItems(organizationSlug, filters = {}) {
    const params = new URLSearchParams({
      organization_slug: organizationSlug,
      type: 'items',
      ...filters
    });

    const response = await fetch(`${API_BASE}/api/inventory?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch inventory items: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get products catalog
   * @param {string} organizationSlug
   * @param {object} filters - { category, search }
   * @returns {Promise}
   */
  async getProducts(organizationSlug, filters = {}) {
    const params = new URLSearchParams({
      organization_slug: organizationSlug,
      type: 'products',
      ...filters
    });

    const response = await fetch(`${API_BASE}/api/inventory?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get inventory locations
   * @param {string} organizationSlug
   * @returns {Promise}
   */
  async getLocations(organizationSlug) {
    const params = new URLSearchParams({
      organization_slug: organizationSlug,
      type: 'locations'
    });

    const response = await fetch(`${API_BASE}/api/inventory?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get stock movements history
   * @param {string} organizationSlug
   * @param {object} filters - { product_id, location_id, movement_type, limit }
   * @returns {Promise}
   */
  async getMovements(organizationSlug, filters = {}) {
    const params = new URLSearchParams({
      organization_slug: organizationSlug,
      type: 'movements',
      ...filters
    });

    const response = await fetch(`${API_BASE}/api/inventory?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch movements: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get purchase orders
   * @param {string} organizationSlug
   * @param {object} filters - { status, supplier_id }
   * @returns {Promise}
   */
  async getPurchaseOrders(organizationSlug, filters = {}) {
    const params = new URLSearchParams({
      organization_slug: organizationSlug,
      type: 'purchase-orders',
      ...filters
    });

    const response = await fetch(`${API_BASE}/api/inventory?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch purchase orders: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get suppliers list
   * @param {string} organizationSlug
   * @returns {Promise}
   */
  async getSuppliers(organizationSlug) {
    const params = new URLSearchParams({
      organization_slug: organizationSlug,
      type: 'suppliers'
    });

    const response = await fetch(`${API_BASE}/api/inventory?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch suppliers: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create new product
   * @param {string} organizationSlug
   * @param {object} productData - { sku, name, category, unit, description }
   * @param {string} individualId - Creator's individual ID (optional)
   * @returns {Promise}
   */
  async createProduct(organizationSlug, productData, individualId = null) {
    const response = await fetch(`${API_BASE}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        action: 'product',
        data: productData,
        individual_id: individualId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create product: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Update product
   * @param {string} organizationSlug
   * @param {string} productId - Product ID
   * @param {object} data - Fields to update { low_stock_threshold, name, etc. }
   * @returns {Promise}
   */
  async updateProduct(organizationSlug, productId, data) {
    const response = await fetch(`${API_BASE}/api/inventory`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        action: 'update-product',
        product_id: productId,
        data
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update product: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Soft delete a product (sets is_deleted = true)
   * @param {string} organizationSlug
   * @param {string} productId
   * @returns {Promise}
   */
  async deleteProduct(organizationSlug, productId) {
    const response = await fetch(`${API_BASE}/api/inventory`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        action: 'delete-product',
        product_id: productId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to delete product: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create stock movement (IN/OUT/Adjustment)
   * @param {string} organizationSlug
   * @param {object} movementData - { product_id, location_id, movement_type, quantity, unit_cost, notes }
   * @param {string} individualId - Creator's individual ID (optional)
   * @returns {Promise}
   */
  async createMovement(organizationSlug, movementData, individualId = null) {
    const response = await fetch(`${API_BASE}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        action: 'movement',
        data: movementData,
        individual_id: individualId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create movement: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create new warehouse/location
   * @param {string} organizationSlug
   * @param {object} locationData - { name, code, address }
   * @param {string} individualId - Creator's individual ID (optional)
   * @returns {Promise}
   */
  async createLocation(organizationSlug, locationData, individualId = null) {
    const response = await fetch(`${API_BASE}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        action: 'location',
        data: locationData,
        individual_id: individualId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create location: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Update inventory quantity
   * @param {string} organizationSlug
   * @param {string} itemId - Stock item ID
   * @param {number} quantity - New quantity
   * @param {number} averageCost - New average cost (optional)
   * @returns {Promise}
   */
  async updateQuantity(organizationSlug, itemId, quantity, averageCost = null) {
    const response = await fetch(`${API_BASE}/api/inventory/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        item_id: itemId,
        quantity,
        average_cost: averageCost
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update quantity: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create new purchase order
   * @param {string} organizationSlug
   * @param {object} poData - { supplier_id, po_number, expected_delivery_date, notes, items: [{ product_id, quantity, unit_cost }] }
   * @param {string} individualId - Creator's individual ID (optional)
   * @returns {Promise}
   */
  async createPurchaseOrder(organizationSlug, poData, individualId = null) {
    const response = await fetch(`${API_BASE}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        action: 'purchase-order',
        data: poData,
        individual_id: individualId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create purchase order: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Update PO status
   * @param {string} organizationSlug
   * @param {string} poId - Purchase order ID
   * @param {string} status - New status
   * @param {string} deliveryOrderUrl - Delivery order attachment URL (required for 'received')
   * @returns {Promise}
   */
  async updatePOStatus(organizationSlug, poId, status, deliveryOrderUrl = null) {
    const response = await fetch(`${API_BASE}/api/inventory/${poId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        action: 'update-po-status',
        status,
        delivery_order_url: deliveryOrderUrl
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `Failed to update PO status: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Update PO details (expected delivery date, notes, delivery order URL)
   * @param {string} organizationSlug
   * @param {string} poId - Purchase order ID
   * @param {object} updateData - { expected_delivery_date, notes, delivery_order_url }
   * @returns {Promise}
   */
  async updatePO(organizationSlug, poId, updateData) {
    const response = await fetch(`${API_BASE}/api/inventory/${poId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        action: 'update-po',
        data: updateData
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `Failed to update PO: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create new supplier
   * @param {string} organizationSlug
   * @param {object} supplierData - { name, contact_person, email, phone, address, notes }
   * @param {string} individualId - Creator's individual ID (optional)
   * @returns {Promise}
   */
  async createSupplier(organizationSlug, supplierData, individualId = null) {
    const response = await fetch(`${API_BASE}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        action: 'supplier',
        data: supplierData,
        individual_id: individualId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create supplier: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Delete supplier (soft delete via contacts table)
   * @param {string} organizationSlug
   * @param {string} supplierId
   * @returns {Promise}
   */
  async deleteSupplier(organizationSlug, supplierId) {
    const params = new URLSearchParams({
      organization_slug: organizationSlug,
      type: 'supplier',
      id: supplierId
    });

    const response = await fetch(`${API_BASE}/api/inventory?${params}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete supplier: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get inventory settings
   * @param {string} organizationSlug
   * @returns {Promise}
   */
  async getSettings(organizationSlug) {
    const params = new URLSearchParams({
      organization_slug: organizationSlug,
      type: 'settings'
    });

    const response = await fetch(`${API_BASE}/api/inventory?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Update inventory settings
   * @param {string} organizationSlug
   * @param {object} settings - { low_stock_threshold }
   * @returns {Promise}
   */
  async updateSettings(organizationSlug, settings) {
    const response = await fetch(`${API_BASE}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        action: 'settings',
        data: settings
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update settings: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Migrate all stock items to use current threshold setting
   * @param {string} organizationSlug
   * @returns {Promise}
   */
  async migrateStockThresholds(organizationSlug) {
    const response = await fetch(`${API_BASE}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        action: 'migrate-thresholds',
        data: {}
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to migrate thresholds: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get unit conversions
   * @param {string} organizationSlug
   * @returns {Promise}
   */
  async getUnitConversions(organizationSlug) {
    const params = new URLSearchParams({
      organization_slug: organizationSlug,
      type: 'unit-conversions'
    });

    const response = await fetch(`${API_BASE}/api/inventory?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch unit conversions: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create or update unit conversion
   * @param {string} organizationSlug
   * @param {object} conversionData - { from_unit, to_unit, conversion_factor }
   * @returns {Promise}
   */
  async upsertUnitConversion(organizationSlug, conversionData) {
    const response = await fetch(`${API_BASE}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        action: 'unit-conversion',
        data: conversionData
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to save unit conversion: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Delete unit conversion
   * @param {string} organizationSlug
   * @param {string} conversionId
   * @returns {Promise}
   */
  async deleteUnitConversion(organizationSlug, conversionId) {
    const response = await fetch(`${API_BASE}/api/inventory`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        action: 'unit-conversion',
        conversion_id: conversionId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to delete unit conversion: ${response.statusText}`);
    }

    return response.json();
  },

  // ==================== Product Units ====================

  /**
   * Get all product units for organization
   * @param {string} organizationSlug
   * @param {string} productId - Optional product ID to filter
   * @returns {Promise}
   */
  async getProductUnits(organizationSlug, productId = null) {
    const params = new URLSearchParams({
      organization_slug: organizationSlug,
      type: 'product-units'
    });
    if (productId) {
      params.append('product_id', productId);
    }

    const response = await fetch(`${API_BASE}/api/inventory?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product units: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create product unit
   * @param {string} organizationSlug
   * @param {object} unitData - { product_id, unit_name, conversion_to_base, is_base_unit }
   * @returns {Promise}
   */
  async createProductUnit(organizationSlug, unitData) {
    const response = await fetch(`${API_BASE}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        action: 'product-unit',
        data: unitData
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create product unit: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Delete product unit
   * @param {string} organizationSlug
   * @param {string} unitId
   * @returns {Promise}
   */
  async deleteProductUnit(organizationSlug, unitId) {
    const params = new URLSearchParams({
      organization_slug: organizationSlug,
      type: 'product-unit',
      id: unitId
    });

    const response = await fetch(`${API_BASE}/api/inventory?${params}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete product unit: ${response.statusText}`);
    }

    return response.json();
  },

  // ========================================================================
  // DELIVERY ORDERS (OUT) METHODS
  // ========================================================================

  async getDeliveryOrders(organizationSlug, filters = {}) {
    const params = new URLSearchParams({
      organization_slug: organizationSlug,
      type: 'delivery-orders',
      ...filters
    });

    const response = await fetch(`${API_BASE}/api/inventory?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch delivery orders: ${response.statusText}`);
    }
    return response.json();
  },

  async createDeliveryOrder(organizationSlug, doData, individualId = null) {
    const response = await fetch(`${API_BASE}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        action: 'delivery-order',
        data: doData,
        individual_id: individualId
      })
    });

    const result = await response.json();
    if (!response.ok || result.code !== 0) {
      throw new Error(result.msg || `Failed to create delivery order: ${response.statusText}`);
    }
    return result;
  },

  async updateDOStatus(organizationSlug, doId, status, deliveryOrderUrl = null) {
    const response = await fetch(`${API_BASE}/api/inventory/${doId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        action: 'update-do-status',
        status,
        delivery_order_url: deliveryOrderUrl
      })
    });

    const result = await response.json();
    if (!response.ok || result.code !== 0) {
      throw new Error(result.msg || `Failed to update DO status: ${response.statusText}`);
    }
    return result;
  },

  async cancelDeliveryOrder(organizationSlug, doId, cancellationReason, individualId = null) {
    const response = await fetch(`${API_BASE}/api/inventory/${doId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_slug: organizationSlug,
        action: 'cancel-do',
        cancellation_reason: cancellationReason,
        individual_id: individualId
      })
    });

    const result = await response.json();
    if (!response.ok || result.code !== 0) {
      throw new Error(result.msg || `Failed to cancel delivery order: ${response.statusText}`);
    }
    return result;
  },

  async deletePurchaseOrder(organizationSlug, poId) {
    const response = await fetch(`${API_BASE}/api/inventory?organization_slug=${organizationSlug}&type=purchase-order&id=${poId}`, {
      method: 'DELETE'
    });

    const result = await response.json();
    if (!response.ok || result.code !== 0) {
      throw new Error(result.msg || `Failed to delete purchase order: ${response.statusText}`);
    }
    return result;
  }
};
