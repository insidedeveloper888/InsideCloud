import React from 'react';
import { SearchableSelect as BaseSearchableSelect } from '../../../components/ui/searchable-select';

/**
 * SearchableSelect - Inventory-specific wrapper
 * Maintains backward compatibility with existing props API
 * Uses emerald/green theme to match Inventory modals
 */
export function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  className = '',
  allowAddNew = false,
  onAddNew = null,
  addNewLabel = '+ Add New...',
}) {
  return (
    <BaseSearchableSelect
      value={value}
      onChange={onChange}
      options={options}
      getOptionValue={(opt) => opt.value}
      getOptionLabel={(opt) => opt.label}
      placeholder={placeholder}
      className={className}
      searchable={true}
      clearable={false}
      creatable={allowAddNew}
      onCreate={onAddNew}
      createLabel={() => addNewLabel}
      // Inventory-specific styling (emerald theme)
      triggerClassName="border-2 border-gray-200 rounded-xl hover:border-gray-300"
      inputClassName="focus:ring-emerald-500 focus:border-emerald-500"
      optionClassName="text-gray-700 hover:bg-emerald-50"
    />
  );
}

export default SearchableSelect;
