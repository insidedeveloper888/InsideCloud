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
import {
  STOCK_STATUS_OPTIONS,
  MOVEMENT_TYPE_OPTIONS,
  ITEM_TYPE_OPTIONS,
  PO_STATUS_OPTIONS,
  DO_STATUS_OPTIONS,
} from '../utils/filterConstants';
import {
  hasActiveFilters as checkActiveFilters,
  getEmptyFilters,
  getVisibleSections,
} from '../utils/filterHelpers';
import { useFilterOptions } from '../hooks/useFilterOptions';

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
  const updateFilter = (key, value) => onFiltersChange({ ...filters, [key]: value });

  // Check if any filters are active and clear all helper
  const hasActiveFilters = useMemo(() => checkActiveFilters(filters), [filters]);
  const handleClearAll = () => onFiltersChange(getEmptyFilters());

  // Transform data to filter options
  const {
    categoryOptions,
    stateOptions,
    locationOptions,
    supplierOptions,
    userOptions,
    customerOptions,
  } = useFilterOptions({ categories, states, locations, suppliers, users, customers });

  // Determine which sections to show based on tab
  const showSection = useMemo(() => getVisibleSections(currentTab), [currentTab]);

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
