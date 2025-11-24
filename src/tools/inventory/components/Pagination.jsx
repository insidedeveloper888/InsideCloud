import React from 'react';

/**
 * Pagination Component
 * Displays pagination controls with page numbers and navigation buttons
 */
const Pagination = ({ currentPage, totalItems, onPageChange, itemsPerPage = 10 }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-white">
      <span className="text-sm text-gray-900 font-medium">
        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
      </span>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm text-gray-900 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
        >
          Previous
        </button>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i + 1}
            onClick={() => onPageChange(i + 1)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${currentPage === i + 1 ? 'bg-emerald-500 text-white font-semibold' : 'border border-gray-300 text-gray-900 hover:bg-gray-100'}`}
          >
            {i + 1}
          </button>
        )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm text-gray-900 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
