/**
 * Helper functions for inventory filter panel
 */

/**
 * Transform data arrays to filter option format
 */
export function transformFilterOptions(data, type) {
  switch (type) {
    case 'categories':
    case 'states':
      // Simple string arrays → { id, label }
      return data.map((item) => ({ id: item, label: item }));

    case 'locations':
      // Locations have 'name' property
      return data.map((loc) => ({ ...loc, label: loc.name }));

    case 'suppliers':
      // Suppliers can have name, company_name, or first_name + last_name
      return data.map((sup) => ({
        ...sup,
        label:
          sup.name ||
          sup.company_name ||
          `${sup.first_name || ''} ${sup.last_name || ''}`.trim() ||
          'Unknown',
      }));

    case 'users':
      // Users have display_name or email
      return data.map((user) => ({
        ...user,
        label: user.display_name || user.email || 'Unknown',
      }));

    case 'customers':
      // Customers can have company_name or first_name + last_name
      return data.map((cust) => ({
        ...cust,
        label:
          cust.company_name ||
          `${cust.first_name || ''} ${cust.last_name || ''}`.trim() ||
          'Unknown',
      }));

    default:
      return data;
  }
}

/**
 * Check if any filters are currently active
 */
export function hasActiveFilters(filters) {
  return (
    filters.categories?.length > 0 ||
    filters.locations?.length > 0 ||
    filters.suppliers?.length > 0 ||
    filters.stockStatuses?.length > 0 ||
    filters.showInactive ||
    filters.minQuantity != null ||
    filters.maxQuantity != null ||
    filters.movementTypes?.length > 0 ||
    filters.movementDateFrom ||
    filters.movementDateTo ||
    filters.users?.length > 0 ||
    filters.poStatuses?.length > 0 ||
    filters.managedBy?.length > 0 ||
    filters.poOrderDateFrom ||
    filters.poOrderDateTo ||
    filters.poExpectedDeliveryFrom ||
    filters.poExpectedDeliveryTo ||
    filters.doStatuses?.length > 0 ||
    filters.customers?.length > 0 ||
    filters.createdBy?.length > 0 ||
    filters.doOrderDateFrom ||
    filters.doOrderDateTo ||
    filters.states?.length > 0 ||
    filters.itemType != null
  );
}

/**
 * Get empty filter state (for clearing all filters)
 */
export function getEmptyFilters() {
  return {
    categories: [],
    locations: [],
    suppliers: [],
    stockStatuses: [],
    showInactive: false,
    minQuantity: null,
    maxQuantity: null,
    movementTypes: [],
    movementDateFrom: '',
    movementDateTo: '',
    users: [],
    products: [],
    poStatuses: [],
    managedBy: [],
    poOrderDateFrom: '',
    poOrderDateTo: '',
    poExpectedDeliveryFrom: '',
    poExpectedDeliveryTo: '',
    doStatuses: [],
    customers: [],
    createdBy: [],
    doOrderDateFrom: '',
    doOrderDateTo: '',
    states: [],
    itemType: null,
  };
}

/**
 * Determine which filter sections to show based on active tab
 */
export function getVisibleSections(currentTab) {
  return {
    itemType: currentTab === 'products',
    category: ['overview', 'products'].includes(currentTab),
    location: ['overview', 'movements', 'purchase-orders', 'delivery-orders'].includes(currentTab),
    stockStatus: currentTab === 'overview',
    quantityRange: currentTab === 'overview',
    movementType: currentTab === 'movements',
    movementDate: currentTab === 'movements',
    operator: currentTab === 'movements',
    supplier: currentTab === 'purchase-orders',
    poStatus: currentTab === 'purchase-orders',
    poOrderDate: currentTab === 'purchase-orders',
    poExpectedDelivery: currentTab === 'purchase-orders',
    managedBy: currentTab === 'purchase-orders',
    doStatus: currentTab === 'delivery-orders',
    doOrderDate: currentTab === 'delivery-orders',
    customer: currentTab === 'delivery-orders',
    createdBy: currentTab === 'delivery-orders',
    state: currentTab === 'suppliers',
  };
}
