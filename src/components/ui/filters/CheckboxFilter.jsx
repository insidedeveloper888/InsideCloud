/**
 * CheckboxFilter - Checkbox List Filter Component
 *
 * Renders a list of checkbox options for filtering. Supports custom
 * option rendering for items like colored dots, badges, etc.
 *
 * Features:
 * - Standard checkbox list
 * - Custom renderOption for complex labels
 * - Controlled selection state
 * - Accessible labels
 *
 * @example
 * // Simple usage
 * <CheckboxFilter
 *   options={[
 *     { id: 'active', label: 'Active' },
 *     { id: 'pending', label: 'Pending' },
 *   ]}
 *   selected={filters.status}
 *   onChange={(selected) => setFilters({ ...filters, status: selected })}
 * />
 *
 * // With custom rendering (color dots)
 * <CheckboxFilter
 *   options={stages}
 *   selected={filters.stages}
 *   onChange={(selected) => setFilters({ ...filters, stages: selected })}
 *   renderOption={(option) => (
 *     <div className="flex items-center gap-2">
 *       <div
 *         className="w-3 h-3 rounded-full"
 *         style={{ backgroundColor: option.color }}
 *       />
 *       <span>{option.label}</span>
 *     </div>
 *   )}
 * />
 */

import React from 'react';

export default function CheckboxFilter({
  options = [],
  selected = [],
  onChange,
  renderOption,
  idKey = 'id',
  labelKey = 'label',
  className = '',
  maxHeight = null, // e.g., '192px' or '12rem' for scrollable lists
}) {
  const handleToggle = (optionId) => {
    const newSelected = selected.includes(optionId)
      ? selected.filter((id) => id !== optionId)
      : [...selected, optionId];
    onChange(newSelected);
  };

  if (options.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">No options available</p>
    );
  }

  const containerStyle = maxHeight ? { maxHeight, overflowY: 'auto' } : {};

  return (
    <div className={`space-y-2 ${className}`} style={containerStyle}>
      {options.map((option) => {
        const optionId = option[idKey];
        const optionLabel = option[labelKey];
        const isChecked = selected.includes(optionId);

        return (
          <label
            key={optionId}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleToggle(optionId)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            {renderOption ? (
              renderOption(option)
            ) : (
              <span className="text-sm text-gray-900">{optionLabel}</span>
            )}
          </label>
        );
      })}
    </div>
  );
}
