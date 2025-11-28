/**
 * FilterPanel - Composable Filter Container Component
 *
 * A responsive filter panel that serves as a container for filter sections.
 * Renders as a mobile drawer (right-side) or desktop sidebar.
 *
 * Features:
 * - Mobile: Full-height drawer with backdrop overlay
 * - Desktop: Static sidebar with border (or overlay if overlay=true)
 * - Body scroll lock on mobile when open (or always if overlay=true)
 * - Escape key to close
 * - Clear all filters button
 *
 * @example
 * <FilterPanel
 *   isOpen={showFilters}
 *   onClose={() => setShowFilters(false)}
 *   onClearAll={handleClearFilters}
 *   hasActiveFilters={activeFilterCount > 0}
 *   title="Filters"
 *   overlay={true} // Always render as slide-out drawer with backdrop
 * >
 *   <FilterSection title="Status" defaultExpanded>
 *     <CheckboxFilter ... />
 *   </FilterSection>
 * </FilterPanel>
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { shadows } from '../../../lib/design-tokens';

export default function FilterPanel({
  isOpen = true,
  onClose,
  onClearAll,
  hasActiveFilters = false,
  title = 'Filters',
  children,
  className = '',
  position = 'right', // 'left' or 'right'
  width = 256, // default w-64 = 256px
  showCloseButton = true, // show close button in header (always on mobile, configurable on desktop)
  overlay = false, // if true, always render as fixed drawer with backdrop on all screen sizes
}) {
  // Prevent body scroll when drawer is open (mobile or overlay mode)
  useEffect(() => {
    const shouldLockScroll = isOpen && (overlay || (typeof window !== 'undefined' && window.innerWidth < 768));
    if (shouldLockScroll) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, overlay]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay backdrop - shown on mobile or when overlay=true */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${
          overlay ? '' : 'md:hidden'
        } ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Filter Panel - Mobile: Drawer, Desktop: Sidebar (or Drawer if overlay=true) */}
      <div
        className={`
          ${overlay ? 'fixed' : 'fixed md:relative'} top-0 h-full w-[85%] max-w-sm ${overlay ? '' : 'md:max-w-none'}
          bg-white text-gray-900 flex flex-col
          ${overlay ? 'z-50' : 'z-50 md:z-auto'}
          transform transition-transform duration-300 ease-in-out
          ${position === 'left' ? 'left-0' : 'right-0'}
          ${!overlay && (position === 'left' ? 'md:border-r' : 'md:border-l')}
          ${position === 'left'
            ? (isOpen ? 'translate-x-0' : `-translate-x-full ${overlay ? '' : 'md:translate-x-0'}`)
            : (isOpen ? 'translate-x-0' : `translate-x-full ${overlay ? '' : 'md:translate-x-0'}`)
          }
          border-gray-200
          ${shadows.dropdown} ${overlay ? '' : 'md:shadow-none'}
          ${className}
        `}
        style={{ width: typeof width === 'number' ? `${width}px` : width }}
        role="complementary"
        aria-label={title}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <div className="flex items-center gap-2">
              {hasActiveFilters && onClearAll && (
                <button
                  onClick={onClearAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all
                </button>
              )}
              {/* Close button - Mobile only by default, or always if showCloseButton */}
              {onClose && (
                <button
                  onClick={onClose}
                  className={`${showCloseButton ? '' : 'md:hidden'} p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors`}
                  aria-label="Close filters"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Sections */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
