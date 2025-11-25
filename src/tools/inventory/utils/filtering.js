/**
 * Inventory filtering utilities
 * Pure functions for filtering inventory items, movements, and products
 */

/**
 * Filters inventory items based on search term, categories, locations, stock status, etc.
 * @param {Array} items - Array of inventory items
 * @param {Object} params - Filter parameters
 * @returns {Array} Filtered items
 */
export const filterInventoryItems = (items, {
  searchTerm = '',
  filters = {},
  showUnstocked = false
}) => {
  return items.filter(item => {
    // Search filter
    const matchesSearch = !searchTerm ||
      item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filter
    const matchesCategory = !filters.categories?.length ||
      (item.product?.category && filters.categories.includes(item.product.category));

    // Location filter
    // When a warehouse filter is active, exclude virtual items without a location
    // (those showing "Select location" should not appear when filtering by specific warehouse)
    const matchesLocation = !filters.locations?.length ||
      filters.locations.includes(item.location_id);

    // Stock Status filter
    const matchesStockStatus = !filters.stockStatuses?.length ||
      filters.stockStatuses.includes(item.stock_status);

    // Supplier filter
    const matchesSupplier = !filters.suppliers?.length;

    // Active status filter
    const matchesActiveStatus = filters.showInactive || item.product?.is_active !== false;

    // Hide unstocked items unless toggled on
    const matchesUnstocked = showUnstocked || item.stock_status !== 'no_stock';

    // Quantity range filter
    const matchesQuantityRange = (() => {
      const quantity = item.quantity || 0;
      const minMatch = filters.minQuantity === null || filters.minQuantity === undefined || quantity >= filters.minQuantity;
      const maxMatch = filters.maxQuantity === null || filters.maxQuantity === undefined || quantity <= filters.maxQuantity;
      return minMatch && maxMatch;
    })();

    return matchesSearch && matchesCategory && matchesLocation && matchesStockStatus &&
           matchesSupplier && matchesActiveStatus && matchesUnstocked && matchesQuantityRange;
  });
};

/**
 * Filters inventory movements based on various criteria
 * @param {Array} movements - Array of movements
 * @param {Object} params - Filter parameters
 * @returns {Array} Filtered movements
 */
export const filterMovements = (movements, {
  filters = {},
  searchTerm = ''
}) => {
  return movements.filter(movement => {
    // Movement Type filter
    if (filters.movementTypes?.length > 0 && !filters.movementTypes.includes(movement.movement_type)) {
      return false;
    }

    // Location filter
    if (filters.locations?.length > 0 && !filters.locations.includes(movement.location_id)) {
      return false;
    }

    // Product filter
    if (filters.products?.length > 0 && !filters.products.includes(movement.product_id)) {
      return false;
    }

    // Date Range filter
    if (filters.movementDateFrom) {
      const movementDate = new Date(movement.occurred_at).toISOString().split('T')[0];
      if (movementDate < filters.movementDateFrom) return false;
    }
    if (filters.movementDateTo) {
      const movementDate = new Date(movement.occurred_at).toISOString().split('T')[0];
      if (movementDate > filters.movementDateTo) return false;
    }

    // User/Operator filter
    if (filters.users?.length > 0 && !filters.users.includes(movement.created_by?.id)) {
      return false;
    }

    // Text search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        movement.product?.name?.toLowerCase().includes(searchLower) ||
        movement.product?.sku?.toLowerCase().includes(searchLower) ||
        movement.location?.name?.toLowerCase().includes(searchLower) ||
        movement.notes?.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }

    return true;
  });
};

/**
 * Sorts inventory items based on field and direction
 * @param {Array} items - Array of inventory items
 * @param {Object} sortBy - Sort configuration { field, direction }
 * @returns {Array} Sorted items
 */
export const sortInventoryItems = (items, sortBy) => {
  if (!sortBy.field || !sortBy.direction) return items;

  return [...items].sort((a, b) => {
    let aVal, bVal;

    switch (sortBy.field) {
      case 'sku':
        aVal = a.product?.sku || '';
        bVal = b.product?.sku || '';
        break;
      case 'name':
        aVal = a.product?.name || '';
        bVal = b.product?.name || '';
        break;
      case 'category':
        aVal = a.product?.category || '';
        bVal = b.product?.category || '';
        break;
      case 'warehouse':
        aVal = a.location?.name || '';
        bVal = b.location?.name || '';
        break;
      case 'quantity':
        aVal = a.quantity || 0;
        bVal = b.quantity || 0;
        return sortBy.direction === 'asc' ? aVal - bVal : bVal - aVal;
      case 'available':
        aVal = a.available_quantity || 0;
        bVal = b.available_quantity || 0;
        return sortBy.direction === 'asc' ? aVal - bVal : bVal - aVal;
      case 'status':
        aVal = a.status || '';
        bVal = b.status || '';
        break;
      default:
        return 0;
    }

    // String comparison
    const comparison = String(aVal).localeCompare(String(bVal));
    return sortBy.direction === 'asc' ? comparison : -comparison;
  });
};

/**
 * Sorts movements based on field and direction
 * @param {Array} movements - Array of movements
 * @param {Object} sortBy - Sort configuration { field, direction }
 * @returns {Array} Sorted movements
 */
export const sortMovements = (movements, sortBy) => {
  if (!sortBy.field || !sortBy.direction) return movements;

  return [...movements].sort((a, b) => {
    let aVal, bVal;

    switch (sortBy.field) {
      case 'date':
        aVal = new Date(a.occurred_at).getTime();
        bVal = new Date(b.occurred_at).getTime();
        return sortBy.direction === 'asc' ? aVal - bVal : bVal - aVal;
      case 'type':
        aVal = a.movement_type || '';
        bVal = b.movement_type || '';
        break;
      case 'product':
        aVal = a.product?.name || '';
        bVal = b.product?.name || '';
        break;
      case 'location':
        aVal = a.location?.name || '';
        bVal = b.location?.name || '';
        break;
      case 'quantity':
        aVal = a.quantity || 0;
        bVal = b.quantity || 0;
        return sortBy.direction === 'asc' ? aVal - bVal : bVal - aVal;
      case 'user':
        aVal = a.created_by?.name || '';
        bVal = b.created_by?.name || '';
        break;
      default:
        return 0;
    }

    // String comparison
    const comparison = String(aVal).localeCompare(String(bVal));
    return sortBy.direction === 'asc' ? comparison : -comparison;
  });
};
