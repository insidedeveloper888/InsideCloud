import React from 'react';
import { Package, Plus, Minus, Search, Filter } from 'lucide-react';
import { getStatusColor, getStatusLabel } from '../../utils/helpers';
import Pagination from '../Pagination';

/**
 * Overview Tab - Stock Items Overview
 * Displays:
 * - Summary stats cards (Total Products, Stock Items, Low Stock, Out of Stock)
 * - Inventory table with search and filters
 * - Stock In/Out actions
 */
export default function OverviewTab({
  products,
  items,
  filteredItems,
  searchTerm,
  setSearchTerm,
  showFilters,
  setShowFilters,
  filters,
  showUnstocked,
  setShowUnstocked,
  stockPage,
  setStockPage,
  ITEMS_PER_PAGE,
  setSelectedStockItem,
  setStockInData,
  setShowStockInModal,
  setStockOutData,
  setShowStockOutModal,
  handleItemClick,
  toggleSort,
  SortIcon
}) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="group relative bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-bl-3xl opacity-50"></div>
          <div className="relative">
            <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Total Products</div>
            <div className="text-4xl font-bold text-gray-900 mb-1">{products.length}</div>
            <div className="text-xs text-emerald-600 font-medium">In catalog</div>
          </div>
        </div>
        <div className="group relative bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-bl-3xl opacity-50"></div>
          <div className="relative">
            <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Stock Items</div>
            <div className="text-4xl font-bold text-gray-900 mb-1">{items.length}</div>
            <div className="text-xs text-cyan-600 font-medium">In inventory</div>
          </div>
        </div>
        <div className="group relative bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-bl-3xl opacity-50"></div>
          <div className="relative">
            <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Low Stock Alert</div>
            <div className="text-4xl font-bold text-amber-600 mb-1">
              {filteredItems.filter(i => i.stock_status === 'low_stock' && i.id).length}
            </div>
            <div className="text-xs text-amber-600 font-medium">Need restock</div>
          </div>
        </div>
        <div className="group relative bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-bl-3xl opacity-50"></div>
          <div className="relative">
            <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Out of Stock</div>
            <div className="text-4xl font-bold text-red-600 mb-1">
              {filteredItems.filter(i => i.stock_status === 'out_of_stock' && i.id).length}
            </div>
            <div className="text-xs text-red-600 font-medium">Zero quantity</div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200/70 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Stock Items</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSelectedStockItem(null);
                  setStockInData({ quantity: 1, unit_cost: 0, reference_type: '', location_id: '', notes: '', product_id: '' });
                  setShowStockInModal(true);
                }}
                className="px-3 md:px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-semibold rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center space-x-1 md:space-x-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Stock In</span>
              </button>
              <button
                onClick={() => {
                  setSelectedStockItem(null);
                  setStockOutData({ quantity: 1, notes: '', product_id: '', location_id: '' });
                  setShowStockOutModal(true);
                }}
                className="px-3 md:px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-semibold rounded-xl hover:from-red-600 hover:to-orange-600 transition-all flex items-center space-x-1 md:space-x-2 shadow-sm"
              >
                <Minus className="w-4 h-4" />
                <span>Stock Out</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by product name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900 text-sm"
                />
              </div>
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(prev => ({ ...prev, overview: !prev.overview }))}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all flex-1 sm:flex-initial ${
                  showFilters.overview
                    ? 'bg-gray-900 border-gray-900 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
                title="Toggle filters"
              >
                <Filter size={14} />
                <span className="hidden sm:inline">Filter</span>
                {(filters.categories.length > 0 || filters.locations.length > 0 || filters.stockStatuses.length > 0 || filters.minQuantity !== null || filters.maxQuantity !== null) && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-md font-semibold ${
                    showFilters.overview ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
                  }`}>
                    {filters.categories.length + filters.locations.length + filters.stockStatuses.length + (filters.minQuantity !== null || filters.maxQuantity !== null ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
            {/* Show Unstocked Toggle */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUnstocked}
                  onChange={(e) => setShowUnstocked(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-600">Show unstocked products</span>
              </label>
              <span className="text-sm text-gray-500">{filteredItems.length} items</span>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-4">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center space-y-3 py-12">
              <div className="p-4 bg-gray-100 rounded-full">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">
                {searchTerm || filters.categories.length > 0 || filters.locations.length > 0 || filters.suppliers.length > 0 || filters.stockStatuses.length > 0 ? 'No matching inventory found' : 'No inventory data'}
              </p>
            </div>
          ) : (
            filteredItems.slice((stockPage - 1) * ITEMS_PER_PAGE, stockPage * ITEMS_PER_PAGE).map((item) => (
              <div
                key={item.id}
                onClick={() => !item.isVirtual && handleItemClick(item)}
                className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm ${!item.isVirtual ? 'cursor-pointer active:bg-gray-50' : ''}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{item.product?.name}</p>
                    <p className="text-sm text-gray-500">{item.product?.sku}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full border ${getStatusColor(item.stock_status)}`}>
                    {getStatusLabel(item.stock_status)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-1 text-gray-900">{item.product?.category || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Warehouse:</span>
                    <span className="ml-1 text-gray-900">{item.location?.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Qty:</span>
                    <span className="ml-1 font-semibold text-gray-900">{item.quantity} {item.product?.base_unit || item.product?.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Avail:</span>
                    <span className={`ml-1 font-semibold ${item.isVirtual ? 'text-purple-600' : 'text-emerald-600'}`}>{item.available_quantity}</span>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStockItem(item);
                      setStockInData({ quantity: 1, unit_cost: 0, reference_type: '', location_id: '', notes: '' });
                      setShowStockInModal(true);
                    }}
                    className="px-3 py-1.5 text-sm text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" /> In
                  </button>
                  {!item.isVirtual && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStockItem(item);
                        setStockOutData({ quantity: 1, notes: '' });
                        setShowStockOutModal(true);
                      }}
                      className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center"
                    >
                      <Minus className="w-4 h-4 mr-1" /> Out
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          <Pagination currentPage={stockPage} totalItems={filteredItems.length} onPageChange={setStockPage} itemsPerPage={ITEMS_PER_PAGE} />
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/70">
            <thead className="bg-gradient-to-b from-gray-50 to-gray-100/50">
              <tr>
                <th onClick={() => toggleSort('sku')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                  <span className="flex items-center space-x-1"><span>SKU</span><SortIcon field="sku" /></span>
                </th>
                <th onClick={() => toggleSort('name')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                  <span className="flex items-center space-x-1"><span>Product Name</span><SortIcon field="name" /></span>
                </th>
                <th onClick={() => toggleSort('category')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                  <span className="flex items-center space-x-1"><span>Category</span><SortIcon field="category" /></span>
                </th>
                <th onClick={() => toggleSort('warehouse')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                  <span className="flex items-center space-x-1"><span>Warehouse</span><SortIcon field="warehouse" /></span>
                </th>
                <th onClick={() => toggleSort('quantity')} className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                  <span className="flex items-center justify-end space-x-1"><span>Quantity</span><SortIcon field="quantity" /></span>
                </th>
                <th onClick={() => toggleSort('available')} className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                  <span className="flex items-center justify-end space-x-1"><span>Available</span><SortIcon field="available" /></span>
                </th>
                <th onClick={() => toggleSort('status')} className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                  <span className="flex items-center justify-center space-x-1"><span>Status</span><SortIcon field="status" /></span>
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-4 bg-gray-100 rounded-full">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">
                        {searchTerm || filters.categories.length > 0 || filters.locations.length > 0 || filters.suppliers.length > 0 || filters.stockStatuses.length > 0 ? 'No matching inventory found' : 'No inventory data'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.slice((stockPage - 1) * ITEMS_PER_PAGE, stockPage * ITEMS_PER_PAGE).map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => !item.isVirtual && handleItemClick(item)}
                    className={`hover:bg-gradient-to-r transition-colors duration-150 group ${
                      item.isVirtual
                        ? 'hover:from-purple-50/40 hover:to-indigo-50/40 cursor-default'
                        : 'hover:from-red-50/40 hover:to-orange-50/40 cursor-pointer'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {item.product?.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.product?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.product?.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.location?.name || (item.isVirtual ? <span className="text-purple-500 italic">Select location</span> : '-')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      {item.quantity} <span className="text-gray-400 font-normal">{item.product?.base_unit || item.product?.unit}</span>
                      {item.product?.unit !== item.product?.base_unit && item.product?.unit_conversion_factor > 1 && (
                        <span className="text-gray-400 font-normal text-xs ml-1">({(item.quantity / item.product.unit_conversion_factor).toFixed(1)} {item.product.unit})</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right flex items-center justify-end space-x-2">
                      <span className={item.isVirtual ? 'text-purple-600' : 'text-emerald-600'}>{item.available_quantity}</span>
                      <span className="text-gray-400 font-normal">{item.product?.base_unit || item.product?.unit}</span>
                      {item.product?.unit !== item.product?.base_unit && item.product?.unit_conversion_factor > 1 && (
                        <span className="text-gray-400 font-normal text-xs">({(item.available_quantity / item.product.unit_conversion_factor).toFixed(1)} {item.product.unit})</span>
                      )}
                      {!item.isVirtual && <Minus className="w-4 h-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full border shadow-sm ${getStatusColor(
                          item.stock_status
                        )}`}
                      >
                        {getStatusLabel(item.stock_status)}
                      </span>
                    </td>
                    {/* Actions Column - Stock In/Out buttons */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Stock In Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStockItem(item);
                            setStockInData({ quantity: 1, unit_cost: 0, reference_type: '', location_id: '', notes: '' });
                            setShowStockInModal(true);
                          }}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Stock In"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {/* Stock Out Button - Only show if there's actual stock */}
                        {!item.isVirtual && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStockItem(item);
                              setStockOutData({ quantity: 1, notes: '' });
                              setShowStockOutModal(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Stock Out"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination currentPage={stockPage} totalItems={filteredItems.length} onPageChange={setStockPage} itemsPerPage={ITEMS_PER_PAGE} />
        </div>
      </div>
    </div>
  );
}
