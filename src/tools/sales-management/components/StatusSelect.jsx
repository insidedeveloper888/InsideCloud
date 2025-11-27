import React from 'react';
import { SearchableSelect } from '../../../components/ui/searchable-select';

/**
 * StatusSelect - Dropdown for selecting status
 * Uses base SearchableSelect with search disabled
 */
export function StatusSelect({
  value,
  onChange,
  statuses = [],
  placeholder = 'Select Status...',
  className = '',
}) {
  // Adapt onChange to match existing event-style API
  const handleChange = (newValue) => {
    onChange({ target: { value: newValue } });
  };

  return (
    <SearchableSelect
      value={value}
      onChange={handleChange}
      options={statuses}
      getOptionValue={(status) => status.status_key}
      getOptionLabel={(status) => status.status_label}
      placeholder={placeholder}
      className={className}
      searchable={false}
      clearable={false}
    />
  );
}

export default StatusSelect;
