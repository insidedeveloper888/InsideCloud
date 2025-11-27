import React from 'react';
import { FileText, Search, Filter, Warehouse } from 'lucide-react';

/**
 * Purchase Orders Tab - Purchase Order Management
 * Displays:
 * - List of purchase orders with search and filters
 * - PO details (number, supplier, dates, status, amount, items)
 * - Desktop table and mobile card views
 * - Click to view PO details
 */
export default function PurchaseOrdersTab({
  purchaseOrders,
  poSearchTerm,
  setPoSearchTerm,
  showFilters,
  setShowFilters,
  filters,
  poSortBy,
  setPoSortBy,
  locations,
  getPOStatusIcon,
  getPOStatusColor,
  getPOStatusLabel,
  handleOpenPODetail,
  setShowAddPOModal
}) {
  return (
    <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
      {/* Title */}
      <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200/70 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Purchase Orders</h2>
      </div>
      {/* Search and Filter Bar */}
      <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by PO number, supplier, or product..."
              value={poSearchTerm}
              onChange={(e) => setPoSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all text-sm"
            />
          </div>
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(prev => ({ ...prev, 'purchase-orders': !prev['purchase-orders'] }))}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all flex-1 sm:flex-initial ${
              showFilters['purchase-orders']
                ? 'bg-gray-900 border-gray-900 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
            }`}
            title="Toggle filters"
          >
            <Filter size={14} />
            <span className="hidden sm:inline">Filter</span>
            {(filters.suppliers.length > 0 || filters.locations.length > 0 || filters.poStatuses?.length > 0 || filters.managedBy?.length > 0 || filters.poOrderDateFrom || filters.poOrderDateTo || filters.poExpectedDeliveryFrom || filters.poExpectedDeliveryTo) && (
              <span className={`px-1.5 py-0.5 text-xs rounded-md font-semibold ${
                showFilters['purchase-orders'] ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
              }`}>
                {filters.suppliers.length + filters.locations.length + (filters.poStatuses?.length || 0) + (filters.managedBy?.length || 0) + (filters.poOrderDateFrom || filters.poOrderDateTo ? 1 : 0) + (filters.poExpectedDeliveryFrom || filters.poExpectedDeliveryTo ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>
      {/* Mobile Card View for POs */}
      <div className="md:hidden space-y-3 p-4">
        {(() => {
          let filteredPOs = purchaseOrders.filter(po => {
            // Supplier filter
            if (filters.suppliers?.length > 0 && !filters.suppliers.includes(po.supplier_id)) {
              return false;
            }

            // Location filter
            if (filters.locations?.length > 0 && !filters.locations.includes(po.location_id)) {
              return false;
            }

            // PO Status filter
            if (filters.poStatuses?.length > 0 && !filters.poStatuses.includes(po.status)) {
              return false;
            }

            // Managed By filter
            if (filters.managedBy?.length > 0 && !filters.managedBy.includes(po.created_by?.id)) {
              return false;
            }

            // Order Date Range filter
            if (filters.poOrderDateFrom) {
              const orderDate = po.order_date || '';
              if (orderDate < filters.poOrderDateFrom) return false;
            }
            if (filters.poOrderDateTo) {
              const orderDate = po.order_date || '';
              if (orderDate > filters.poOrderDateTo) return false;
            }

            // Expected Delivery Date Range filter
            if (filters.poExpectedDeliveryFrom) {
              const deliveryDate = po.expected_delivery_date || '';
              if (deliveryDate < filters.poExpectedDeliveryFrom) return false;
            }
            if (filters.poExpectedDeliveryTo) {
              const deliveryDate = po.expected_delivery_date || '';
              if (deliveryDate > filters.poExpectedDeliveryTo) return false;
            }

            // Text search filter
            if (poSearchTerm) {
              const searchLower = poSearchTerm.toLowerCase();
              const matchesSearch = (po.po_number?.toLowerCase().includes(searchLower) || po.supplier?.name?.toLowerCase().includes(searchLower));
              if (!matchesSearch) return false;
            }

            return true;
          });

          if (filteredPOs.length === 0) {
            return (
              <div className="flex flex-col items-center space-y-3 py-12">
                <FileText className="w-12 h-12 text-gray-300" />
                <p className="text-gray-500">{poSearchTerm ? 'No purchase orders match your search' : 'No purchase orders yet'}</p>
              </div>
            );
          }

          return filteredPOs.map((po) => {
            const StatusIcon = getPOStatusIcon(po.status);
            const warehouse = po.location_id ? locations.find(loc => loc.id === po.location_id) : null;
            return (
              <div key={po.id} onClick={() => handleOpenPODetail(po)} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer active:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{po.po_number}</p>
                    <p className="text-sm text-gray-600">{po.supplier?.name || 'N/A'}</p>
                  </div>
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold border ${getPOStatusColor(po.status)}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span>{getPOStatusLabel(po.status)}</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div><span className="text-gray-500">Date:</span> <span className="text-gray-900">{po.order_date ? new Date(po.order_date).toLocaleDateString() : 'N/A'}</span></div>
                  <div><span className="text-gray-500">Items:</span> <span className="font-semibold text-blue-600">{po.items?.length || 0}</span></div>
                  <div><span className="text-gray-500">Warehouse:</span> <span className="text-gray-900">{warehouse?.name || 'Default'}</span></div>
                  <div><span className="text-gray-500">Total:</span> <span className="font-bold text-gray-900">RM {(po.total_amount || 0).toFixed(2)}</span></div>
                </div>
              </div>
            );
          });
        })()}
      </div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
              {[
                { field: 'po_number', label: 'PO Number', align: 'left' },
                { field: 'supplier', label: 'Supplier', align: 'left' },
                { field: 'order_date', label: 'Order Date', align: 'left' },
                { field: 'expected_delivery_date', label: 'Expected Delivery', align: 'left' },
                { field: 'warehouse', label: 'Warehouse', align: 'left' },
                { field: 'status', label: 'Status', align: 'left' },
                { field: 'total_amount', label: 'Total Amount', align: 'right' },
                { field: 'items', label: 'Items', align: 'center' },
                { field: 'created_by', label: 'Managed By', align: 'left' }
              ].map(col => (
                <th
                  key={col.field}
                  onClick={() => setPoSortBy(prev => ({ field: col.field, direction: prev.field === col.field && prev.direction === 'asc' ? 'desc' : 'asc' }))}
                  className={`px-6 py-4 text-${col.align} text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none`}
                >
                  <span className="inline-flex items-center space-x-1">
                    <span>{col.label}</span>
                    {poSortBy.field === col.field && (
                      <span>{poSortBy.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(() => {
              // Filter purchase orders based on search term and date range
              let filteredPOs = purchaseOrders.filter(po => {
                // Supplier filter
                if (filters.suppliers?.length > 0 && !filters.suppliers.includes(po.supplier_id)) {
                  return false;
                }

                // Location filter
                if (filters.locations?.length > 0 && !filters.locations.includes(po.location_id)) {
                  return false;
                }

                // PO Status filter
                if (filters.poStatuses?.length > 0 && !filters.poStatuses.includes(po.status)) {
                  return false;
                }

                // Managed By filter
                if (filters.managedBy?.length > 0 && !filters.managedBy.includes(po.created_by?.id)) {
                  return false;
                }

                // Order Date Range filter
                if (filters.poOrderDateFrom) {
                  const orderDate = po.order_date || '';
                  if (orderDate < filters.poOrderDateFrom) return false;
                }
                if (filters.poOrderDateTo) {
                  const orderDate = po.order_date || '';
                  if (orderDate > filters.poOrderDateTo) return false;
                }

                // Expected Delivery Date Range filter
                if (filters.poExpectedDeliveryFrom) {
                  const deliveryDate = po.expected_delivery_date || '';
                  if (deliveryDate < filters.poExpectedDeliveryFrom) return false;
                }
                if (filters.poExpectedDeliveryTo) {
                  const deliveryDate = po.expected_delivery_date || '';
                  if (deliveryDate > filters.poExpectedDeliveryTo) return false;
                }

                // Text search filter
                if (poSearchTerm) {
                  const searchLower = poSearchTerm.toLowerCase();
                  const matchesSearch = (
                    po.po_number?.toLowerCase().includes(searchLower) ||
                    po.supplier?.name?.toLowerCase().includes(searchLower) ||
                    po.items?.some(item =>
                      item.product?.name?.toLowerCase().includes(searchLower) ||
                      item.product?.sku?.toLowerCase().includes(searchLower)
                    )
                  );
                  if (!matchesSearch) return false;
                }

                return true;
              });

              // Sort
              if (poSortBy.field) {
                filteredPOs = [...filteredPOs].sort((a, b) => {
                  let valA, valB;
                  switch (poSortBy.field) {
                    case 'po_number': valA = a.po_number || ''; valB = b.po_number || ''; break;
                    case 'supplier': valA = a.supplier?.name || ''; valB = b.supplier?.name || ''; break;
                    case 'order_date': valA = a.order_date || ''; valB = b.order_date || ''; break;
                    case 'expected_delivery_date': valA = a.expected_delivery_date || ''; valB = b.expected_delivery_date || ''; break;
                    case 'warehouse': valA = locations.find(l => l.id === a.location_id)?.name || ''; valB = locations.find(l => l.id === b.location_id)?.name || ''; break;
                    case 'status': valA = a.status || ''; valB = b.status || ''; break;
                    case 'total_amount': valA = a.total_amount || 0; valB = b.total_amount || 0; break;
                    case 'items': valA = a.items?.length || 0; valB = b.items?.length || 0; break;
                    case 'created_by': valA = a.created_by?.display_name || ''; valB = b.created_by?.display_name || ''; break;
                    default: return 0;
                  }
                  if (typeof valA === 'number') {
                    return poSortBy.direction === 'asc' ? valA - valB : valB - valA;
                  }
                  return poSortBy.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                });
              }

              if (filteredPOs.length === 0) {
                return (
                  <tr>
                    <td colSpan="9" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <FileText className="w-12 h-12 text-gray-300" />
                        <p className="text-gray-500">
                          {poSearchTerm ? 'No purchase orders match your search' : 'No purchase orders yet'}
                        </p>
                        {!poSearchTerm && (
                          <button
                            onClick={() => setShowAddPOModal(true)}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                          >
                            Create First Purchase Order
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }

              return filteredPOs.map((po) => {
                const StatusIcon = getPOStatusIcon(po.status);
                // Find warehouse name from location_id
                const warehouse = po.location_id
                  ? locations.find(loc => loc.id === po.location_id)
                  : null;

                return (
                  <tr
                    key={po.id}
                    onClick={() => handleOpenPODetail(po)}
                    className="hover:bg-gray-50/50 transition-colors duration-150 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-900">{po.po_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900">{po.supplier?.name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {po.order_date ? new Date(po.order_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : 'TBD'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Warehouse className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {warehouse?.name || 'Default'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getPOStatusColor(po.status)}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{getPOStatusLabel(po.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="font-bold text-gray-900">RM {(po.total_amount || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                        {po.items?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{po.created_by?.display_name || '-'}</span>
                    </td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
