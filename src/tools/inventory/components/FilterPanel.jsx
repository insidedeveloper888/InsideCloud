/**
 * InventoryFilterPanel - Complex context-aware filter panel
 * Uses shared FilterPanel components with tab-specific sections
 *
 * Shows different filter sections based on currentTab:
 * - overview: Category, Location, Stock Status, Quantity Range
 * - products: Item Type, Category
 * - movements: Location, Movement Type, Date Range, Operator
 * - purchase-orders: Location, Supplier, PO Status, Order Date, Expected Delivery, Managed By
 * - delivery-orders: Location, DO Status, Order Date, Customer, Created By
 * - suppliers: State
 */

import React, { useMemo } from 'react';
import { FilterPanel, FilterSection } from '../../../components/ui/filter-panel';
import {
  CheckboxFilter,
  SearchableCheckboxFilter,
  DateRangeFilter,
  NumberRangeFilter,
} from '../../../components/ui/filters';

// Static options
const STOCK_STATUS_OPTIONS = [
  { id: 'normal', label: 'Normal' },
  { id: 'low_stock', label: 'Low Stock' },
  { id: 'out_of_stock', label: 'Out of Stock' },
  { id: 'no_stock', label: 'Unstocked' },
];

const MOVEMENT_TYPE_OPTIONS = [
  { id: 'stock_in', label: 'Stock In' },
  { id: 'stock_out', label: 'Stock Out' },
];

const ITEM_TYPE_OPTIONS = [
  { id: 'selling', label: 'Selling Items' },
  { id: 'spare', label: 'Non-Selling' },
];

const PO_STATUS_OPTIONS = [
  { id: 'draft', label: 'Draft' },
  { id: 'ordered', label: 'Ordered' },
  { id: 'in_transit', label: 'In Transit' },
  { id: 'received', label: 'Received' },
];

const DO_STATUS_OPTIONS = [
  { id: 'draft', label: 'Draft' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'delivered', label: 'Delivered' },
];

