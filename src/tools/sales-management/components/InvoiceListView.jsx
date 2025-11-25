import React, { useState } from 'react';
import { Plus, FileText, Edit, Trash2, DollarSign } from 'lucide-react';
import { useInvoiceStatuses } from '../hooks/useInvoiceStatuses';
import ConfirmDialog from './ConfirmDialog';

export default function InvoiceListView({
  invoices,
  loading,
  onCreateInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onAddPayment,
  organizationSlug,
}) {
  const { getStatusMaps } = useInvoiceStatuses(organizationSlug);
  const { colorMap, labelMap } = getStatusMaps();
  const [searchTerm, setSearchTerm] = useState('');

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    invoice: null
  });

  const filteredInvoices = invoices.filter(invoice => {
    const customerName = invoice.customer
      ? `${invoice.customer.first_name || ''} ${invoice.customer.last_name || ''}`.trim() || invoice.customer.company_name
      : '';

    return searchTerm === '' ||
      invoice.invoice_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
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

  const formatCurrency = (amount) => {
    return `RM ${parseFloat(amount || 0).toFixed(2)}`;
  };

  const isOverdue = (invoice) => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
    if (!invoice.due_date) return false;
    return new Date(invoice.due_date) < new Date();
  };

  // Handle delete confirmation
  const handleDeleteClick = (invoice) => {
    setDeleteConfirm({
      isOpen: true,
      invoice
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.invoice) {
      onDeleteInvoice(deleteConfirm.invoice.id);
    }
    setDeleteConfirm({ isOpen: false, invoice: null });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
          <p className="text-sm text-gray-600 mt-1">Manage invoices and payments</p>
        </div>
        <button
          onClick={onCreateInvoice}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          New Invoice
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by invoice code or customer..."
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
                  Invoice Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Due
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
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new invoice.</p>
                    <div className="mt-6">
                      <button
                        onClick={onCreateInvoice}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        New Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const overdueFlag = isOverdue(invoice);
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{invoice.invoice_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(invoice.invoice_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${overdueFlag ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                          {formatDate(invoice.due_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getCustomerName(invoice.customer)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(invoice.total_amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`text-sm font-semibold ${overdueFlag ? 'text-red-600' : parseFloat(invoice.amount_due) > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {formatCurrency(invoice.amount_due)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{
                            backgroundColor: (colorMap[invoice.status] || '#6B7280') + '20',
                            color: colorMap[invoice.status] || '#6B7280'
                          }}
                        >
                          {labelMap[invoice.status] || invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && parseFloat(invoice.amount_due) > 0 && (
                            <button
                              onClick={() => onAddPayment(invoice)}
                              className="text-green-600 hover:text-green-900"
                              title="Add Payment"
                            >
                              <DollarSign size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => onEditInvoice(invoice)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(invoice)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      {filteredInvoices.length > 0 && (
        <div className="text-sm text-gray-700">
          Showing {filteredInvoices.length} of {invoices.length} invoices
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, invoice: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${deleteConfirm.invoice?.invoice_code}? This action cannot be undone.`}
      />
    </div>
  );
}
