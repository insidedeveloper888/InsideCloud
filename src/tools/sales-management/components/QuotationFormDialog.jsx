import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import MemberSelect from '../../../components/ui/member-select';
import ProductSelect from './ProductSelect';
import CustomerSelect from './CustomerSelect';
import StatusSelect from './StatusSelect';
import { useQuotationStatuses } from '../hooks/useQuotationStatuses';

const resolveApiOrigin = () =>
  process.env.REACT_APP_API_ORIGIN || window.location.origin;

export default function QuotationFormDialog({
  isOpen,
  onClose,
  onSave,
  order = null,
  customers = [],
  salesPersons = [],
  products = [],
  organizationSlug,
  initialCustomerId = null,
}) {
  const { statuses: quotationStatuses } = useQuotationStatuses(organizationSlug);
  const [formData, setFormData] = useState({
    customer_contact_id: '',
    sales_person_individual_id: '',
    quotation_date: new Date().toISOString().split('T')[0],
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
  const [lineItemErrors, setLineItemErrors] = useState([]); // Array of error objects for each line item
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
        sales_person_individual_id: order.sales_person_individual_id || '',
        quotation_date: order.quotation_date || new Date().toISOString().split('T')[0],
        expiry_date: order.expiry_date || '',
        status: order.status || 'draft',
        notes: order.notes || '',
        terms_and_conditions: order.terms_and_conditions || '',
        discount_amount: order.discount_amount || 0,
        items: order.items || [],
      });
    } else {
      // Create mode - reset form
      // Default expiry date to 30 days from now
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 30);

      setFormData({
        customer_contact_id: initialCustomerId || '', // Pre-fill from Quick Sales Action
        sales_person_individual_id: '',
        quotation_date: new Date().toISOString().split('T')[0],
        expiry_date: defaultExpiry.toISOString().split('T')[0],
        status: 'draft',
        notes: '',
        terms_and_conditions: '',
        discount_amount: 0,
        items: [],
      });
    }
    // Clear errors when dialog opens/closes or when switching between create/edit mode
    setErrors({
      customer_contact_id: '',
      sales_person_individual_id: '',
      items: ''
    });
    setLineItemErrors([]);
  }, [order, isOpen, initialCustomerId]);

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
          tax_percentage: 0,
        },
      ],
    }));
    // Clear items error when adding a line item
    setErrors(prev => ({ ...prev, items: '' }));
  };

  // Fetch product units when a product is selected
  const fetchProductUnits = async (productId) => {
    if (!organizationSlug || !productId) return [];

    try {
      const response = await fetch(
        `${resolveApiOrigin()}/api/inventory?type=product-units&organization_slug=${organizationSlug}&product_id=${productId}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📏 Product units data:', data);
        const units = data.data || [];
        setProductUnits(prev => ({
          ...prev,
          [productId]: units
        }));
        return units;
      }
    } catch (err) {
      console.error('Error fetching product units:', err);
    }
    return [];
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

      // Auto-populate unit price when unit changes
      if (field === 'unit' && value && newItems[index].product_id) {
        const productId = newItems[index].product_id;
        const units = productUnits[productId];
        if (units && units.length > 0) {
          const selectedUnit = units.find(u => u.unit_name === value);
          if (selectedUnit && selectedUnit.selling_price) {
            newItems[index].unit_price = parseFloat(selectedUnit.selling_price);
          }
        }
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
    const lineSubtotal = item.quantity * item.unit_price;
    const discountAmount = (lineSubtotal * (item.discount_percent || 0)) / 100;
    return sum + lineSubtotal - discountAmount;
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
    const newLineItemErrors = formData.items.map((item, index) => {
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
      // Show error at the top of line items section
      setErrors(prev => ({ ...prev, items: `Failed to save order: ${err.message}` }));
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
            {order ? 'Edit Quotation' : 'New Quotation'}
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
                    // Clear error when user selects a customer
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
                    // Clear error when user selects a sales person
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
                  Quotation Date *
                </label>
                <input
                  type="date"
                  value={formData.quotation_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, quotation_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <StatusSelect
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  statuses={quotationStatuses}
                />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Line Items *
                </label>
              </div>

              {errors.items && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={16} />
                  <span>{errors.items}</span>
                </div>
              )}

              <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
                {/* Grid Header */}
                <div className="grid grid-cols-[minmax(250px,4fr)_110px_80px_120px_80px_120px_50px] gap-4 bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">UOM</div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Qty</div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Unit Price</div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Disc %</div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total</div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center"></div>
                </div>

                {/* Grid Items */}
                <div className="divide-y divide-gray-100">
                  {formData.items.map((item, index) => {
                    const lineSubtotal = item.quantity * item.unit_price;
                    const discountAmount = (lineSubtotal * (item.discount_percent || 0)) / 100;
                    const lineTotal = lineSubtotal - discountAmount;
                    const itemErrors = lineItemErrors[index] || {};
                    const hasItemErrors = itemErrors.product_id || itemErrors.unit || itemErrors.quantity || itemErrors.unit_price;

                    return (
                      <div key={index} className={`px-4 py-3 ${hasItemErrors ? 'bg-red-50' : 'hover:bg-gray-50'} transition-colors`}>
                        <div className="grid grid-cols-[minmax(250px,4fr)_110px_80px_120px_80px_120px_50px] gap-4 items-start">
                          {/* Product */}
                          <div>
                            <ProductSelect
                            value={item.product_id}
                            products={products}
                            onChange={async (e) => {
                              const productId = e.target.value;
                              const product = products.find(p => p.id === productId);
                              updateLineItem(index, 'product_id', productId);
                              if (product) {
                                updateLineItem(index, 'product_name', product.name || product.product_name);

                                // Fetch units for this product first
                                const units = await fetchProductUnits(productId);

                                // Set default unit to base_unit
                                const defaultUnit = product.base_unit || product.unit || '';
                                updateLineItem(index, 'unit', defaultUnit);

                                // Auto-populate unit price from inventory_product_units
                                if (units && units.length > 0) {
                                  const baseUnit = units.find(u => u.unit_name === defaultUnit);
                                  if (baseUnit && baseUnit.selling_price) {
                                    updateLineItem(index, 'unit_price', parseFloat(baseUnit.selling_price));
                                  } else {
                                    // Fallback to product's default price
                                    updateLineItem(index, 'unit_price', product.unit_price || product.price || 0);
                                  }
                                } else {
                                  // Fallback to product's default price
                                  updateLineItem(index, 'unit_price', product.unit_price || product.price || 0);
                                }
                              } else {
                                // Clear fields if product cleared
                                updateLineItem(index, 'product_name', '');
                                updateLineItem(index, 'unit_price', 0);
                                updateLineItem(index, 'unit', '');
                              }
                            }}
                          />
                          {itemErrors.product_id && (
                            <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle size={12} />
                              <span>{itemErrors.product_id}</span>
                            </div>
                          )}
                        </div>

                        {/* UOM */}
                        <div>
                          <select
                            value={item.unit}
                            onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 shadow-sm"
                            disabled={!item.product_id}
                          >
                            <option value="">Unit</option>
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
                          {itemErrors.unit && (
                            <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle size={12} />
                              <span>{itemErrors.unit}</span>
                            </div>
                          )}
                        </div>

                        {/* Quantity */}
                        <div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-sm text-right border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 shadow-sm"
                            placeholder="0"
                          />
                          {itemErrors.quantity && (
                            <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle size={12} />
                              <span>{itemErrors.quantity}</span>
                            </div>
                          )}
                        </div>

                        {/* Unit Price */}
                        <div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">RM</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-full pl-8 pr-3 py-2 text-sm text-right border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 shadow-sm"
                              placeholder="0.00"
                            />
                          </div>
                          {itemErrors.unit_price && (
                            <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle size={12} />
                              <span>{itemErrors.unit_price}</span>
                            </div>
                          )}
                        </div>

                        {/* Discount */}
                        <div>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.discount_percent}
                              onChange={(e) => updateLineItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                              className="w-full pr-7 pl-3 py-2 text-sm text-right border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 shadow-sm"
                              placeholder="0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                          </div>
                        </div>

                        {/* Line Total */}
                        <div className="text-right font-medium text-gray-900 text-sm">
                          {lineTotal.toFixed(2)}
                        </div>

                        {/* Actions */}
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Remove Item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Empty State */}
                {formData.items.length === 0 && (
                  <div className="px-6 py-12 text-center rounded-b-lg">
                    <div className="text-gray-400 mb-2">No items added yet</div>
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Add your first item
                    </button>
                  </div>
                )}

                {/* Add Item Button Row */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    <Plus size={16} />
                    Add Line Item
                  </button>
                </div>
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

            {/* Terms and Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Terms and Conditions
              </label>
              <textarea
                value={formData.terms_and_conditions}
                onChange={(e) => setFormData(prev => ({ ...prev, terms_and_conditions: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                placeholder="Enter terms and conditions for this quotation..."
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
