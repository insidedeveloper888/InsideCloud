import React from 'react';

/**
 * Creates a toggle sort function for a given setter
 * Cycles through: none -> asc -> desc -> none
 *
 * @param {Function} setter - State setter function for sort state
 * @returns {Function} Toggle function that accepts a field name
 */
export const createToggleSort = (setter) => (field) => {
  setter(prev => {
    if (prev.field !== field) return { field, direction: 'asc' };
    if (prev.direction === 'asc') return { field, direction: 'desc' };
    return { field: '', direction: '' };
  });
};

/**
 * Creates a sort icon component for a given sort state
 * Shows: ↕ (unsorted), ↑ (ascending), ↓ (descending)
 *
 * @param {Object} sortState - Current sort state { field, direction }
 * @returns {Function} Component that renders sort indicator
 */
export const createSortIcon = (sortState) => ({ field }) => {
  if (sortState.field !== field) {
    return <span className="text-gray-300">↕</span>;
  }
  if (sortState.direction === 'asc') {
    return <span className="text-blue-600">↑</span>;
  }
  return <span className="text-blue-600">↓</span>;
};

/**
 * Generic sorting function for arrays
 *
 * @param {Array} array - Array to sort
 * @param {Object} sortBy - Sort configuration { field, direction }
 * @param {Function} getValue - Function to extract value from item
 * @returns {Array} Sorted array
 */
export const sortArray = (array, sortBy, getValue) => {
  if (!sortBy.field) return array;

  return [...array].sort((a, b) => {
    const aVal = getValue(a, sortBy.field);
    const bVal = getValue(b, sortBy.field);

    // Handle null/undefined values
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    // Compare values
    let comparison = 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    } else {
      comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    }

    return sortBy.direction === 'asc' ? comparison : -comparison;
  });
};