export default function InventoryFilterPanel({
  isOpen,
  onClose,
  filters = {},
  onFiltersChange,
  currentTab = 'overview',
  // Data props
  categories = [],
  locations = [],
  suppliers = [],
  users = [],
  customers = [],
  states = [],
}) {
  // Helper to update a single filter field
  const updateFilter = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
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
  }, [filters]);

  // Clear all filters
  const handleClearAll = () => {
    onFiltersChange({
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
    });
  };

  // Transform categories array (strings) to option objects
  const categoryOptions = useMemo(
    () => categories.map((cat) => ({ id: cat, label: cat })),
    [categories]
  );

  // Transform states array (strings) to option objects
  const stateOptions = useMemo(
    () => states.map((s) => ({ id: s, label: s })),
    [states]
  );

  // Transform locations to include label key
  const locationOptions = useMemo(
    () => locations.map((loc) => ({ ...loc, label: loc.name })),
    [locations]
  );

  // Transform suppliers to include label key
  const supplierOptions = useMemo(
    () =>
      suppliers.map((sup) => ({
        ...sup,
        label:
          sup.name ||
          sup.company_name ||
          `${sup.first_name || ''} ${sup.last_name || ''}`.trim() ||
          'Unknown',
      })),
    [suppliers]
  );

  // Transform users to include label key
  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        label: user.display_name || user.email || 'Unknown',
      })),
    [users]
  );

  // Transform customers to include label key
  const customerOptions = useMemo(
    () =>
      customers.map((cust) => ({
        ...cust,
        label:
          cust.company_name ||
          `${cust.first_name || ''} ${cust.last_name || ''}`.trim() ||
          'Unknown',
      })),
    [customers]
  );

  // Determine which sections to show based on tab
  const showSection = {
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

  return (
    <FilterPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      position="right"
      hasActiveFilters={hasActiveFilters}
      onClearAll={handleClearAll}
    >
      {/* ==================== PRODUCTS TAB ==================== */}

      {/* Item Type (products tab only) - Radio-style */}
      {showSection.itemType && (
        <FilterSection
          title="Item Type"
          defaultExpanded={true}
          activeCount={filters.itemType ? 1 : 0}
        >
          <CheckboxFilter
            options={ITEM_TYPE_OPTIONS}
            selected={filters.itemType ? [filters.itemType] : []}
            onChange={(selected) =>
              updateFilter('itemType', selected.length > 0 ? selected[selected.length - 1] : null)
            }
          />
        </FilterSection>
      )}

      {/* ==================== OVERVIEW & PRODUCTS TABS ==================== */}

      {/* Category (overview, products) */}
      {showSection.category && categoryOptions.length > 0 && (
        <FilterSection
          title="Category"
          defaultExpanded={true}
          activeCount={filters.categories?.length || 0}
        >
          <SearchableCheckboxFilter
            options={categoryOptions}
            selected={filters.categories || []}
            onChange={(selected) => updateFilter('categories', selected)}
            searchPlaceholder="Search categories..."
            maxHeight="200px"
          />
        </FilterSection>
      )}

      {/* ==================== OVERVIEW TAB ==================== */}

      {/* Stock Status (overview only) */}
      {showSection.stockStatus && (
        <FilterSection
          title="Stock Status"
          defaultExpanded={true}
          activeCount={filters.stockStatuses?.length || 0}
        >
          <CheckboxFilter
            options={STOCK_STATUS_OPTIONS}
            selected={filters.stockStatuses || []}
            onChange={(selected) => updateFilter('stockStatuses', selected)}
          />
        </FilterSection>
      )}

      {/* Quantity Range (overview only) */}
      {showSection.quantityRange && (
        <FilterSection
          title="Quantity Range"
          defaultExpanded={false}
          activeCount={filters.minQuantity != null || filters.maxQuantity != null ? 1 : 0}
        >
          <NumberRangeFilter
            minValue={filters.minQuantity}
            maxValue={filters.maxQuantity}
            onMinChange={(value) => updateFilter('minQuantity', value)}
            onMaxChange={(value) => updateFilter('maxQuantity', value)}
            minLabel="Min"
            maxLabel="Max"
          />
          <p className="text-xs text-gray-500 italic mt-2">
            Filter by stock quantity in warehouse
          </p>
        </FilterSection>
      )}

      {/* ==================== SHARED: LOCATION ==================== */}

      {/* Location (overview, movements, purchase-orders, delivery-orders) */}
      {showSection.location && locationOptions.length > 0 && (
        <FilterSection
          title="Warehouse"
          defaultExpanded={true}
          activeCount={filters.locations?.length || 0}
        >
          <SearchableCheckboxFilter
            options={locationOptions}
            selected={filters.locations || []}
            onChange={(selected) => updateFilter('locations', selected)}
            searchPlaceholder="Search warehouses..."
            maxHeight="200px"
          />
        </FilterSection>
      )}

      {/* ==================== MOVEMENTS TAB ==================== */}

      {/* Movement Type */}
      {showSection.movementType && (
        <FilterSection
          title="Movement Type"
          defaultExpanded={true}
          activeCount={filters.movementTypes?.length || 0}
        >
          <CheckboxFilter
            options={MOVEMENT_TYPE_OPTIONS}
            selected={filters.movementTypes || []}
            onChange={(selected) => updateFilter('movementTypes', selected)}
          />
        </FilterSection>
      )}

      {/* Movement Date Range */}
      {showSection.movementDate && (
        <FilterSection
          title="Date Range"
          defaultExpanded={false}
          activeCount={filters.movementDateFrom || filters.movementDateTo ? 1 : 0}
        >
          <DateRangeFilter
            fromDate={filters.movementDateFrom || ''}
            toDate={filters.movementDateTo || ''}
            onFromDateChange={(value) => updateFilter('movementDateFrom', value || '')}
            onToDateChange={(value) => updateFilter('movementDateTo', value || '')}
          />
        </FilterSection>
      )}

      {/* Operator (movements) */}
      {showSection.operator && userOptions.length > 0 && (
        <FilterSection
          title="Operator"
          defaultExpanded={false}
          activeCount={filters.users?.length || 0}
        >
          <SearchableCheckboxFilter
            options={userOptions}
            selected={filters.users || []}
            onChange={(selected) => updateFilter('users', selected)}
            searchPlaceholder="Search operators..."
            maxHeight="200px"
          />
        </FilterSection>
      )}

      {/* ==================== PURCHASE ORDERS TAB ==================== */}

      {/* Supplier */}
      {showSection.supplier && supplierOptions.length > 0 && (
        <FilterSection
          title="Supplier"
          defaultExpanded={true}
          activeCount={filters.suppliers?.length || 0}
        >
          <SearchableCheckboxFilter
            options={supplierOptions}
            selected={filters.suppliers || []}
            onChange={(selected) => updateFilter('suppliers', selected)}
            searchPlaceholder="Search suppliers..."
            maxHeight="200px"
          />
        </FilterSection>
      )}

      {/* PO Status */}
      {showSection.poStatus && (
        <FilterSection
          title="PO Status"
          defaultExpanded={true}
          activeCount={filters.poStatuses?.length || 0}
        >
          <CheckboxFilter
            options={PO_STATUS_OPTIONS}
            selected={filters.poStatuses || []}
            onChange={(selected) => updateFilter('poStatuses', selected)}
          />
        </FilterSection>
      )}

      {/* PO Order Date */}
      {showSection.poOrderDate && (
        <FilterSection
          title="Order Date"
          defaultExpanded={false}
          activeCount={filters.poOrderDateFrom || filters.poOrderDateTo ? 1 : 0}
        >
          <DateRangeFilter
            fromDate={filters.poOrderDateFrom || ''}
            toDate={filters.poOrderDateTo || ''}
            onFromDateChange={(value) => updateFilter('poOrderDateFrom', value || '')}
            onToDateChange={(value) => updateFilter('poOrderDateTo', value || '')}
          />
        </FilterSection>
      )}

      {/* PO Expected Delivery Date */}
      {showSection.poExpectedDelivery && (
        <FilterSection
          title="Expected Delivery"
          defaultExpanded={false}
          activeCount={filters.poExpectedDeliveryFrom || filters.poExpectedDeliveryTo ? 1 : 0}
        >
          <DateRangeFilter
            fromDate={filters.poExpectedDeliveryFrom || ''}
            toDate={filters.poExpectedDeliveryTo || ''}
            onFromDateChange={(value) => updateFilter('poExpectedDeliveryFrom', value || '')}
            onToDateChange={(value) => updateFilter('poExpectedDeliveryTo', value || '')}
          />
        </FilterSection>
      )}

      {/* Managed By (PO) */}
      {showSection.managedBy && userOptions.length > 0 && (
        <FilterSection
          title="Managed By"
          defaultExpanded={false}
          activeCount={filters.managedBy?.length || 0}
        >
          <SearchableCheckboxFilter
            options={userOptions}
            selected={filters.managedBy || []}
            onChange={(selected) => updateFilter('managedBy', selected)}
            searchPlaceholder="Search users..."
            maxHeight="200px"
          />
        </FilterSection>
      )}

      {/* ==================== DELIVERY ORDERS TAB ==================== */}

      {/* DO Status */}
      {showSection.doStatus && (
        <FilterSection
          title="DO Status"
          defaultExpanded={true}
          activeCount={filters.doStatuses?.length || 0}
        >
          <CheckboxFilter
            options={DO_STATUS_OPTIONS}
            selected={filters.doStatuses || []}
            onChange={(selected) => updateFilter('doStatuses', selected)}
          />
        </FilterSection>
      )}

      {/* DO Order Date */}
      {showSection.doOrderDate && (
        <FilterSection
          title="Order Date"
          defaultExpanded={false}
          activeCount={filters.doOrderDateFrom || filters.doOrderDateTo ? 1 : 0}
        >
          <DateRangeFilter
            fromDate={filters.doOrderDateFrom || ''}
            toDate={filters.doOrderDateTo || ''}
            onFromDateChange={(value) => updateFilter('doOrderDateFrom', value || '')}
            onToDateChange={(value) => updateFilter('doOrderDateTo', value || '')}
          />
        </FilterSection>
      )}

      {/* Customer (DO) */}
      {showSection.customer && customerOptions.length > 0 && (
        <FilterSection
          title="Customer"
          defaultExpanded={true}
          activeCount={filters.customers?.length || 0}
        >
          <SearchableCheckboxFilter
            options={customerOptions}
            selected={filters.customers || []}
            onChange={(selected) => updateFilter('customers', selected)}
            searchPlaceholder="Search customers..."
            maxHeight="200px"
          />
        </FilterSection>
      )}

      {/* Created By (DO) */}
      {showSection.createdBy && userOptions.length > 0 && (
        <FilterSection
          title="Created By"
          defaultExpanded={false}
          activeCount={filters.createdBy?.length || 0}
        >
          <SearchableCheckboxFilter
            options={userOptions}
            selected={filters.createdBy || []}
            onChange={(selected) => updateFilter('createdBy', selected)}
            searchPlaceholder="Search users..."
            maxHeight="200px"
          />
        </FilterSection>
      )}

      {/* ==================== SUPPLIERS TAB ==================== */}

      {/* State */}
      {showSection.state && stateOptions.length > 0 && (
        <FilterSection
          title="State"
          defaultExpanded={true}
          activeCount={filters.states?.length || 0}
        >
          <CheckboxFilter
            options={stateOptions}
            selected={filters.states || []}
            onChange={(selected) => updateFilter('states', selected)}
          />
        </FilterSection>
      )}
    </FilterPanel>
  );
}
