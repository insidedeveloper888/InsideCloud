import React from 'react';
import { FileText, Search, Filter } from 'lucide-react';

/**
 * Delivery Orders Tab - Delivery Order Management
 * Displays:
 * - List of delivery orders with search and filters
 * - DO details (number, customer, date, status, items, warehouse)
 * - Desktop table and mobile card views
 * - Click to view DO details
 */
export default function DeliveryOrdersTab({
  deliveryOrders,
  doSearchTerm,
  setDoSearchTerm,
  showFilters,
  setShowFilters,
  filters,
  doSortBy,
  setDoSortBy,
  setSelectedDO,
  setShowDODetailModal
}) {
  return (
    <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm">
      <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200/70 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Delivery Orders</h2>
      </div>
      {/* Search and Filter Bar */}
      <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by DO number, customer..."
              value={doSearchTerm}
              onChange={(e) => setDoSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all text-sm"
            />
          </div>
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(prev => ({ ...prev, 'delivery-orders': !prev['delivery-orders'] }))}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all flex-1 sm:flex-initial ${
              showFilters['delivery-orders']
                ? 'bg-gray-900 border-gray-900 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
            }`}
            title="Toggle filters"
          >
            <Filter size={14} />
            <span className="hidden sm:inline">Filter</span>
            {(filters.customers?.length > 0 || filters.locations.length > 0 || filters.doStatuses?.length > 0 || filters.createdBy?.length > 0 || filters.doOrderDateFrom || filters.doOrderDateTo) && (
              <span className={`px-1.5 py-0.5 text-xs rounded-md font-semibold ${
                showFilters['delivery-orders'] ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
              }`}>
                {(filters.customers?.length || 0) + filters.locations.length + (filters.doStatuses?.length || 0) + (filters.createdBy?.length || 0) + (filters.doOrderDateFrom || filters.doOrderDateTo ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>
      {/* Mobile Card View for DOs */}
      <div className="md:hidden space-y-3 p-4">
        {(() => {
          let filteredDOs = deliveryOrders.filter(d => {
            // Location filter
            if (filters.locations?.length > 0 && !filters.locations.includes(d.location_id)) {
              return false;
            }

            // DO Status filter
            if (filters.doStatuses?.length > 0 && !filters.doStatuses.includes(d.status)) {
              return false;
            }

            // Customer filter
            if (filters.customers?.length > 0 && !filters.customers.includes(d.customer?.id)) {
              return false;
            }

            // Created By filter
            if (filters.createdBy?.length > 0 && !filters.createdBy.includes(d.created_by?.id)) {
              return false;
            }

            // Order Date Range filter
            if (filters.doOrderDateFrom) {
              const orderDate = d.order_date || '';
              if (orderDate < filters.doOrderDateFrom) return false;
            }
            if (filters.doOrderDateTo) {
              const orderDate = d.order_date || '';
              if (orderDate > filters.doOrderDateTo) return false;
            }

            // Text search filter
            if (doSearchTerm) {
              const search = doSearchTerm.toLowerCase();
              if (!d.do_number?.toLowerCase().includes(search) &&
                  !d.customer_name?.toLowerCase().includes(search) &&
                  !d.customer?.first_name?.toLowerCase().includes(search)) return false;
            }

            return true;
          });

          if (filteredDOs.length === 0) {
            return (
              <div className="flex flex-col items-center space-y-3 py-12">
                <FileText className="w-12 h-12 text-gray-300" />
                <p className="text-gray-500">No delivery orders yet</p>
              </div>
            );
          }

          return filteredDOs.map(d => (
            <div key={d.id} onClick={() => { setSelectedDO(d); setShowDODetailModal(true); }} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer active:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-gray-900">{d.do_number}</p>
                  <p className="text-sm text-gray-600">{d.customer_name || `${d.customer?.first_name || ''} ${d.customer?.last_name || ''}`.trim() || '-'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  d.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                  d.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                  d.status === 'dispatched' ? 'bg-yellow-100 text-yellow-700' :
                  d.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {d.status?.charAt(0).toUpperCase() + d.status?.slice(1)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Date:</span> <span className="text-gray-900">{d.order_date ? new Date(d.order_date).toLocaleDateString() : '-'}</span></div>
                <div><span className="text-gray-500">Items:</span> <span className="font-semibold text-emerald-600">{d.items?.length || 0}</span></div>
                <div><span className="text-gray-500">Warehouse:</span> <span className="text-gray-900">{d.location?.name || '-'}</span></div>
              </div>
            </div>
          ));
        })()}
      </div>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
              {[
                { field: 'do_number', label: 'DO Number' },
                { field: 'customer', label: 'Customer' },
                { field: 'order_date', label: 'Order Date' },
                { field: 'warehouse', label: 'Warehouse' },
                { field: 'status', label: 'Status' },
                { field: 'items', label: 'Items' },
                { field: 'created_by', label: 'Created By' }
              ].map(col => (
                <th
                  key={col.field}
                  onClick={() => setDoSortBy(prev => ({ field: col.field, direction: prev.field === col.field && prev.direction === 'asc' ? 'desc' : 'asc' }))}
                  className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                >
                  <span className="inline-flex items-center space-x-1">
                    <span>{col.label}</span>
                    {doSortBy.field === col.field && <span>{doSortBy.direction === 'asc' ? '↑' : '↓'}</span>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(() => {
              let filteredDOs = deliveryOrders.filter(d => {
                // Location filter
                if (filters.locations?.length > 0 && !filters.locations.includes(d.location_id)) {
                  return false;
                }

                // DO Status filter
                if (filters.doStatuses?.length > 0 && !filters.doStatuses.includes(d.status)) {
                  return false;
                }

                // Customer filter
                if (filters.customers?.length > 0 && !filters.customers.includes(d.customer?.id)) {
                  return false;
                }

                // Created By filter
                if (filters.createdBy?.length > 0 && !filters.createdBy.includes(d.created_by?.id)) {
                  return false;
                }

                // Order Date Range filter
                if (filters.doOrderDateFrom) {
                  const orderDate = d.order_date || '';
                  if (orderDate < filters.doOrderDateFrom) return false;
                }
                if (filters.doOrderDateTo) {
                  const orderDate = d.order_date || '';
                  if (orderDate > filters.doOrderDateTo) return false;
                }

                // Text search filter
                if (doSearchTerm) {
                  const search = doSearchTerm.toLowerCase();
                  if (!d.do_number?.toLowerCase().includes(search) &&
                      !d.customer_name?.toLowerCase().includes(search) &&
                      !d.customer?.first_name?.toLowerCase().includes(search) &&
                      !d.customer?.company_name?.toLowerCase().includes(search)) return false;
                }

                return true;
              });

              if (doSortBy.field) {
                filteredDOs = [...filteredDOs].sort((a, b) => {
                  let valA, valB;
                  switch (doSortBy.field) {
                    case 'do_number': valA = a.do_number || ''; valB = b.do_number || ''; break;
                    case 'customer': valA = a.customer_name || a.customer?.first_name || ''; valB = b.customer_name || b.customer?.first_name || ''; break;
                    case 'order_date': valA = a.order_date || ''; valB = b.order_date || ''; break;
                    case 'warehouse': valA = a.location?.name || ''; valB = b.location?.name || ''; break;
                    case 'status': valA = a.status || ''; valB = b.status || ''; break;
                    case 'items': valA = a.items?.length || 0; valB = b.items?.length || 0; break;
                    case 'created_by': valA = a.created_by?.display_name || ''; valB = b.created_by?.display_name || ''; break;
                    default: return 0;
                  }
                  if (typeof valA === 'number') return doSortBy.direction === 'asc' ? valA - valB : valB - valA;
                  return doSortBy.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                });
              }

              if (filteredDOs.length === 0) {
                return (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <FileText className="w-12 h-12 text-gray-300" />
                        <p className="text-gray-500">No delivery orders yet</p>
                      </div>
                    </td>
                  </tr>
                );
              }

              return filteredDOs.map(d => (
                <tr
                  key={d.id}
                  onClick={() => { setSelectedDO(d); setShowDODetailModal(true); }}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{d.do_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{d.customer_name || `${d.customer?.first_name || ''} ${d.customer?.last_name || ''}`.trim() || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{d.order_date ? new Date(d.order_date).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{d.location?.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      d.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                      d.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      d.status === 'dispatched' ? 'bg-yellow-100 text-yellow-700' :
                      d.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {d.status?.charAt(0).toUpperCase() + d.status?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm">{d.items?.length || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{d.created_by?.display_name || '-'}</td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
