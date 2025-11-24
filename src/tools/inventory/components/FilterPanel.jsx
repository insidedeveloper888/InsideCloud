/**
 * FilterPanel Component for Inventory
 * Advanced filter options for inventory items
 * Styled with Tailwind CSS
 * Responsive: Drawer on mobile, sidebar on desktop
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, X, Search } from 'lucide-react';

export default function FilterPanel({
  filters,
  onFiltersChange,
  categories = [],
  locations = [],
  suppliers = [],
  products = [],
  users = [],
  customers = [],
  states = [],
  isOpen = true,
  onClose = () => {},
  currentTab = 'overview'
}) {
  const [expandedSections, setExpandedSections] = useState({
    itemType: true,
    category: true,
    location: true,
    supplier: true,
    stockStatus: true,
    quantityRange: true,
    activeStatus: true,
    movementType: true,
    movementDateRange: true,
    product: true,
    user: true,
    poStatus: true,
    poDateRange: true,
    poExpectedDateRange: true,
    managedBy: true,
    doStatus: true,
    doDateRange: true,
    customer: true,
    createdBy: true,
    state: true,
  });

  // Search states for each filterable section
  const [categorySearch, setCategorySearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const STOCK_STATUS_OPTIONS = [
    { id: 'normal', label: 'Normal' },
    { id: 'low_stock', label: 'Low Stock' },
    { id: 'out_of_stock', label: 'Out of Stock' },
    { id: 'no_stock', label: 'Unstocked' },
  ];

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
      categories: [],
      locations: [],
      suppliers: [],
      stockStatuses: [],
      showInactive: false,
      minQuantity: null,
      maxQuantity: null,
      movementTypes: [],
      movementDateFrom: '',
      movementDateTo: '',
      users: [],
      products: [],
      poStatuses: [],
      managedBy: [],
      poOrderDateFrom: '',
      poOrderDateTo: '',
      poExpectedDeliveryFrom: '',
      poExpectedDeliveryTo: '',
      doStatuses: [],
      customers: [],
      createdBy: [],
      doOrderDateFrom: '',
      doOrderDateTo: '',
      states: [],
      itemType: 'selling',
    });
    // Clear search inputs
    setCategorySearch('');
    setLocationSearch('');
    setSupplierSearch('');
    setUserSearch('');
    setCustomerSearch('');
  };

  const hasActiveFilters =
    filters.categories?.length > 0 ||
    filters.locations?.length > 0 ||
    filters.suppliers?.length > 0 ||
    filters.stockStatuses?.length > 0 ||
    filters.showInactive ||
    filters.minQuantity != null ||
    filters.maxQuantity != null ||
    filters.movementTypes?.length > 0 ||
    filters.movementDateFrom ||
    filters.movementDateTo ||
    filters.users?.length > 0 ||
    filters.products?.length > 0 ||
    filters.poStatuses?.length > 0 ||
    filters.managedBy?.length > 0 ||
    filters.poOrderDateFrom ||
    filters.poOrderDateTo ||
    filters.poExpectedDeliveryFrom ||
    filters.poExpectedDeliveryTo ||
    filters.doStatuses?.length > 0 ||
    filters.customers?.length > 0 ||
    filters.createdBy?.length > 0 ||
    filters.doOrderDateFrom ||
    filters.doOrderDateTo ||
    filters.states?.length > 0;

  // Filter options based on search
  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(sup => {
    const searchLower = supplierSearch.toLowerCase();
    const name = sup.name || sup.company_name || '';
    const fullName = `${sup.first_name || ''} ${sup.last_name || ''}`.trim();
    return name.toLowerCase().includes(searchLower) ||
           fullName.toLowerCase().includes(searchLower);
  });

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

  return (
    <>
      {/* Mobile: Overlay backdrop */}
      <div
        className={`fixed inset-0 bg-black z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Filter Panel - Mobile: Drawer, Desktop: Sidebar */}
      <div
        className={`
          fixed md:relative top-0 right-0 h-screen md:h-full w-[85%] max-w-sm md:max-w-none
          bg-white md:border-r border-gray-200 flex flex-col
          z-50 md:z-auto
          shadow-2xl md:shadow-none
          transition-all duration-300 ease-in-out
          ${isOpen
            ? 'translate-x-0 md:w-64 md:opacity-100'
            : 'translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden'
          }
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
              {/* Close button */}
              <button
                onClick={onClose}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Sections */}
        <div className="flex-1 overflow-y-auto">
          {/* Item Type Filter - Only for products tab */}
          {currentTab === 'products' && (
            <div className="border-b border-gray-200">
              <button
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('itemType')}
              >
                <span className="text-sm font-medium text-gray-900">Item Type</span>
                {expandedSections.itemType ? (
                  <ChevronDown size={16} className="text-gray-500" />
                ) : (
                  <ChevronRight size={16} className="text-gray-500" />
                )}
              </button>
              {expandedSections.itemType && (
                <div className="px-4 pb-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="itemType"
                      checked={filters.itemType === 'selling'}
                      onChange={() => onFiltersChange({ ...filters, itemType: 'selling' })}
                      className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Selling Items</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="itemType"
                      checked={filters.itemType === 'spare'}
                      onChange={() => onFiltersChange({ ...filters, itemType: 'spare' })}
                      className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-2 focus:ring-gray-500"
                    />
                    <span className="text-sm text-gray-700">Non-Selling</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Category Filter - Only for overview and products tabs */}
          {categories.length > 0 && (currentTab === 'overview' || currentTab === 'products') && (
            <div className="border-b border-gray-200">
              <button
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('category')}
              >
                <span className="text-sm font-medium text-gray-900">Category</span>
                {expandedSections.category ? (
                  <ChevronDown size={16} className="text-gray-500" />
                ) : (
                  <ChevronRight size={16} className="text-gray-500" />
                )}
              </button>
              {expandedSections.category && (
                <div className="px-4 pb-3">
                  {/* Search input */}
                  {categories.length > 5 && (
                    <div className="relative mb-2">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 text-xs text-gray-900 placeholder-gray-400 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                  {/* Category list with max height */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredCategories.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">No categories found</p>
                    ) : (
                      filteredCategories.map((category) => (
                        <label key={category} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.categories.includes(category)}
                            onChange={() => handleToggleFilter('categories', category)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{category}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Location Filter - Only for overview, movements, purchase-orders, delivery-orders tabs */}
          {locations.length > 0 && (currentTab === 'overview' || currentTab === 'movements' || currentTab === 'purchase-orders' || currentTab === 'delivery-orders') && (
            <div className="border-b border-gray-200">
              <button
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('location')}
              >
                <span className="text-sm font-medium text-gray-900">Warehouse</span>
                {expandedSections.location ? (
                  <ChevronDown size={16} className="text-gray-500" />
                ) : (
                  <ChevronRight size={16} className="text-gray-500" />
                )}
              </button>
              {expandedSections.location && (
                <div className="px-4 pb-3">
                  {/* Search input */}
                  {locations.length > 5 && (
                    <div className="relative mb-2">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search warehouses..."
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 text-xs text-gray-900 placeholder-gray-400 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                  {/* Location list with max height */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredLocations.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">No warehouses found</p>
                    ) : (
                      filteredLocations.map((location) => (
                        <label key={location.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.locations.includes(location.id)}
                            onChange={() => handleToggleFilter('locations', location.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{location.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Supplier Filter - Only for purchase-orders tab */}
          {suppliers.length > 0 && currentTab === 'purchase-orders' && (
            <div className="border-b border-gray-200">
              <button
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('supplier')}
              >
                <span className="text-sm font-medium text-gray-900">Supplier</span>
                {expandedSections.supplier ? (
                  <ChevronDown size={16} className="text-gray-500" />
                ) : (
                  <ChevronRight size={16} className="text-gray-500" />
                )}
              </button>
              {expandedSections.supplier && (
                <div className="px-4 pb-3">
                  {/* Search input */}
                  {suppliers.length > 5 && (
                    <div className="relative mb-2">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search suppliers..."
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 text-xs text-gray-900 placeholder-gray-400 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                  {/* Supplier list with max height */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredSuppliers.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">No suppliers found</p>
                    ) : (
                      filteredSuppliers.map((supplier) => (
                        <label key={supplier.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.suppliers.includes(supplier.id)}
                            onChange={() => handleToggleFilter('suppliers', supplier.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {supplier.name || supplier.company_name || `${supplier.first_name || ''} ${supplier.last_name || ''}`.trim() || 'Unknown'}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stock Status Filter - Only for overview tab */}
          {currentTab === 'overview' && (
          <div className="border-b border-gray-200">
            <button
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('stockStatus')}
            >
              <span className="text-sm font-medium text-gray-900">Stock Status</span>
              {expandedSections.stockStatus ? (
                <ChevronDown size={16} className="text-gray-500" />
              ) : (
                <ChevronRight size={16} className="text-gray-500" />
              )}
            </button>
            {expandedSections.stockStatus && (
              <div className="px-4 pb-3 space-y-2">
                {STOCK_STATUS_OPTIONS.map((status) => (
                  <label key={status.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.stockStatuses.includes(status.id)}
                      onChange={() => handleToggleFilter('stockStatuses', status.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{status.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Quantity Range Filter - Only for overview tab */}
          {currentTab === 'overview' && (
          <div className="border-b border-gray-200">
            <button
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('quantityRange')}
            >
              <span className="text-sm font-medium text-gray-900">Quantity Range</span>
              {expandedSections.quantityRange ? (
                <ChevronDown size={16} className="text-gray-500" />
              ) : (
                <ChevronRight size={16} className="text-gray-500" />
              )}
            </button>
            {expandedSections.quantityRange && (
              <div className="px-4 pb-3 space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min Quantity:</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={filters.minQuantity ?? ''}
                    onChange={(e) => onFiltersChange({ ...filters, minQuantity: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-2 py-1.5 text-sm text-gray-900 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max Quantity:</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="No limit"
                    value={filters.maxQuantity ?? ''}
                    onChange={(e) => onFiltersChange({ ...filters, maxQuantity: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-2 py-1.5 text-sm text-gray-900 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500 italic">
                  Filter by stock quantity in warehouse
                </p>
              </div>
            )}
          </div>
          )}


          {/* Movement Type Filter - Only for movements tab */}
          {currentTab === 'movements' && (
            <>
              <div className="border-b border-gray-200">
                <button
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection('movementType')}
                >
                  <span className="text-sm font-medium text-gray-900">Movement Type</span>
                  {expandedSections.movementType ? (
                    <ChevronDown size={16} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                </button>
                {expandedSections.movementType && (
                  <div className="px-4 pb-3 space-y-2">
                    {[
                      { id: 'stock_in', label: 'Stock In' },
                      { id: 'stock_out', label: 'Stock Out' },
                    ].map((type) => (
                      <label key={type.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.movementTypes?.includes(type.id)}
                          onChange={() => handleToggleFilter('movementTypes', type.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Movement Date Range Filter */}
              <div className="border-b border-gray-200">
                <button
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection('movementDateRange')}
                >
                  <span className="text-sm font-medium text-gray-900">Date Range</span>
                  {expandedSections.movementDateRange ? (
                    <ChevronDown size={16} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                </button>
                {expandedSections.movementDateRange && (
                  <div className="px-4 pb-3 space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">From:</label>
                      <input
                        type="date"
                        value={filters.movementDateFrom || ''}
                        onChange={(e) => onFiltersChange({ ...filters, movementDateFrom: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm text-gray-900 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">To:</label>
                      <input
                        type="date"
                        value={filters.movementDateTo || ''}
                        onChange={(e) => onFiltersChange({ ...filters, movementDateTo: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm text-gray-900 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Operator (User) Filter */}
              {users.length > 0 && (
                <div className="border-b border-gray-200">
                  <button
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    onClick={() => toggleSection('user')}
                  >
                    <span className="text-sm font-medium text-gray-900">Operator</span>
                    {expandedSections.user ? (
                      <ChevronDown size={16} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-500" />
                    )}
                  </button>
                  {expandedSections.user && (
                    <div className="px-4 pb-3 space-y-2">
                      {userSearch !== null && (
                        <div className="relative">
                          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search operators..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 text-xs text-gray-900 placeholder-gray-400 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {users
                          .filter(user => !userSearch || user.display_name?.toLowerCase().includes(userSearch.toLowerCase()))
                          .map((user) => (
                            <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filters.users?.includes(user.id)}
                                onChange={() => handleToggleFilter('users', user.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{user.display_name || user.email}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Purchase Orders Filters */}
          {currentTab === 'purchase-orders' && (
            <>
              {/* PO Status Filter */}
              <div className="border-b border-gray-200">
                <button
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection('poStatus')}
                >
                  <span className="text-sm font-medium text-gray-900">PO Status</span>
                  {expandedSections.poStatus ? (
                    <ChevronDown size={16} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                </button>
                {expandedSections.poStatus && (
                  <div className="px-4 pb-3 space-y-2">
                    {[
                      { id: 'draft', label: 'Draft' },
                      { id: 'ordered', label: 'Ordered' },
                      { id: 'in_transit', label: 'In Transit' },
                      { id: 'received', label: 'Received' },
                    ].map((status) => (
                      <label key={status.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.poStatuses?.includes(status.id)}
                          onChange={() => handleToggleFilter('poStatuses', status.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{status.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Date Range Filter */}
              <div className="border-b border-gray-200">
                <button
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection('poDateRange')}
                >
                  <span className="text-sm font-medium text-gray-900">Order Date</span>
                  {expandedSections.poDateRange ? (
                    <ChevronDown size={16} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                </button>
                {expandedSections.poDateRange && (
                  <div className="px-4 pb-3 space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">From:</label>
                      <input
                        type="date"
                        value={filters.poOrderDateFrom || ''}
                        onChange={(e) => onFiltersChange({ ...filters, poOrderDateFrom: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm text-gray-900 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">To:</label>
                      <input
                        type="date"
                        value={filters.poOrderDateTo || ''}
                        onChange={(e) => onFiltersChange({ ...filters, poOrderDateTo: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm text-gray-900 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Expected Delivery Date Range Filter */}
              <div className="border-b border-gray-200">
                <button
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection('poExpectedDateRange')}
                >
                  <span className="text-sm font-medium text-gray-900">Expected Delivery</span>
                  {expandedSections.poExpectedDateRange ? (
                    <ChevronDown size={16} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                </button>
                {expandedSections.poExpectedDateRange && (
                  <div className="px-4 pb-3 space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">From:</label>
                      <input
                        type="date"
                        value={filters.poExpectedDeliveryFrom || ''}
                        onChange={(e) => onFiltersChange({ ...filters, poExpectedDeliveryFrom: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm text-gray-900 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">To:</label>
                      <input
                        type="date"
                        value={filters.poExpectedDeliveryTo || ''}
                        onChange={(e) => onFiltersChange({ ...filters, poExpectedDeliveryTo: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm text-gray-900 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Managed By Filter */}
              {users.length > 0 && (
                <div className="border-b border-gray-200">
                  <button
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    onClick={() => toggleSection('managedBy')}
                  >
                    <span className="text-sm font-medium text-gray-900">Managed By</span>
                    {expandedSections.managedBy ? (
                      <ChevronDown size={16} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-500" />
                    )}
                  </button>
                  {expandedSections.managedBy && (
                    <div className="px-4 pb-3 space-y-2">
                      {userSearch !== null && (
                        <div className="relative">
                          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 text-xs text-gray-900 placeholder-gray-400 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {users
                          .filter(user => !userSearch || user.display_name?.toLowerCase().includes(userSearch.toLowerCase()))
                          .map((user) => (
                            <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filters.managedBy?.includes(user.id)}
                                onChange={() => handleToggleFilter('managedBy', user.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{user.display_name || user.email}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Delivery Orders Filters */}
          {currentTab === 'delivery-orders' && (
            <>
              {/* DO Status Filter */}
              <div className="border-b border-gray-200">
                <button
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection('doStatus')}
                >
                  <span className="text-sm font-medium text-gray-900">DO Status</span>
                  {expandedSections.doStatus ? (
                    <ChevronDown size={16} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                </button>
                {expandedSections.doStatus && (
                  <div className="px-4 pb-3 space-y-2">
                    {[
                      { id: 'draft', label: 'Draft' },
                      { id: 'confirmed', label: 'Confirmed' },
                      { id: 'dispatched', label: 'Dispatched' },
                      { id: 'delivered', label: 'Delivered' },
                    ].map((status) => (
                      <label key={status.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doStatuses?.includes(status.id)}
                          onChange={() => handleToggleFilter('doStatuses', status.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{status.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Date Range Filter */}
              <div className="border-b border-gray-200">
                <button
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection('doDateRange')}
                >
                  <span className="text-sm font-medium text-gray-900">Order Date</span>
                  {expandedSections.doDateRange ? (
                    <ChevronDown size={16} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                </button>
                {expandedSections.doDateRange && (
                  <div className="px-4 pb-3 space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">From:</label>
                      <input
                        type="date"
                        value={filters.doOrderDateFrom || ''}
                        onChange={(e) => onFiltersChange({ ...filters, doOrderDateFrom: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm text-gray-900 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">To:</label>
                      <input
                        type="date"
                        value={filters.doOrderDateTo || ''}
                        onChange={(e) => onFiltersChange({ ...filters, doOrderDateTo: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm text-gray-900 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
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
                    <div className="px-4 pb-3 space-y-2">
                      {customerSearch !== null && (
                        <div className="relative">
                          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search customers..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 text-xs text-gray-900 placeholder-gray-400 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {customers
                          .filter(customer => !customerSearch ||
                            `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            customer.company_name?.toLowerCase().includes(customerSearch.toLowerCase())
                          )
                          .map((customer) => (
                            <label key={customer.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filters.customers?.includes(customer.id)}
                                onChange={() => handleToggleFilter('customers', customer.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                {`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.company_name || 'Unknown'}
                              </span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Created By Filter */}
              {users.length > 0 && (
                <div className="border-b border-gray-200">
                  <button
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    onClick={() => toggleSection('createdBy')}
                  >
                    <span className="text-sm font-medium text-gray-900">Created By</span>
                    {expandedSections.createdBy ? (
                      <ChevronDown size={16} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-500" />
                    )}
                  </button>
                  {expandedSections.createdBy && (
                    <div className="px-4 pb-3 space-y-2">
                      {userSearch !== null && (
                        <div className="relative">
                          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 text-xs text-gray-900 placeholder-gray-400 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {users
                          .filter(user => !userSearch || user.display_name?.toLowerCase().includes(userSearch.toLowerCase()))
                          .map((user) => (
                            <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filters.createdBy?.includes(user.id)}
                                onChange={() => handleToggleFilter('createdBy', user.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{user.display_name || user.email}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* State Filter - Only for suppliers tab */}
          {currentTab === 'suppliers' && states.length > 0 && (
            <div className="border-b border-gray-200">
              <button
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('state')}
              >
                <span className="text-sm font-medium text-gray-900">State</span>
                {expandedSections.state ? (
                  <ChevronDown size={16} className="text-gray-500" />
                ) : (
                  <ChevronRight size={16} className="text-gray-500" />
                )}
              </button>
              {expandedSections.state && (
                <div className="px-4 pb-3 space-y-2">
                  {states.map((state) => (
                    <label key={state} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.states?.includes(state)}
                        onChange={() => handleToggleFilter('states', state)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{state}</span>
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
