import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import MemberSelect from './MemberSelect';
import CustomerSelect from './CustomerSelect';
import ProductSelect from './ProductSelect';
import QuotationSelect from './QuotationSelect';
import StatusSelect from './StatusSelect';
import { useSalesOrderStatuses } from '../hooks/useSalesOrderStatuses';

const resolveApiOrigin = () =>
  process.env.REACT_APP_API_ORIGIN || window.location.origin;

export default function SalesOrderFormDialog({
  isOpen,
  onClose,
  onSave,
  order = null,
  customers = [],
  salesPersons = [],
  products = [],
  quotations = [],
  organizationSlug,
  initialCustomerId = null,
}) {
  const { statuses } = useSalesOrderStatuses(organizationSlug);
  const [formData, setFormData] = useState({
    source_quotation_id: '',
    customer_contact_id: '',
    sales_person_individual_id: '',
    order_date: new Date().toISOString().split('T')[0],
    status: 'draft',
    notes: '',
    discount_amount: 0,
    items: [],
  });

  const [saving, setSaving] = useState(false);
  const [productUnits, setProductUnits] = useState({}); // Store units for each product
  const [errors, setErrors] = useState({
    customer_contact_id: '',
    sales_person_individual_id: '',
    items: ''
  });
  const [lineItemErrors, setLineItemErrors] = useState([]);
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
        source_quotation_id: order.source_quotation_id || '',
        customer_contact_id: order.customer_contact_id || '',
        sales_person_individual_id: order.sales_person_individual_id || '',
        order_date: order.order_date || new Date().toISOString().split('T')[0],
        status: order.status || 'draft',
        notes: order.notes || '',
        discount_amount: order.discount_amount || 0,
        items: order.items || [],
      });
    } else {
      // Create mode - reset form
      setFormData({
        source_quotation_id: '',
        customer_contact_id: initialCustomerId || '', // Pre-fill from Quick Sales Action
        sales_person_individual_id: '',
        order_date: new Date().toISOString().split('T')[0],
        status: 'draft',
        notes: '',
        discount_amount: 0,
        items: [],
      });
    }
  }, [order, isOpen, initialCustomerId]);

  // Handle quotation selection
  const handleQuotationSelect = async (quotationId) => {
    if (!quotationId) {
      setFormData(prev => ({
        ...prev,
        source_quotation_id: '',
        customer_contact_id: '',
        items: [],
      }));
      return;
    }

    try {
      // Fetch full quotation with items
      const response = await fetch(
        `${resolveApiOrigin()}/api/sales_quotations/${quotationId}?organization_slug=${organizationSlug}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch quotation details');
      }

      const selectedQuotation = await response.json();
      console.log('📋 Full Quotation loaded:', selectedQuotation);
      console.log('📦 Items from Quotation:', selectedQuotation.items);

      // Auto-populate from quotation
      setFormData(prev => ({
        ...prev,
        source_quotation_id: quotationId,
        customer_contact_id: selectedQuotation.customer_contact_id || '',
        sales_person_individual_id: selectedQuotation.sales_person_individual_id || '',
        notes: selectedQuotation.notes || '',
        discount_amount: selectedQuotation.discount_amount || 0,
        items: selectedQuotation.items ? selectedQuotation.items.map(item => ({
          product_id: item.product_id || '',
          product_name: item.product_name || '',
          unit: item.unit || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          discount_percent: item.discount_percentage || 0,
          discount_amount: item.discount_amount || 0,
        })) : [],
      }));
    } catch (err) {
      console.error('Error loading quotation:', err);
      alert('Failed to load quotation details. Please try again.');
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
        },
      ],
    }));
  };

  // Fetch product units when a product is selected
  const fetchProductUnits = async (productId) => {
    if (!organizationSlug || !productId) return;

    try {
      const response = await fetch(
        `${resolveApiOrigin()}/api/inventory?type=product-units&organization_slug=${organizationSlug}&product_id=${productId}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📏 Product units data:', data);
        setProductUnits(prev => ({
          ...prev,
          [productId]: data.data || []
        }));
      }
    } catch (err) {
      console.error('Error fetching product units:', err);
    }
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
        const lineTotal = item.quantity * item.unit_price;
        const discountAmount = (lineTotal * (item.discount_percent || 0)) / 100;
        newItems[index].discount_amount = discountAmount;
      }

      return { ...prev, items: newItems };
    });

    // Clear error for this specific field when user updates it
    setLineItemErrors(prev => {
      const newErrors = [...prev];
      if (newErrors[index]) {
        newErrors[index] = { ...newErrors[index], [field]: '' };
      }
      return newErrors;
    });
  };

  // Calculate totals
  const subtotal = formData.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price) - (item.discount_amount || 0);
  }, 0);

  const totalAmount = subtotal - (formData.discount_amount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    const newErrors = {
      customer_contact_id: '',
      sales_person_individual_id: '',
      items: ''
    };

    // Validation
    let hasError = false;

    if (!formData.customer_contact_id) {
      newErrors.customer_contact_id = 'Please select a customer';
      hasError = true;
    }

    if (!formData.sales_person_individual_id) {
      newErrors.sales_person_individual_id = 'Please select a sales person';
      hasError = true;
    }

    if (formData.items.length === 0) {
      newErrors.items = 'Please add at least one line item';
      hasError = true;
    }

    // Validate each line item
    const newLineItemErrors = formData.items.map((item) => {
      const itemErrors = {
        product_id: '',
        unit: '',
        quantity: '',
        unit_price: ''
      };

      if (!item.product_id) {
        itemErrors.product_id = 'Please select a product';
        hasError = true;
      }

      if (!item.unit) {
        itemErrors.unit = 'Please select a unit';
        hasError = true;
      }

      if (!item.quantity || item.quantity <= 0) {
        itemErrors.quantity = 'Quantity must be greater than 0';
        hasError = true;
      }

      if (item.unit_price < 0) {
        itemErrors.unit_price = 'Unit price cannot be negative';
        hasError = true;
      }

      return itemErrors;
    });

    setErrors(newErrors);
    setLineItemErrors(newLineItemErrors);

    if (hasError) {
      return;
    }

    setSaving(true);

    try {
      const orderData = {
        ...formData,
        subtotal,
        total_amount: totalAmount,
      };

      await onSave(orderData);
      onClose();
    } catch (err) {
      setErrors(prev => ({ ...prev, items: `Failed to save order: ${err.message}` }));
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
            {order ? 'Edit Sales Order' : 'New Sales Order'}
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
            {/* Source Quotation (only in create mode) */}
            {!order && quotations && quotations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  📋 Convert from Quotation (Optional)
                </label>
                <QuotationSelect
                  value={formData.source_quotation_id}
                  onChange={(e) => handleQuotationSelect(e.target.value)}
                  quotations={quotations}
                  placeholder="Create new sales order..."
                  filterConverted={true}
                />
                {formData.source_quotation_id && (
                  <p className="text-xs text-blue-700 mt-2">
                    ✓ Customer and items auto-populated from quotation
                  </p>
                )}
              </div>
            )}

            {/* Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer *
                </label>
                <CustomerSelect
                  value={formData.customer_contact_id}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, customer_contact_id: e.target.value }));
                    if (e.target.value) {
                      setErrors(prev => ({ ...prev, customer_contact_id: '' }));
                    }
                  }}
                  customers={customers}
                  placeholder="Select customer..."
                  required
                />
                {errors.customer_contact_id && (
                  <div className="mt-1 flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle size={14} />
                    <span>{errors.customer_contact_id}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sales Person *
                </label>
                <MemberSelect
                  name="sales_person_individual_id"
                  value={formData.sales_person_individual_id}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, sales_person_individual_id: e.target.value }));
                    if (e.target.value) {
                      setErrors(prev => ({ ...prev, sales_person_individual_id: '' }));
                    }
                  }}
                  members={salesPersons}
                  placeholder="Not assigned"
                />
                {errors.sales_person_individual_id && (
                  <div className="mt-1 flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle size={14} />
                    <span>{errors.sales_person_individual_id}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Date *
                </label>
                <input
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <StatusSelect
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  statuses={statuses}
                />
              </div>
            </div>

            {/* Line Items */}
            <div>
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

              {errors.items && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={16} />
                  <span>{errors.items}</span>
                </div>
              )}

              <div className="border border-gray-200 rounded-lg overflow-visible">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">UOM</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Unit Price</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Disc %</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Line Total</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {formData.items.map((item, index) => {
                      const lineTotal = (item.quantity * item.unit_price) - (item.discount_amount || 0);
                      const itemErrors = lineItemErrors[index] || {};
                      const hasErrors = Object.values(itemErrors).some(err => err);

                      return (
                        <React.Fragment key={index}>
                          <tr className={hasErrors ? 'border-red-200' : ''}>
                            <td className="px-3 py-2">
                              <ProductSelect
                                value={item.product_id}
                                onChange={(e) => {
                                  const productId = e.target.value;
                                  const product = products.find(p => p.id === productId);
                                  updateLineItem(index, 'product_id', productId);
                                  if (product) {
                                    updateLineItem(index, 'product_name', product.name || product.product_name);
                                    updateLineItem(index, 'unit_price', product.unit_price || product.price || 0);
                                    // Fetch units for this product
                                    fetchProductUnits(productId);
                                    // Set default unit to base_unit
                                    updateLineItem(index, 'unit', product.base_unit || product.unit || '');
                                  }
                                }}
                                products={products}
                                placeholder="Select Product..."
                                className="min-w-[250px]"
                              />
                              {itemErrors.product_id && (
                                <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
                                  <AlertCircle size={12} />
                                  <span>{itemErrors.product_id}</span>
                                </div>
                              )}
                            </td>
                          <td className="px-3 py-2">
                            <select
                              value={item.unit}
                              onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                              disabled={!item.product_id}
                            >
                              <option value="">UOM</option>
                              {item.product_id && productUnits[item.product_id] && productUnits[item.product_id].length > 0 ? (
                                productUnits[item.product_id].map(unit => (
                                  <option key={unit.id} value={unit.unit_name}>
                                    {unit.unit_name} {unit.is_base_unit ? '(base)' : `(x${unit.conversion_to_base})`}
                                  </option>
                                ))
                              ) : (
                                // Fallback to product's base unit
                                item.product_id && (() => {
                                  const product = products.find(p => p.id === item.product_id);
                                  const baseUnit = product?.base_unit || product?.unit || 'pcs';
                                  return <option value={baseUnit}>{baseUnit}</option>;
                                })()
                              )}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className={`w-20 px-2 py-1 text-sm text-right border rounded text-gray-900 ${
                                itemErrors.quantity ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                            {itemErrors.quantity && (
                              <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
                                <AlertCircle size={12} />
                                <span>{itemErrors.quantity}</span>
                              </div>
                            )}
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
                          <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                            {lineTotal.toFixed(2)}
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
                        </React.Fragment>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Discount (RM)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>

              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">RM {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-gray-900">- RM {(formData.discount_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">RM {totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                placeholder="Add any notes or comments..."
              />
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
              {saving ? 'Saving...' : (order ? 'Update Order' : 'Create Order')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
