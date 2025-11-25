import React, { useState } from 'react';
import { Plus, Truck, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useDeliveryOrderStatuses } from '../hooks/useDeliveryOrderStatuses';
import ConfirmDialog from './ConfirmDialog';

export default function DeliveryOrderListView({
  deliveryOrders,
  loading,
  onCreateOrder,
  onEditOrder,
  onDeleteOrder,
  onMarkDelivered,
  organizationSlug,
}) {
  const { getStatusMaps } = useDeliveryOrderStatuses(organizationSlug);
  const { colorMap, labelMap } = getStatusMaps();
  const [searchTerm, setSearchTerm] = useState('');

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    order: null
  });

  const filteredOrders = deliveryOrders.filter(order => {
    const customerName = order.customer
      ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || order.customer.company_name
      : '';

    return searchTerm === '' ||
      order.delivery_order_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCustomerName = (customer) => {
    if (!customer) return 'N/A';
    const name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    return name || customer.company_name || 'N/A';
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
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading delivery orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Delivery Orders</h2>
          <p className="text-sm text-gray-600 mt-1">Manage shipments and deliveries</p>
        </div>
        <button
          onClick={onCreateOrder}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          New Delivery Order
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by DO code or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DO Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shipping Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <Truck className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No delivery orders</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new delivery order.</p>
                    <div className="mt-6">
                      <button
                        onClick={onCreateOrder}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        New Delivery Order
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.delivery_order_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(order.delivery_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getCustomerName(order.customer)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {order.sales_order?.order_code || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{order.shipping_method || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                        style={{
                          backgroundColor: (colorMap[order.status] || '#6B7280') + '20',
                          color: colorMap[order.status] || '#6B7280'
                        }}
                      >
                        {labelMap[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => onMarkDelivered(order.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Delivered"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => onEditOrder(order)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(order)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      {filteredOrders.length > 0 && (
        <div className="text-sm text-gray-700">
          Showing {filteredOrders.length} of {deliveryOrders.length} delivery orders
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, order: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Delivery Order"
        message={`Are you sure you want to delete delivery order ${deleteConfirm.order?.delivery_order_code}? This action cannot be undone.`}
      />
    </div>
  );
}
