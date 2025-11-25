/**
 * Sales Filter Panel Component
 * Advanced filter options for sales orders
 * Styled with Tailwind CSS
 * Responsive: Drawer on mobile, sidebar on desktop
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { useSalesOrderStatuses } from '../hooks/useSalesOrderStatuses';

export default function SalesFilterPanel({
  filters,
  onFiltersChange,
  customers = [],
  salesPersons = [],
  organizationSlug,
  isOpen = true,
  onClose = () => {}
}) {
  const { statuses } = useSalesOrderStatuses(organizationSlug);
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    customer: true,
    salesPerson: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleToggleFilter = (type, value) => {
    const newFilters = {
      ...filters,
      [type]: filters[type].includes(value)
        ? filters[type].filter((v) => v !== value)
        : [...filters[type], value],
    };
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    onFiltersChange({
      statuses: [],
      customers: [],
      salesPersons: [],
    });
  };

  const hasActiveFilters =
    filters.statuses.length > 0 ||
    filters.customers.length > 0 ||
    filters.salesPersons.length > 0;

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Don't render if not open on mobile
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile: Overlay backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Filter Panel - Mobile: Drawer, Desktop: Sidebar */}
      <div
        className={`
          fixed md:relative top-0 right-0 h-full w-[85%] max-w-sm md:max-w-none md:w-64
          bg-white md:border-r border-gray-200 flex flex-col
          z-50 md:z-auto
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          shadow-2xl md:shadow-none
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all
                </button>
              )}
              {/* Close button - Mobile only */}
              <button
                onClick={onClose}
                className="md:hidden p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

      {/* Filter Sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Status Filter */}
        <div className="border-b border-gray-200">
          <button
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('status')}
          >
            <span className="text-sm font-medium text-gray-900">Status</span>
            {expandedSections.status ? (
              <ChevronDown size={16} className="text-gray-500" />
            ) : (
              <ChevronRight size={16} className="text-gray-500" />
            )}
          </button>
          {expandedSections.status && (
            <div className="px-4 pb-3 space-y-2">
              {statuses.map((status) => (
                <label key={status.status_key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.statuses.includes(status.status_key)}
                    onChange={() => handleToggleFilter('statuses', status.status_key)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{status.status_label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Customer Filter */}
        {customers.length > 0 && (
          <div className="border-b border-gray-200">
            <button
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('customer')}
            >
              <span className="text-sm font-medium text-gray-900">Customer</span>
              {expandedSections.customer ? (
                <ChevronDown size={16} className="text-gray-500" />
              ) : (
                <ChevronRight size={16} className="text-gray-500" />
              )}
            </button>
            {expandedSections.customer && (
              <div className="px-4 pb-3 space-y-2 max-h-48 overflow-y-auto">
                {customers.map((customer) => (
                  <label key={customer.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.customers.includes(customer.id)}
                      onChange={() => handleToggleFilter('customers', customer.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {customer.company_name || `${customer.first_name} ${customer.last_name}`}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sales Person Filter */}
        {salesPersons.length > 0 && (
          <div className="border-b border-gray-200">
            <button
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('salesPerson')}
            >
              <span className="text-sm font-medium text-gray-900">Sales Person</span>
              {expandedSections.salesPerson ? (
                <ChevronDown size={16} className="text-gray-500" />
              ) : (
                <ChevronRight size={16} className="text-gray-500" />
              )}
            </button>
            {expandedSections.salesPerson && (
              <div className="px-4 pb-3 space-y-2 max-h-48 overflow-y-auto">
                {salesPersons.map((person) => (
                  <label key={person.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.salesPersons.includes(person.id)}
                      onChange={() => handleToggleFilter('salesPersons', person.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{person.display_name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
