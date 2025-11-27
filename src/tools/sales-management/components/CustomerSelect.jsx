import React from 'react';
import { SearchableSelect } from '../../../components/ui/searchable-select';

/**
 * CustomerSelect - Dropdown for selecting customers
 * Uses base SearchableSelect with custom rendering for customer details
 */
export function CustomerSelect({
  value,
  onChange,
  customers = [],
  placeholder = 'Select Customer...',
  className = '',
  required = false,
}) {
  // Adapt onChange to match existing event-style API
  const handleChange = (newValue) => {
    onChange({ target: { value: newValue } });
  };

  return (
    <SearchableSelect
      value={value}
      onChange={handleChange}
      options={customers}
      getOptionValue={(customer) => customer.id}
      getOptionLabel={(customer) =>
        customer.company_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
      }
      placeholder={placeholder}
      className={className}
      searchable={true}
      searchKeys={['company_name', 'first_name', 'last_name', 'email']}
      searchPlaceholder="Search by name or email..."
      clearable={!required}
      renderOption={(customer) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">
            {customer.company_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim()}
          </span>
          {customer.email && (
            <span className="text-xs text-gray-500">{customer.email}</span>
          )}
        </div>
      )}
      renderSelected={(customer) => (
        <span className="text-gray-900">
          {customer.company_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim()}
        </span>
      )}
    />
  );
}

export default CustomerSelect;
