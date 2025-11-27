import React from 'react';
import { Activity, Search, Filter } from 'lucide-react';
import { getMovementTypeColor, getMovementTypeLabel } from '../../utils/helpers';
import { filterMovements, sortMovements } from '../../utils/filtering';
import { Pagination } from '../../../../components/ui/pagination';

/**
 * Movements Tab - Stock Movement History
 * Displays:
 * - Stock In/Out movements with date, type, product, warehouse, quantity
 * - Search and filter functionality
 * - Desktop table and mobile card views
 */
export default function MovementsTab({
  movements,
  filters,
  movementSearchTerm,
  setMovementSearchTerm,
  showFilters,
  setShowFilters,
  movementPage,
  setMovementPage,
  ITEMS_PER_PAGE,
  movementSortBy,
  toggleMovementSort,
  MovementSortIcon
}) {
  // Filter and sort movements
  const filtered = filterMovements(movements, {
    filters,
    searchTerm: movementSearchTerm
  });
  const filteredMovements = sortMovements(filtered, movementSortBy);
  const paginatedMovements = filteredMovements.slice((movementPage - 1) * ITEMS_PER_PAGE, movementPage * ITEMS_PER_PAGE);

  return (
    <div>
      <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200/70 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">Stock Movements</h2>
        </div>

        {/* Search and Filter Bar */}
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by product, warehouse, or notes..."
                value={movementSearchTerm}
                onChange={(e) => setMovementSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all text-sm"
              />
            </div>
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(prev => ({ ...prev, movements: !prev.movements }))}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all flex-1 sm:flex-initial ${
                showFilters.movements
                  ? 'bg-gray-900 border-gray-900 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
              title="Toggle filters"
            >
              <Filter size={14} />
              <span className="hidden sm:inline">Filter</span>
              {(filters.locations.length > 0 || filters.movementTypes?.length > 0 || filters.users?.length > 0 || filters.products?.length > 0 || filters.movementDateFrom || filters.movementDateTo) && (
                <span className={`px-1.5 py-0.5 text-xs rounded-md font-semibold ${
                  showFilters.movements ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
                }`}>
                  {filters.locations.length + (filters.movementTypes?.length || 0) + (filters.users?.length || 0) + (filters.products?.length || 0) + (filters.movementDateFrom || filters.movementDateTo ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/70">
            <thead className="bg-gradient-to-b from-gray-50 to-gray-100/50">
              <tr>
                <th onClick={() => toggleMovementSort('date')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                  <span className="flex items-center space-x-1"><span>Date</span><MovementSortIcon field="date" /></span>
                </th>
                <th onClick={() => toggleMovementSort('type')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                  <span className="flex items-center space-x-1"><span>Type</span><MovementSortIcon field="type" /></span>
                </th>
                <th onClick={() => toggleMovementSort('product')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                  <span className="flex items-center space-x-1"><span>Item</span><MovementSortIcon field="product" /></span>
                </th>
                <th onClick={() => toggleMovementSort('warehouse')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                  <span className="flex items-center space-x-1"><span>Warehouse</span><MovementSortIcon field="warehouse" /></span>
                </th>
                <th onClick={() => toggleMovementSort('quantity')} className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                  <span className="flex items-center justify-end space-x-1"><span>Quantity</span><MovementSortIcon field="quantity" /></span>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Unit
                </th>
                <th onClick={() => toggleMovementSort('operator')} className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none">
                  <span className="flex items-center space-x-1"><span>Operator</span><MovementSortIcon field="operator" /></span>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-4 bg-gray-100 rounded-full">
                        <Activity className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">
                        {movementSearchTerm ? 'No movements match your search' : 'No movement records'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedMovements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(movement.occurred_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-bold ${getMovementTypeColor(movement.movement_type)}`}>
                          {getMovementTypeLabel(movement.movement_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {movement.product?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {movement.location?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                        {movement.movement_type === 'stock_out' ? '-' : '+'}{movement.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {movement.product?.base_unit || movement.product?.unit || 'pcs'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {movement.created_by?.display_name || movement.created_by_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {movement.notes || '-'}
                      </td>
                    </tr>
                  ))}
                  <tr><td colSpan="8" className="p-0"><Pagination currentPage={movementPage} totalItems={filteredMovements.length} onPageChange={setMovementPage} itemsPerPage={ITEMS_PER_PAGE} /></td></tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-4">
          {filteredMovements.length === 0 ? (
            <div className="flex flex-col items-center space-y-3 py-12">
              <div className="p-4 bg-gray-100 rounded-full">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">
                {movementSearchTerm ? 'No movements match your search' : 'No movement records'}
              </p>
            </div>
          ) : (
            <>
              {paginatedMovements.map((movement) => (
                <div key={movement.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{movement.product?.name}</p>
                      <p className="text-xs text-gray-500">{new Date(movement.occurred_at).toLocaleDateString('zh-CN')}</p>
                    </div>
                    <span className={`font-bold text-lg ${getMovementTypeColor(movement.movement_type)}`}>
                      {movement.movement_type === 'stock_out' ? '-' : '+'}{movement.quantity}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${movement.movement_type === 'stock_in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {getMovementTypeLabel(movement.movement_type)}
                    </span>
                    <span className="text-gray-500">{movement.location?.name || '-'}</span>
                    {movement.notes && <span className="text-gray-400 truncate max-w-[150px]">{movement.notes}</span>}
                  </div>
                </div>
              ))}
              <Pagination currentPage={movementPage} totalItems={filteredMovements.length} onPageChange={setMovementPage} itemsPerPage={ITEMS_PER_PAGE} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
