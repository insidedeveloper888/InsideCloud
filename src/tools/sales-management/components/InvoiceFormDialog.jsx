import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import MemberSelect from '../../../components/ui/member-select';
import CustomerSelect from './CustomerSelect';
import SalesOrderSelect from './SalesOrderSelect';
import DeliveryOrderSelect from './DeliveryOrderSelect';
import StatusSelect from './StatusSelect';
import ProductSelect from './ProductSelect';

import { useInvoiceStatuses } from '../hooks/useInvoiceStatuses';

export default function InvoiceFormDialog({
  isOpen,
  onClose,
  onSave,
  invoice = null,
  customers = [],
  salesPersons = [],
  products = [],
  salesOrders = [],
  deliveryOrders = [],
  organizationSlug,
  initialCustomerId = null,
}) {
  const { statuses: invoiceStatuses } = useInvoiceStatuses(organizationSlug);
  const [formData, setFormData] = useState({
    customer_contact_id: '',
    sales_person_individual_id: '',
    sales_order_id: '',
    delivery_order_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: '',
    tax_rate: 0,
    status: 'draft',
    notes: '',
    terms_and_conditions: '',
    items: [],
  });

  const [errors, setErrors] = useState({
    customer_contact_id: '',
    due_date: '',
    items: ''
  });

  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    if (invoice) {
      // Edit mode - populate with existing invoice
      // Map items to ensure product_name is correctly extracted from nested product object
      const mappedItems = (invoice.items || []).map(item => ({
        product_id: item.product_id || '',
        product_name: item.product_name || item.product?.name || '',
        unit: item.unit || item.product?.unit || '',
        quantity: parseFloat(item.quantity) || 0,
        unit_price: parseFloat(item.unit_price) || 0,
        discount_percent: parseFloat(item.discount_percent) || 0,
        discount_amount: parseFloat(item.discount_amount) || 0,
        subtotal: parseFloat(item.subtotal) || 0,
      }));

      setFormData({
        customer_contact_id: invoice.customer_contact_id || '',
        sales_person_individual_id: invoice.sales_person_individual_id || '',
        sales_order_id: invoice.sales_order_id || '',
        delivery_order_id: invoice.delivery_order_id || '',
        invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
        due_date: invoice.due_date || '',
        payment_terms: invoice.payment_terms || '',
        tax_rate: invoice.tax_rate || 0,
        status: invoice.status || 'draft',
        notes: invoice.notes || '',
        terms_and_conditions: invoice.terms_and_conditions || '',
        items: mappedItems,
      });
    } else {
      // Create mode - reset form
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30); // Default 30 days payment term

      setFormData({
        customer_contact_id: initialCustomerId || '', // Pre-fill from Quick Sales Action
        sales_person_individual_id: '',
        sales_order_id: '',
        delivery_order_id: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: defaultDueDate.toISOString().split('T')[0],
        payment_terms: 'Net 30',
        tax_rate: 0,
        status: 'draft',
        notes: '',
        terms_and_conditions: '',
        items: [],
      });
    }
  }, [invoice, isOpen, initialCustomerId]);

  // Auto-fill from sales order or delivery order
  const handleSalesOrderChange = async (salesOrderId) => {
    setFormData(prev => ({ ...prev, sales_order_id: salesOrderId }));

    if (!salesOrderId) return;

    try {
      // Fetch full sales order with items
      const response = await fetch(
        `/api/sales_orders/${salesOrderId}?organization_slug=${organizationSlug}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        console.error('Failed to fetch sales order details');
        return;
      }

      const salesOrder = await response.json();
      console.log('📋 Full Sales Order loaded:', salesOrder);

      setFormData(prev => ({
        ...prev,
        customer_contact_id: salesOrder.customer_contact_id || prev.customer_contact_id,
        sales_person_individual_id: salesOrder.sales_person_individual_id || prev.sales_person_individual_id,
        items: salesOrder.items?.map(item => {
          const quantity = parseFloat(item.quantity) || 0;
          const unitPrice = parseFloat(item.unit_price) || 0;
          const discountPercent = parseFloat(item.discount_percent) || 0;
          const lineTotal = quantity * unitPrice;
          const discountAmount = (lineTotal * discountPercent) / 100;
          const subtotal = lineTotal - discountAmount;

          return {
            product_id: item.product_id,
            product_name: item.product_name,
            unit: item.unit,
            quantity,
            unit_price: unitPrice,
            discount_percent: discountPercent,
            discount_amount: discountAmount,
            subtotal,
          };
        }) || [],
      }));
    } catch (error) {
      console.error('Error fetching sales order:', error);
    }
  };

  const handleDeliveryOrderChange = async (deliveryOrderId) => {
    setFormData(prev => ({ ...prev, delivery_order_id: deliveryOrderId }));

    if (!deliveryOrderId) return;

    try {
      // Fetch full delivery order with items
      const response = await fetch(
        `/api/delivery_orders/${deliveryOrderId}?organization_slug=${organizationSlug}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        console.error('Failed to fetch delivery order details');
        return;
      }

      const deliveryOrder = await response.json();
      console.log('🚚 Full Delivery Order loaded:', deliveryOrder);

      setFormData(prev => ({
        ...prev,
        customer_contact_id: deliveryOrder.customer_contact_id || prev.customer_contact_id,
        sales_person_individual_id: deliveryOrder.sales_person_individual_id || prev.sales_person_individual_id,
        sales_order_id: deliveryOrder.sales_order_id || prev.sales_order_id,
        items: deliveryOrder.items?.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          unit: item.unit,
          quantity: parseFloat(item.quantity) || 0,
          unit_price: 0, // Delivery orders don't have pricing, need to fill manually
          discount_percent: 0,
          discount_amount: 0,
          subtotal: 0,
        })) || [],
      }));
    } catch (error) {
      console.error('Error fetching delivery order:', error);
    }
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: '',
          product_name: '',
          unit: '',
          quantity: 1,
          unit_price: 0,
          discount_percent: 0,
          discount_amount: 0,
          subtotal: 0,
        },
      ],
    }));
  };

  const removeLineItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateLineItem = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };

      // Auto-calculate line totals
      if (field === 'quantity' || field === 'unit_price' || field === 'discount_percent') {
        const item = newItems[index];
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unit_price) || 0;
        const discountPercent = parseFloat(item.discount_percent) || 0;
        const lineTotal = quantity * unitPrice;
        const discountAmount = (lineTotal * discountPercent) / 100;
        const subtotal = lineTotal - discountAmount;

        newItems[index].discount_amount = discountAmount;
        newItems[index].subtotal = subtotal;
      }

      return { ...prev, items: newItems };
    });
  };

  // Calculate totals
  const subtotal = formData.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);

  const totalDiscount = formData.items.reduce((sum, item) => {
    return sum + (item.discount_amount || 0);
  }, 0);

  const afterDiscount = subtotal - totalDiscount;
  const taxAmount = (afterDiscount * (formData.tax_rate || 0)) / 100;
  const totalAmount = afterDiscount + taxAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({
      customer_contact_id: '',
      due_date: '',
      items: ''
    });

    // Validation
    const newErrors = {};

    if (!formData.customer_contact_id) {
      newErrors.customer_contact_id = 'Please select a customer';
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Please select a due date';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'Please add at least one line item';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);

    try {
      // Ensure all items have subtotal calculated
      const itemsWithSubtotal = formData.items.map(item => {
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unit_price) || 0;
        const discountPercent = parseFloat(item.discount_percent) || 0;
        const lineTotal = quantity * unitPrice;
        const discountAmount = (lineTotal * discountPercent) / 100;
        const itemSubtotal = lineTotal - discountAmount;

        return {
          ...item,
          quantity,
          unit_price: unitPrice,
          discount_percent: discountPercent,
          discount_amount: discountAmount,
          subtotal: itemSubtotal,
        };
      });

      const invoiceData = {
        ...formData,
        items: itemsWithSubtotal,
        subtotal,
        total_discount: totalDiscount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        amount_paid: invoice?.amount_paid || 0,
        amount_due: totalAmount - (invoice?.amount_paid || 0),
      };

      await onSave(invoiceData);
      onClose();
    } catch (err) {
      alert(`Failed to save invoice: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div ref={dialogRef} className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {invoice ? 'Edit Invoice' : 'New Invoice'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
            {/* Source Documents (only in create mode) */}
            {!invoice && (salesOrders.length > 0 || deliveryOrders.length > 0) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  🧾 Convert from Sales Order / Delivery Order (Optional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-blue-800 mb-1">
                      Sales Order
                    </label>
                    <SalesOrderSelect
                      value={formData.sales_order_id}
                      onChange={(e) => handleSalesOrderChange(e.target.value)}
                      salesOrders={salesOrders}
                      placeholder="None - Manual Entry"
                      filterCompleted={false}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-800 mb-1">
                      Delivery Order
                    </label>
                    <DeliveryOrderSelect
                      value={formData.delivery_order_id}
                      onChange={(e) => handleDeliveryOrderChange(e.target.value)}
                      deliveryOrders={deliveryOrders}
                      placeholder="None"
                      filterDelivered={false}
                    />
                  </div>
                </div>
                {(formData.sales_order_id || formData.delivery_order_id) && (
                  <p className="text-xs text-blue-700 mt-2">
                    ✓ Customer and items auto-populated from source document
                  </p>
                )}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer *
                </label>
                <CustomerSelect
                  value={formData.customer_contact_id}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, customer_contact_id: e.target.value }));
                    if (errors.customer_contact_id) {
                      setErrors(prev => ({ ...prev, customer_contact_id: '' }));
                    }
                  }}
                  customers={customers}
                  placeholder="Select Customer..."
                  required
                />
                {errors.customer_contact_id && (
                  <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
                    <AlertCircle size={12} />
                    <span>{errors.customer_contact_id}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, due_date: e.target.value }));
                    if (errors.due_date) {
                      setErrors(prev => ({ ...prev, due_date: '' }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
                {errors.due_date && (
                  <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
                    <AlertCircle size={12} />
                    <span>{errors.due_date}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sales Person
                </label>
                <MemberSelect
                  name="sales_person_individual_id"
                  value={formData.sales_person_individual_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, sales_person_individual_id: e.target.value }))}
                  members={salesPersons}
                  placeholder="Not assigned"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="e.g., Net 30, Due on Receipt"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <StatusSelect
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  statuses={invoiceStatuses}
                  placeholder="Select Status..."
                />
              </div>
            </div>


            {/* Line Items */}
            <div className="border-t border-gray-200 pt-4">
              {errors.items && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={16} />
                  <span>{errors.items}</span>
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Line Items *
                </label>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-visible">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Unit</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Unit Price</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Disc %</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Disc Amt</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Subtotal</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {formData.items.map((item, index) => {
                      const lineSubtotal = (item.quantity * item.unit_price) - (item.discount_amount || 0);
                      return (
                        <tr key={index}>
                          <td className="px-3 py-2">
                            <ProductSelect
                              value={item.product_id}
                              onChange={(e) => {
                                const productId = e.target.value;
                                const product = products.find(p => p.id === productId);
                                updateLineItem(index, 'product_id', productId);
                                if (product) {
                                  updateLineItem(index, 'product_name', product.name || product.product_name);
                                  updateLineItem(index, 'unit', product.base_unit || product.unit || '');
                                  updateLineItem(index, 'unit_price', product.unit_price || product.price || 0);
                                }
                              }}
                              products={products}
                              placeholder="Select Product..."
                              className="min-w-[250px]"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-sm text-right border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                              placeholder="pcs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-sm text-right border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.discount_percent}
                              onChange={(e) => updateLineItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                              className="w-16 px-2 py-1 text-sm text-right border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-gray-900">
                            {(item.discount_amount || 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                            {lineSubtotal.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeLineItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {formData.items.length === 0 && (
                  <div className="px-6 py-8 text-center text-gray-500 text-sm">
                    No items added yet. Click "Add Item" to start.
                  </div>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">RM {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-gray-900">- RM {totalDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">After Discount:</span>
                  <span className="font-medium text-gray-900">RM {afterDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({formData.tax_rate}%):</span>
                  <span className="font-medium text-gray-900">RM {taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">RM {totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            <div className="border-t border-gray-200 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Additional notes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  value={formData.terms_and_conditions}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms_and_conditions: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Payment terms and conditions..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : (invoice ? 'Update Invoice' : 'Create Invoice')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
