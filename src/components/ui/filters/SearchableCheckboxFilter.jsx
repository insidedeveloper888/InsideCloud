/**
 * SearchableCheckboxFilter - Searchable Checkbox List Filter
 *
 * Extends CheckboxFilter with a search input for filtering long lists.
 * Useful for filters with many options like customers, products, etc.
 *
 * Features:
 * - Search input to filter options
 * - Max height with scroll for long lists
 * - All CheckboxFilter features (custom rendering, etc.)
 * - Empty state when no matches
 *
 * @example
 * <SearchableCheckboxFilter
 *   options={customers}
 *   selected={filters.customers}
 *   onChange={(selected) => setFilters({ ...filters, customers: selected })}
 *   searchPlaceholder="Search customers..."
 *   maxHeight="200px"
 * />
 */

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import CheckboxFilter from './CheckboxFilter';

export default function SearchableCheckboxFilter({
  options = [],
  selected = [],
  onChange,
  renderOption,
  idKey = 'id',
  labelKey = 'label',
  searchPlaceholder = 'Search...',
  maxHeight = '200px',
  className = '',
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;

    const lowerSearch = searchTerm.toLowerCase();
    return options.filter((option) => {
      const label = option[labelKey];
      return label && label.toLowerCase().includes(lowerSearch);
    });
  }, [options, searchTerm, labelKey]);

  return (
    <div className={className}>
      {/* Search Input */}
      <div className="relative mb-2">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Checkbox List */}
      <div
        className="overflow-y-auto"
        style={{ maxHeight }}
      >
        {filteredOptions.length === 0 ? (
          <p className="text-sm text-gray-500 italic py-2">
            {searchTerm ? 'No matches found' : 'No options available'}
          </p>
        ) : (
          <CheckboxFilter
            options={filteredOptions}
            selected={selected}
            onChange={onChange}
            renderOption={renderOption}
            idKey={idKey}
            labelKey={labelKey}
          />
        )}
      </div>
    </div>
  );
}
