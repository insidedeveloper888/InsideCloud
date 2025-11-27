/**
 * Project FilterPanel - Uses shared FilterPanel components
 * Maintains backward compatibility with existing onFilterChange(type, value) API
 */

import React from 'react';
import { FilterPanel, FilterSection } from '../../../components/ui/filter-panel';
import { CheckboxFilter, DateRangeFilter } from '../../../components/ui/filters';

// Static status options
const PROJECT_STATUSES = [
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function ProjectFilterPanel({
  isOpen,
  onClose,
  filters = {},
  onFilterChange,
  templates = [],
}) {
  // Check if any filters are active
  const hasActiveFilters =
    (filters.status?.length > 0) ||
    (filters.templates?.length > 0);

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
    >
      {/* Project Status */}
      <FilterSection
        title="Project Status"
        defaultExpanded={true}
        activeCount={filters.status?.length || 0}
      >
        <CheckboxFilter
          options={PROJECT_STATUSES}
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

      {/* Due Date - Note: This was non-functional in original, keeping as placeholder */}
      <FilterSection
        title="Due Date"
        defaultExpanded={false}
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
