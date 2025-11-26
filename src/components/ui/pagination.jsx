import React from 'react';

/**
 * Pagination Component
 * Displays pagination controls with page numbers and navigation buttons.
 * Automatically hides when there's only one page of content.
 *
 * @param {Object} props - Component props
 * @param {number} props.currentPage - Current active page (1-indexed)
 * @param {number} props.totalItems - Total number of items being paginated
 * @param {function} props.onPageChange - Callback when page changes: (pageNumber) => void
 * @param {number} [props.itemsPerPage=10] - Number of items per page
 * @param {number} [props.maxVisible=5] - Maximum number of page buttons to show
 * @param {boolean} [props.showItemCount=true] - Whether to show "Showing X-Y of Z" text
 *
 * @example
 * <Pagination
 *   currentPage={1}
 *   totalItems={100}
 *   onPageChange={(page) => setCurrentPage(page)}
 *   itemsPerPage={10}
 * />
 */
export function Pagination({
  currentPage,
  totalItems,
  onPageChange,
  itemsPerPage = 10,
  maxVisible = 5,
  showItemCount = true,
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Hide pagination when only one page
  if (totalPages <= 1) return null;

  // Calculate visible page range (centered around current page)
  const halfVisible = Math.floor(maxVisible / 2);
  let startPage = Math.max(1, currentPage - halfVisible);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  // Adjust start if we're near the end
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const visiblePages = [];
  for (let i = startPage; i <= endPage; i++) {
    visiblePages.push(i);
  }

  // Calculate item range for display
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-white">
      {showItemCount && (
        <span className="text-sm text-gray-900 font-medium">
          Showing {startItem}-{endItem} of {totalItems}
        </span>
      )}
      {!showItemCount && <div />}

      <div className="flex items-center space-x-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm text-gray-900 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
        >
          Previous
        </button>

        {/* Page Numbers */}
        {visiblePages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              currentPage === page
                ? 'bg-emerald-500 text-white font-semibold'
                : 'border border-gray-300 text-gray-900 hover:bg-gray-100'
            }`}
          >
            {page}
          </button>
        ))}

        {/* Next Button */}
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
}

export default Pagination;
