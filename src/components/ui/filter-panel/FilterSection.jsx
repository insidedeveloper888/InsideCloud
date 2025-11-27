/**
 * FilterSection - Collapsible Section for Filter Groups
 *
 * A collapsible container for grouping related filters with
 * expand/collapse functionality and optional active count badge.
 *
 * Features:
 * - Expand/collapse toggle
 * - Active filter count badge
 * - Consistent styling with filter panel
 *
 * @example
 * <FilterSection
 *   title="Status"
 *   defaultExpanded={true}
 *   activeCount={2}
 * >
 *   <CheckboxFilter ... />
 * </FilterSection>
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function FilterSection({
  title,
  defaultExpanded = true,
  activeCount = 0,
  children,
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <button
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{title}</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown size={16} className="text-gray-500" />
        ) : (
          <ChevronRight size={16} className="text-gray-500" />
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-3 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}
