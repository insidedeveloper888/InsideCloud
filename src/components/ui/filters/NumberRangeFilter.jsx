/**
 * NumberRangeFilter - Number Range Filter Component
 *
 * Two number inputs for filtering by numeric range (min/max).
 * Handles null values properly for optional filtering.
 *
 * Features:
 * - Min/Max number inputs
 * - Optional step and decimal precision
 * - Null value handling (empty = no filter)
 * - Optional labels
 * - Optional prefix (e.g., currency symbol)
 *
 * @example
 * <NumberRangeFilter
 *   minValue={filters.priceMin}
 *   maxValue={filters.priceMax}
 *   onMinChange={(val) => setFilters({ ...filters, priceMin: val })}
 *   onMaxChange={(val) => setFilters({ ...filters, priceMax: val })}
 *   prefix="RM"
 *   step={0.01}
 *   minLabel="Min"
 *   maxLabel="Max"
 * />
 */

import React from 'react';

export default function NumberRangeFilter({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minLabel = 'Min',
  maxLabel = 'Max',
  prefix = '',
  step = 1,
  placeholder = '',
  className = '',
}) {
  const handleMinChange = (e) => {
    const val = e.target.value;
    onMinChange(val === '' ? null : parseFloat(val));
  };

  const handleMaxChange = (e) => {
    const val = e.target.value;
    onMaxChange(val === '' ? null : parseFloat(val));
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Min Value */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500 w-10 flex-shrink-0">
          {minLabel}
        </span>
        <div className="flex-1 relative">
          {prefix && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {prefix}
            </span>
          )}
          <input
            type="number"
            value={minValue ?? ''}
            onChange={handleMinChange}
            step={step}
            placeholder={placeholder}
            className={`w-full text-sm border border-gray-300 rounded-md py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              prefix ? 'pl-8 pr-2' : 'px-2'
            }`}
          />
        </div>
      </div>

      {/* Max Value */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500 w-10 flex-shrink-0">
          {maxLabel}
        </span>
        <div className="flex-1 relative">
          {prefix && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {prefix}
            </span>
          )}
          <input
            type="number"
            value={maxValue ?? ''}
            onChange={handleMaxChange}
            step={step}
            min={minValue ?? undefined}
            placeholder={placeholder}
            className={`w-full text-sm border border-gray-300 rounded-md py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              prefix ? 'pl-8 pr-2' : 'px-2'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
