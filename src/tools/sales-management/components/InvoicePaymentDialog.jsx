import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, DollarSign } from 'lucide-react';

export default function InvoicePaymentDialog({
  isOpen,
  onClose,
  invoice,
  onAddPayment,
  onDeletePayment,
}) {
  const [paymentData, setPaymentData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: 0,
    payment_method: 'bank_transfer',
    reference_number: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset form and set default amount to amount_due when invoice changes
  useEffect(() => {
    if (invoice) {
      setPaymentData({
        payment_date: new Date().toISOString().split('T')[0],
        amount: parseFloat(invoice.amount_due || 0),
        payment_method: 'bank_transfer',
        reference_number: '',
        notes: '',
      });
    }
  }, [invoice]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (paymentData.amount <= 0) {
      alert('Payment amount must be greater than 0');
      return;
    }

    if (paymentData.amount > parseFloat(invoice.amount_due)) {
      const confirm = window.confirm(
        `Payment amount (RM ${paymentData.amount.toFixed(2)}) exceeds amount due (RM ${invoice.amount_due}). Continue?`
      );
      if (!confirm) return;
    }

    setSubmitting(true);

    try {
      await onAddPayment(invoice.id, paymentData);
      // Reset form
      setPaymentData({
        payment_date: new Date().toISOString().split('T')[0],
        amount: 0,
        payment_method: 'bank_transfer',
        reference_number: '',
        notes: '',
      });
    } catch (err) {
      alert(`Failed to add payment: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    try {
      await onDeletePayment(invoice.id, paymentId);
    } catch (err) {
      alert(`Failed to delete payment: ${err.message}`);
    }
  };

  const formatCurrency = (amount) => {
    return `RM ${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen || !invoice) return null;

  const totalAmount = parseFloat(invoice.total_amount || 0);
  const amountPaid = parseFloat(invoice.amount_paid || 0);
  const amountDue = parseFloat(invoice.amount_due || 0);
  const payments = invoice.payments || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div ref={dialogRef} className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manage Payments</h2>
            <p className="text-sm text-gray-500 mt-1">{invoice.invoice_code}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Invoice Summary */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Amount Paid</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(amountPaid)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Amount Due</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(amountDue)}</p>
              </div>
            </div>
          </div>

          {/* Add Payment Form */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign size={16} />
              Add New Payment
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={paymentData.payment_date}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, payment_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (RM) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="online_payment">Online Payment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={paymentData.reference_number}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, reference_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Transaction ID, Cheque No., etc."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Additional notes about this payment..."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Adding...' : 'Add Payment'}
                </button>
              </div>
            </form>
          </div>

          {/* Payment History */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Payment History</h3>
            {payments.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500">No payments recorded yet</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Method</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Reference</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Notes</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(payment.payment_date)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                          {payment.payment_method.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {payment.reference_number || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {payment.notes || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Payment"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
