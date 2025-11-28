/**
 * Project FilterPanel - Uses shared FilterPanel components
 * Maintains backward compatibility with existing onFilterChange(type, value) API
 * Enhanced with member, customer, and date range filters
 */

import React from 'react';
import { FilterPanel, FilterSection } from '../../../components/ui/filter-panel';
import { CheckboxFilter, DateRangeFilter, SearchableCheckboxFilter } from '../../../components/ui/filters';

export default function ProjectFilterPanel({
  isOpen,
  onClose,
  filters = {},
  onFilterChange,
  templates = [],
  statuses = [],
  members = [],
  customers = [],
}) {
  // Convert statuses to filter format (id, label)
  const statusOptions = statuses.map(s => ({
    id: s.id,
    label: s.name,
  }));

  // Convert members to filter format
  const memberOptions = members.map(m => ({
    id: m.id,
    label: m.display_name || m.email || 'Unknown',
  }));

  // Convert customers to filter format
  const customerOptions = customers.map(c => ({
    id: c.id,
    label: c.company_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown',
  }));

  // Check if any filters are active
  const hasActiveFilters =
    (filters.status?.length > 0) ||
    (filters.templates?.length > 0) ||
    (filters.members?.length > 0) ||
    (filters.customers?.length > 0) ||
    filters.dueDateFrom ||
    filters.dueDateTo;

  // Clear all filters using existing API
  const handleClearAll = () => {
    onFilterChange('clear', null);
  };

  // Handle status filter changes
  const handleStatusChange = (selected) => {
    onFilterChange('status', selected);
  };

  // Handle template filter changes
  const handleTemplatesChange = (selected) => {
    onFilterChange('templates', selected);
  };

  // Handle member filter changes
  const handleMembersChange = (selected) => {
    onFilterChange('members', selected);
  };

  // Handle customer filter changes
  const handleCustomersChange = (selected) => {
    onFilterChange('customers', selected);
  };

  return (
    <FilterPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      position="left"
      width={320}
      hasActiveFilters={hasActiveFilters}
      onClearAll={handleClearAll}
      showCloseButton={true}
      overlay={true}
    >
      {/* Project Status */}
      <FilterSection
        title="Project Status"
        defaultExpanded={true}
        activeCount={filters.status?.length || 0}
      >
        <CheckboxFilter
          options={statusOptions}
          selected={filters.status || []}
          onChange={handleStatusChange}
        />
      </FilterSection>

      {/* Template Type */}
      <FilterSection
        title="Template Type"
        defaultExpanded={true}
        activeCount={filters.templates?.length || 0}
      >
        <CheckboxFilter
          options={templates}
          selected={filters.templates || []}
          onChange={handleTemplatesChange}
          labelKey="name"
        />
      </FilterSection>

      {/* Assigned Members */}
      {memberOptions.length > 0 && (
        <FilterSection
          title="Assigned Members"
          defaultExpanded={false}
          activeCount={filters.members?.length || 0}
        >
          <SearchableCheckboxFilter
            options={memberOptions}
            selected={filters.members || []}
            onChange={handleMembersChange}
            searchPlaceholder="Search members..."
          />
        </FilterSection>
      )}

      {/* Customers */}
      {customerOptions.length > 0 && (
        <FilterSection
          title="Customer"
          defaultExpanded={false}
          activeCount={filters.customers?.length || 0}
        >
          <SearchableCheckboxFilter
            options={customerOptions}
            selected={filters.customers || []}
            onChange={handleCustomersChange}
            searchPlaceholder="Search customers..."
          />
        </FilterSection>
      )}

      {/* Due Date */}
      <FilterSection
        title="Due Date"
        defaultExpanded={false}
        activeCount={(filters.dueDateFrom || filters.dueDateTo) ? 1 : 0}
      >
        <DateRangeFilter
          fromDate={filters.dueDateFrom || ''}
          toDate={filters.dueDateTo || ''}
          onFromDateChange={(value) => onFilterChange('dueDateFrom', value)}
          onToDateChange={(value) => onFilterChange('dueDateTo', value)}
        />
      </FilterSection>
    </FilterPanel>
  );
}
