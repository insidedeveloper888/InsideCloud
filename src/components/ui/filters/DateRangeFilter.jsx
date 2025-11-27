/**
 * DateRangeFilter - Date Range Filter Component
 *
 * Two date inputs for filtering by date range with min date validation
 * to prevent invalid ranges (start > end).
 *
 * Features:
 * - From/To date inputs
 * - Automatic min date validation (To >= From)
 * - Optional labels
 * - Clear individual dates
 *
 * @example
 * <DateRangeFilter
 *   fromDate={filters.dateFrom}
 *   toDate={filters.dateTo}
 *   onFromDateChange={(date) => setFilters({ ...filters, dateFrom: date })}
 *   onToDateChange={(date) => setFilters({ ...filters, dateTo: date })}
 *   fromLabel="From"
 *   toLabel="To"
 * />
 */

import React from 'react';

export default function DateRangeFilter({
  fromDate = '',
  toDate = '',
  onFromDateChange,
  onToDateChange,
  fromLabel = 'From',
  toLabel = 'To',
  className = '',
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* From Date */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500 w-10 flex-shrink-0">
          {fromLabel}
        </span>
        <input
          type="date"
          value={fromDate || ''}
          onChange={(e) => onFromDateChange(e.target.value || null)}
          className="flex-1 text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* To Date */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500 w-10 flex-shrink-0">
          {toLabel}
        </span>
        <input
          type="date"
          value={toDate || ''}
          onChange={(e) => onToDateChange(e.target.value || null)}
          min={fromDate || undefined}
          className="flex-1 text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}
