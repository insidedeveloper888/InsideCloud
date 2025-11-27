import React, { useState } from 'react';
import { Package, Plus, Minus, Search, Filter, X, TrendingUp } from 'lucide-react';
import { getStatusColor, getStatusLabel } from '../../utils/helpers';
import { Pagination } from '../../../../components/ui/pagination';

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
  SortIcon,
  allProductUnits
}) {
  const [showValueBreakdown, setShowValueBreakdown] = useState(false);
  // Calculate total stock value based on weighted average cost
  const calculateStockValue = () => {
    let totalValue = 0;

    items.forEach(item => {
      if (!item.quantity || item.quantity <= 0) return;

      // Use average_cost (weighted average) which is updated with each stock in transaction
      const pricePerUnit = item.average_cost || 0;
      totalValue += item.quantity * pricePerUnit;
    });

    return totalValue.toFixed(2);
  };

  const stockValue = calculateStockValue();

  return (
    <div className="space-y-6">
      {/* Stock Value Card - Full Width - Clickable */}
      <button
        onClick={() => setShowValueBreakdown(true)}
        className="w-full bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 cursor-pointer text-left"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Stock Value</span>
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
        <div className="text-4xl font-bold text-gray-900 mb-2">RM {stockValue}</div>
        <div className="text-sm text-gray-500">Based on buying prices (cost basis) • Click to view breakdown</div>
      </button>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
          <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Total Products</div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{products.filter(p => !p.is_deleted).length}</div>
          <div className="text-xs text-gray-500">In catalog</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
          <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Stock Items</div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{items.filter(i => i.quantity > 0).length}</div>
          <div className="text-xs text-gray-500">In inventory</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
          <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Low Stock Alert</div>
          <div className="text-3xl font-bold text-amber-600 mb-1">
            {filteredItems.filter(i => i.stock_status === 'low_stock' && i.id).length}
          </div>
          <div className="text-xs text-amber-600">Need restock</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
          <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Out of Stock</div>
          <div className="text-3xl font-bold text-red-600 mb-1">
            {filteredItems.filter(i => i.stock_status === 'out_of_stock' && i.id).length}
          </div>
          <div className="text-xs text-red-600">Zero quantity</div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Stock Items</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSelectedStockItem(null);
                  setStockInData({ quantity: 1, unit_cost: 0, reference_type: '', location_id: '', notes: '', product_id: '' });
                  setShowStockInModal(true);
                }}
                className="px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-1 md:space-x-2"
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
                className="px-3 md:px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg transition-colors flex items-center space-x-1 md:space-x-2"
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 text-sm"
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
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
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
                    <span className="text-gray-500">SKU:</span>
                    <span className="ml-1 text-gray-900 font-semibold">{item.product?.sku}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-1 text-xs font-bold ${getStatusColor(item.stock_status).includes('green') ? 'text-green-600' : getStatusColor(item.stock_status).includes('yellow') ? 'text-yellow-600' : 'text-red-600'}`}>
                      {getStatusLabel(item.stock_status)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-1 text-gray-900">{item.product?.category || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Warehouse:</span>
                    <span className="ml-1 text-gray-900">{item.location?.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <span className="ml-1 font-semibold text-gray-900">{item.quantity} {item.product?.base_unit || item.product?.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Available:</span>
                    <span className={`ml-1 font-semibold ${item.isVirtual ? 'text-purple-600' : 'text-blue-600'}`}>{item.available_quantity} {item.product?.base_unit || item.product?.unit}</span>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setSelectedStockItem(item);
                      setStockInData({ quantity: 1, unit_cost: 0, reference_type: '', location_id: '', notes: '' });
                      setShowStockInModal(true);
                    }}
                    className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" /> In
                  </button>
                  {!item.isVirtual && (
                    <button
                      onClick={() => {
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
                  <td colSpan="9" className="px-6 py-16 text-center">
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
                    className={`hover:bg-gradient-to-r transition-colors duration-150 group ${
                      item.isVirtual
                        ? 'hover:from-purple-50/40 hover:to-indigo-50/40'
                        : 'hover:from-gray-50/40 hover:to-gray-50/40'
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span className={item.isVirtual ? 'text-purple-600' : 'text-blue-600'}>{item.available_quantity}</span>
                        <span className="text-gray-400 font-normal">{item.product?.base_unit || item.product?.unit}</span>
                        {item.product?.unit !== item.product?.base_unit && item.product?.unit_conversion_factor > 1 && (
                          <span className="text-gray-400 font-normal text-xs">({(item.available_quantity / item.product.unit_conversion_factor).toFixed(1)} {item.product.unit})</span>
                        )}
                      </div>
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
                          onClick={() => {
                            setSelectedStockItem(item);
                            setStockInData({ quantity: 1, unit_cost: 0, reference_type: '', location_id: '', notes: '' });
                            setShowStockInModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Stock In"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {/* Stock Out Button - Only show if there's actual stock */}
                        {!item.isVirtual && (
                          <button
                            onClick={() => {
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

      {/* Stock Value Breakdown Modal */}
      {showValueBreakdown && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowValueBreakdown(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Stock Value Breakdown</h2>
                <p className="text-sm text-purple-100 mt-1">Detailed calculation of total stock value</p>
              </div>
              <button
                onClick={() => setShowValueBreakdown(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-140px)]">
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200">Location</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200">Quantity</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200">Average Unit Price</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200">Total Value</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {items
                    .filter(item => item.quantity > 0)
                    .map((item) => {
                      // Use average_cost (weighted average) from stock item, which is updated with each transaction
                      const pricePerUnit = item.average_cost || 0;
                      const totalValue = item.quantity * pricePerUnit;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm">
                            <div className="font-medium text-gray-900">{item.product?.name}</div>
                            <div className="text-xs text-gray-500">{item.product?.sku}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {item.location?.name || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                            {item.quantity} <span className="text-gray-400 font-normal">{item.product?.base_unit || item.product?.unit}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-gray-600">
                            RM {pricePerUnit.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                            RM {totalValue.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  {items.filter(item => item.quantity > 0).length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        No stock items with value
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer - Total */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-t-2 border-purple-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total items with stock</p>
                  <p className="text-xs text-gray-500">{items.filter(item => item.quantity > 0).length} items</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 font-medium">Total Stock Value</p>
                  <p className="text-3xl font-bold text-purple-600">RM {stockValue}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
