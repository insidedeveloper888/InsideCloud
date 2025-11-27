/**
 * SalesFilterPanel - Filter panel for Sales Management
 * Uses shared FilterPanel components with dynamic status options
 */

import React from 'react';
import { FilterPanel, FilterSection } from '../../../components/ui/filter-panel';
import { CheckboxFilter } from '../../../components/ui/filters';
import { useSalesOrderStatuses } from '../hooks/useSalesOrderStatuses';

export default function SalesFilterPanel({
  filters,
  onFiltersChange,
  customers = [],
  salesPersons = [],
  organizationSlug,
  isOpen = true,
  onClose = () => {},
}) {
  // Fetch dynamic statuses from database
  const { statuses } = useSalesOrderStatuses(organizationSlug);

  // Check if any filters are active
  const hasActiveFilters =
    filters.statuses.length > 0 ||
    filters.customers.length > 0 ||
    filters.salesPersons.length > 0;

  // Clear all filters
  const handleClearAll = () => {
    onFiltersChange({
      statuses: [],
      customers: [],
      salesPersons: [],
    });
  };

  return (
    <FilterPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      position="right"
      hasActiveFilters={hasActiveFilters}
      onClearAll={handleClearAll}
      showCloseButton={false}
    >
      {/* Status Filter */}
      <FilterSection
        title="Status"
        defaultExpanded={true}
        activeCount={filters.statuses?.length || 0}
      >
        <CheckboxFilter
          options={statuses}
          selected={filters.statuses || []}
          onChange={(selected) => onFiltersChange({ ...filters, statuses: selected })}
          idKey="status_key"
          labelKey="status_label"
        />
      </FilterSection>

      {/* Customer Filter */}
      {customers.length > 0 && (
        <FilterSection
          title="Customer"
          defaultExpanded={true}
          activeCount={filters.customers?.length || 0}
        >
          <CheckboxFilter
            options={customers}
            selected={filters.customers || []}
            onChange={(selected) => onFiltersChange({ ...filters, customers: selected })}
            idKey="id"
            renderOption={(customer) => (
              <span className="text-sm text-gray-700">
                {customer.company_name || `${customer.first_name} ${customer.last_name}`}
              </span>
            )}
            maxHeight="192px"
          />
        </FilterSection>
      )}

      {/* Sales Person Filter */}
      {salesPersons.length > 0 && (
        <FilterSection
          title="Sales Person"
          defaultExpanded={true}
          activeCount={filters.salesPersons?.length || 0}
        >
          <CheckboxFilter
            options={salesPersons}
            selected={filters.salesPersons || []}
            onChange={(selected) => onFiltersChange({ ...filters, salesPersons: selected })}
            idKey="id"
            labelKey="display_name"
            maxHeight="192px"
          />
        </FilterSection>
      )}
    </FilterPanel>
  );
}
