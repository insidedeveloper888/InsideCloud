import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Trash2, Edit, Eye, Grid, List } from 'lucide-react';
import SalesFilterPanel from './SalesFilterPanel';
import { useSalesOrderStatuses } from '../hooks/useSalesOrderStatuses';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';

export default function SalesOrderListView({
  salesOrders,
  loading,
  onCreateOrder,
  onEditOrder,
  onDeleteOrder,
  onViewOrder,
  customers = [],
  salesPersons = [],
  organizationSlug,
}) {
  const { getStatusMaps } = useSalesOrderStatuses(organizationSlug);
  const { colorMap, labelMap } = getStatusMaps();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter state
  const [filters, setFilters] = useState({
    statuses: [],
    customers: [],
    salesPersons: [],
  });

  // View mode: 'card' or 'table'
  const [viewMode, setViewMode] = useState(() => {
    // Default based on screen size
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 ? 'table' : 'card';
    }
    return 'table';
  });

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    order: null
  });

  // Update view mode on window resize
  useEffect(() => {
    const handleResize = () => {
      const userPreference = localStorage.getItem('salesOrderViewMode');
      if (!userPreference) {
        setViewMode(window.innerWidth >= 768 ? 'table' : 'card');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('salesOrderViewMode', mode);
  };

  // Filter orders based on search and filters
  const filteredOrders = salesOrders.filter(order => {
    const customerName = order.customer
      ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || order.customer.company_name
      : '';
    const salesPersonName = order.sales_person?.display_name || '';

    const matchesSearch = searchTerm === '' ||
      order.order_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salesPersonName?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    if (filters.statuses.length > 0) {
      if (!filters.statuses.includes(order.status)) return false;
    }

    // Customer filter
    if (filters.customers.length > 0) {
      if (!filters.customers.includes(order.customer_contact_id)) return false;
    }

    // Sales person filter
    if (filters.salesPersons.length > 0) {
      if (!filters.salesPersons.includes(order.sales_person_individual_id)) return false;
    }

    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to page 1 when search changes or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(Number(newItemsPerPage));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle delete confirmation
  const handleDeleteClick = (order) => {
    setDeleteConfirm({
      isOpen: true,
      order
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.order) {
      onDeleteOrder(deleteConfirm.order.id);
    }
    setDeleteConfirm({ isOpen: false, order: null });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Filter Panel - Responsive: Drawer on mobile, sidebar on desktop */}
      <SalesFilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        customers={customers}
        salesPersons={salesPersons}
        organizationSlug={organizationSlug}
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order code, customer, or sales person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Order Count and Toolbar Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Order Count and Items Per Page Control */}
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-gray-600">
              {filteredOrders.length > 0
                ? `Found ${filteredOrders.length} orders ${
                    totalPages > 1 ? `(Page ${currentPage} / ${totalPages})` : ''
                  }`
                : 'No orders'}
            </p>

            {filteredOrders.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                  className="text-xs px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span className="text-xs text-gray-500">per page</span>
              </div>
            )}
          </div>

          {/* Compact Toolbar Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all flex-1 sm:flex-initial ${
                showFilters
                  ? 'bg-gray-900 border-gray-900 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
              title="Toggle filters"
            >
              <Filter size={14} />
              <span className="hidden sm:inline">Filter</span>
              {(filters.statuses.length > 0 || filters.customers.length > 0 || filters.salesPersons.length > 0) && (
                <span className={`px-1.5 py-0.5 text-xs rounded-md font-semibold ${
                  showFilters ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
                }`}>
                  {filters.statuses.length + filters.customers.length + filters.salesPersons.length}
                </span>
              )}
            </button>

            {/* View Mode Toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-md p-0.5 flex-1 sm:flex-initial">
              <button
                onClick={() => handleViewModeChange('table')}
                className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded flex-1 ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                } transition-all`}
                title="Table view"
              >
                <List size={14} />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => handleViewModeChange('card')}
                className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded flex-1 ${
                  viewMode === 'card'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                } transition-all`}
                title="Card view"
              >
                <Grid size={14} />
                <span className="hidden sm:inline">Card</span>
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 hidden sm:block" />

            {/* Add Button */}
            <button
              onClick={onCreateOrder}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all shadow-sm flex-1 sm:flex-initial"
              title="Create order"
            >
              <Plus size={14} />
              <span>New Order</span>
            </button>
          </div>
        </div>

      {/* Orders Table View */}
      {viewMode === 'table' && filteredOrders.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wide">
                    Order Code
                  </th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wide">
                    Date
                  </th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wide">
                    Customer
                  </th>
                  <th className="hidden md:table-cell px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wide">
                    Sales Person
                  </th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wide">
                    Status
                  </th>
                  <th className="px-3 md:px-4 py-3 text-right text-xs font-semibold text-gray-700 tracking-wide">
                    Total Amount
                  </th>
                  <th className="px-3 md:px-4 py-3 text-right text-xs font-semibold text-gray-700 tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-3 md:px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {order.order_code}
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {formatDate(order.order_date)}
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {order.customer
                          ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || order.customer.company_name || '-'
                          : '-'}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-3 md:px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {order.sales_person?.display_name || '-'}
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 md:px-2.5 py-1 rounded-md text-xs font-medium"
                        style={{
                          backgroundColor: (colorMap[order.status] || '#6B7280') + '20',
                          color: colorMap[order.status] || '#6B7280'
                        }}
                      >
                        {labelMap[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-3 md:px-4 py-3 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3">
                      <div className="flex justify-end gap-1 md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onViewOrder(order)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => onEditOrder(order)}
                          className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(order)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Orders Card View */}
      {viewMode === 'card' && filteredOrders.length > 0 ? (
        <div className="space-y-3 md:space-y-4">
          {paginatedOrders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 rounded-lg p-4 md:p-5 hover:shadow-md active:shadow-lg transition-all bg-white flex flex-col"
            >
              {/* Order Code and Status */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 break-words">
                    {order.order_code}
                  </h3>
                  <div className="text-gray-500 text-sm mt-1">
                    {formatDate(order.order_date)}
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap items-center">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
                      style={{
                        backgroundColor: (colorMap[order.status] || '#6B7280') + '20',
                        color: colorMap[order.status] || '#6B7280'
                      }}
                    >
                      {labelMap[order.status] || order.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(order.total_amount)}
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="space-y-2 md:space-y-2.5 text-sm md:text-base text-gray-600 mb-3">
                <div className="flex items-center gap-2.5 py-1">
                  <span className="text-lg">👤</span>
                  <div>
                    <span className="text-xs text-gray-500 mr-2">Customer:</span>
                    <span className="break-words">
                      {order.customer
                        ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || order.customer.company_name || '-'
                        : '-'}
                    </span>
                  </div>
                </div>
                {order.sales_person && (
                  <div className="flex items-center gap-2.5 py-1">
                    <span className="text-lg">💼</span>
                    <div>
                      <span className="text-xs text-gray-500 mr-2">Sales Person:</span>
                      <span>{order.sales_person.display_name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons at bottom */}
              <div className="grid grid-cols-3 gap-2 mt-auto pt-2">
                <button
                  onClick={() => onViewOrder(order)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 text-gray-700 bg-white hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100 border border-gray-300 hover:border-blue-300 rounded-lg transition-all touch-manipulation font-medium text-sm shadow-sm"
                >
                  <Eye size={16} />
                  <span>View</span>
                </button>
                <button
                  onClick={() => onEditOrder(order)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-300 rounded-lg transition-all touch-manipulation font-medium text-sm shadow-sm"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteClick(order)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 text-gray-600 bg-white hover:bg-gray-50 hover:text-red-600 active:bg-red-50 border border-gray-300 hover:border-red-300 rounded-lg transition-all touch-manipulation font-medium text-sm shadow-sm"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Pagination Controls */}
      {filteredOrders.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-2">
          {/* Mobile: Simplified pagination */}
          <div className="sm:hidden flex items-center gap-3 w-full justify-between">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600 font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
            >
              Next
            </button>
          </div>

          {/* Desktop: Full pagination */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1;

                if (!showPage && page === 2) {
                  return <span key={page} className="px-2 py-2 text-gray-400">...</span>;
                }
                if (!showPage && page === totalPages - 1) {
                  return <span key={page} className="px-2 py-2 text-gray-400">...</span>;
                }
                if (!showPage) return null;

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
            <span className="text-3xl opacity-40">📋</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No orders found</h3>
          <p className="text-sm text-gray-500 mb-6">
            {searchTerm || (filters.statuses.length + filters.customers.length + filters.salesPersons.length) > 0
              ? 'No orders match your filters.'
              : 'Get started by creating your first sales order'}
          </p>
          <button
            onClick={onCreateOrder}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm hover:shadow-md"
          >
            <Plus size={20} />
            <span>Create Order</span>
          </button>
        </div>
      )}

      {/* Summary */}
      {filteredOrders.length > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-600 pt-2">
          <div>
            Showing {paginatedOrders.length} of {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
          </div>
          <div>
            Total: {formatCurrency(filteredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, order: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Sales Order"
        message={`Are you sure you want to delete sales order ${deleteConfirm.order?.order_code}? This action cannot be undone.`}
      />
      </div>
    </div>
  );
}
