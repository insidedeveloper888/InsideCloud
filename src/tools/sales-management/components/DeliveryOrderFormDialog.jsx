import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import MemberSelect from './MemberSelect';
import CustomerSelect from './CustomerSelect';
import ProductSelect from './ProductSelect';
import SalesOrderSelect from './SalesOrderSelect';
import StatusSelect from './StatusSelect';
import DeliveryOrderItemSelector from './DeliveryOrderItemSelector';

import { useDeliveryOrderStatuses } from '../hooks/useDeliveryOrderStatuses';

export default function DeliveryOrderFormDialog({
  isOpen,
  onClose,
  onSave,
  order = null,
  customers = [],
  salesPersons = [],
  products = [],
  salesOrders = [],
  organizationSlug,
}) {
  const { statuses: deliveryOrderStatuses } = useDeliveryOrderStatuses(organizationSlug);
  const [formData, setFormData] = useState({
    customer_contact_id: '',
    technician_individual_id: '',
    sales_order_id: '',
    delivery_date: new Date().toISOString().split('T')[0],
    billing_address: '',
    delivery_address: '',
    delivery_contact_name: '',
    delivery_contact_phone: '',
    shipping_method: '',
    tracking_number: '',
    status: 'draft',
    notes: '',
    internal_notes: '',
    items: [],
  });

  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [useItemSelector, setUseItemSelector] = useState(false); // Track if using item selector

  const [errors, setErrors] = useState({
    customer_contact_id: '',
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
    if (order) {
      // Edit mode - populate with existing order
      setFormData({
        customer_contact_id: order.customer_contact_id || '',
        technician_individual_id: order.technician_individual_id || '',
        sales_order_id: order.sales_order_id || '',
        delivery_date: order.delivery_date || new Date().toISOString().split('T')[0],
        billing_address: order.billing_address || '',
        delivery_address: order.delivery_address || '',
        delivery_contact_name: order.delivery_contact_name || '',
        delivery_contact_phone: order.delivery_contact_phone || '',
        shipping_method: order.shipping_method || '',
        tracking_number: order.tracking_number || '',
        status: order.status || 'draft',
        notes: order.notes || '',
        internal_notes: order.internal_notes || '',
        items: order.items || [],
      });
    } else {
      // Create mode - reset form
      setFormData({
        customer_contact_id: '',
        technician_individual_id: '',
        sales_order_id: '',
        delivery_date: new Date().toISOString().split('T')[0],
        billing_address: '',
        delivery_address: '',
        delivery_contact_name: '',
        delivery_contact_phone: '',
        shipping_method: '',
        tracking_number: '',
        status: 'draft',
        notes: '',
        internal_notes: '',
        items: [],
      });
      setSameAsBilling(false);
    }
  }, [order, isOpen]);

  // Auto-fill from sales order
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
      console.log('🔍 Full Sales Order loaded:', salesOrder);
      console.log('📦 Items from SO:', salesOrder.items);

      // Get customer details for delivery address
      const customer = customers.find(c => c.id === salesOrder.customer_contact_id);
      console.log('👤 Customer details:', customer);

      // Build billing address from customer (Address Line 1, Address Line 2, City Postal Code, State)
      let billingAddress = '';
      if (customer) {
        const addressParts = [];
        // Note: Contact fields use address_line_1 and address_line_2 with underscores
        if (customer.address_line_1) addressParts.push(customer.address_line_1);
        if (customer.address_line_2) addressParts.push(customer.address_line_2);

        // Combine city and postal code
        const cityPostal = [customer.city, customer.postal_code].filter(Boolean).join(' ');
        if (cityPostal) addressParts.push(cityPostal);

        if (customer.state) addressParts.push(customer.state);

        billingAddress = addressParts.join(', ');
      }

      console.log('🏠 Billing Address:', billingAddress);

      // Auto-fill customer and delivery details from sales order
      // Don't auto-populate items - let the DeliveryOrderItemSelector handle it
      setFormData(prev => ({
        ...prev,
        customer_contact_id: salesOrder.customer_contact_id || prev.customer_contact_id,
        technician_individual_id: salesOrder.sales_person_individual_id || prev.technician_individual_id,
        billing_address: billingAddress,
        delivery_address: sameAsBilling ? billingAddress : prev.delivery_address,
        delivery_contact_name: customer ? (customer.first_name && customer.last_name ? `${customer.first_name} ${customer.last_name}`.trim() : customer.company_name || '') : prev.delivery_contact_name,
        delivery_contact_phone: customer?.phone_1 || customer?.phone || customer?.mobile_phone || prev.delivery_contact_phone,
        items: [], // Will be populated by DeliveryOrderItemSelector
      }));

      // Enable item selector when sales order is selected
      setUseItemSelector(true);

      // If "same as billing" is checked, update delivery address
      if (sameAsBilling) {
        setSameAsBilling(true);
      }
    } catch (error) {
      console.error('Error fetching sales order:', error);
    }
  };

  // Handle items selected from DeliveryOrderItemSelector
  const handleItemsSelected = (selectedItems) => {
    setFormData(prev => ({
      ...prev,
      items: selectedItems,
    }));
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
          notes: '',
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
      return { ...prev, items: newItems };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({
      customer_contact_id: '',
      items: ''
    });

    // Validation
    const newErrors = {};

    if (!formData.customer_contact_id) {
      newErrors.customer_contact_id = 'Please select a customer';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'Please select at least one item to be delivered';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      alert(`Failed to save delivery order: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div ref={dialogRef} className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {order ? 'Edit Delivery Order' : 'New Delivery Order'}
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
            {/* Source Sales Order (only in create mode) */}
            {!order && salesOrders && salesOrders.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  📦 Convert from Sales Order (Optional)
                </label>
                <SalesOrderSelect
                  value={formData.sales_order_id}
                  onChange={(e) => handleSalesOrderChange(e.target.value)}
                  salesOrders={salesOrders}
                  placeholder="Create new delivery order..."
                  filterCompleted={false}
                  filterFullyDelivered={true}
                />
                {formData.sales_order_id && (
                  <p className="text-xs text-blue-700 mt-2">
                    ✓ Customer and items auto-populated from sales order
                  </p>
                )}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Delivery Date *
                </label>
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Technician
                </label>
                <MemberSelect
                  name="technician_individual_id"
                  value={formData.technician_individual_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, technician_individual_id: e.target.value }))}
                  members={salesPersons}
                  placeholder="Not assigned"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <StatusSelect
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  statuses={deliveryOrderStatuses}
                  placeholder="Select Status..."
                />
              </div>
            </div>

            {/* Delivery Details */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Delivery Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Address (Customer's Address)
                  </label>
                  <textarea
                    value={formData.billing_address}
                    readOnly
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    placeholder="Auto-filled from customer"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Delivery Address
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sameAsBilling}
                        onChange={(e) => {
                          setSameAsBilling(e.target.checked);
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, delivery_address: prev.billing_address }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Same as billing address</span>
                    </label>
                  </div>
                  <textarea
                    value={formData.delivery_address}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, delivery_address: e.target.value }));
                      if (sameAsBilling) setSameAsBilling(false);
                    }}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Street address, city, state, postal code..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.delivery_contact_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_contact_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Recipient name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.delivery_contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_contact_phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="+60123456789"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Details */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Shipping Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Method
                  </label>
                  <input
                    type="text"
                    value={formData.shipping_method}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipping_method: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="e.g., Standard Delivery, Express, Courier"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={formData.tracking_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, tracking_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Tracking number or AWB"
                  />
                </div>
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

              {/* Show DeliveryOrderItemSelector if sales order is selected */}
              {useItemSelector && formData.sales_order_id ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Items to Deliver *
                  </label>
                  <DeliveryOrderItemSelector
                    salesOrderId={formData.sales_order_id}
                    organizationSlug={organizationSlug}
                    onItemsSelected={handleItemsSelected}
                    initialSelectedItems={formData.items}
                  />
                </div>
              ) : (
                <>
                  {/* Manual Item Entry (fallback or when no sales order) */}
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Items *
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
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Quantity</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Unit</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Notes</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {formData.items.map((item, index) => (
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
                                className="w-24 px-2 py-1 text-sm text-right border border-gray-300 rounded text-gray-900"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                                placeholder="pcs"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={item.notes}
                                onChange={(e) => updateLineItem(index, 'notes', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                                placeholder="Optional notes"
                              />
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
                        ))}
                      </tbody>
                    </table>

                    {formData.items.length === 0 && (
                      <div className="px-6 py-8 text-center text-gray-500 text-sm">
                        No items added yet. Click "Add Item" to start.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Notes */}
            <div className="border-t border-gray-200 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Customer Visible)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Notes visible to customer..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Notes
                </label>
                <textarea
                  value={formData.internal_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Internal notes for team only..."
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
              {saving ? 'Saving...' : (order ? 'Update Delivery Order' : 'Create Delivery Order')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
