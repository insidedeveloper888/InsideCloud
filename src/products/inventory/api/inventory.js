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
  }
};
