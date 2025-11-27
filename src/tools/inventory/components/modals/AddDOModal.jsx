import React from 'react';
import { Truck, Plus, Minus } from 'lucide-react';
import SearchableSelect from '../SearchableSelect';

/**
 * Create Delivery Order Modal
 * Allows creating a delivery order with:
 * - Customer selection
 * - Source warehouse
 * - Delivery address
 * - Multiple items with stock validation
 */
export default function AddDOModal({
  isOpen,
  onClose,
  newDO,
  setNewDO,
  doItemToAdd,
  setDoItemToAdd,
  customers,
  locations,
  products,
  items,
  allProductUnits,
  onSubmit,
  modalError
}) {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setDoItemToAdd({ product_id: '', quantity: 0, unit_cost: 0, unit: 'pcs' });
  };

  const handleAddItem = () => {
    if (!doItemToAdd.product_id || !doItemToAdd.quantity) return;

    const stockItem = items.find(i => i.product_id === doItemToAdd.product_id && i.location_id === newDO.location_id);
    const availableQty = stockItem?.quantity || 0;
    const alreadyAddedQty = newDO.items.filter(i => i.product_id === doItemToAdd.product_id).reduce((sum, i) => sum + (i.quantity || 0), 0);
    const remainingQty = availableQty - alreadyAddedQty;

    if (doItemToAdd.quantity > remainingQty) return;

    const product = products.find(p => p.id === doItemToAdd.product_id);
    setNewDO({
      ...newDO,
      items: [...newDO.items, {
        product_id: doItemToAdd.product_id,
        product_name: product?.name || '',
        product_sku: product?.sku || '',
        quantity: doItemToAdd.quantity,
        unit: doItemToAdd.unit || product?.base_unit || 'pcs'
      }]
    });
    setDoItemToAdd({ product_id: '', quantity: 0, unit_cost: 0, unit: 'pcs' });
  };

  const handleRemoveItem = (index) => {
    setNewDO({ ...newDO, items: newDO.items.filter((_, i) => i !== index) });
  };

  // Calculate stock info for selected product
  const getStockInfo = () => {
    if (!doItemToAdd.product_id || !newDO.location_id) return null;

    const stockItem = items.find(i => i.product_id === doItemToAdd.product_id && i.location_id === newDO.location_id);
    const availableQty = stockItem?.quantity || 0;
    const alreadyAddedQty = newDO.items.filter(i => i.product_id === doItemToAdd.product_id).reduce((sum, i) => sum + (i.quantity || 0), 0);
    const remainingQty = availableQty - alreadyAddedQty;
    const isInsufficient = doItemToAdd.quantity > remainingQty;

    return { remainingQty, alreadyAddedQty, isInsufficient };
  };

  const stockInfo = getStockInfo();

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-200/50 transform transition-all my-4 md:my-8 max-h-[95vh] md:max-h-[90vh] overflow-y-auto mx-2 md:mx-auto animate-in zoom-in-95 fade-in duration-300">
        <div className="sticky top-0 bg-white px-4 md:px-8 pt-4 md:pt-8 pb-4 border-b border-gray-100 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Create Delivery Order</h2>
          </div>
        </div>

        <div className="px-8 pb-8 pt-4 space-y-6">
          {/* DO Basic Info */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Customer *</label>
              <SearchableSelect
                value={newDO.customer_id}
                onChange={(val) => {
                  const selectedCustomer = customers.find(c => c.id === val);
                  const customerName = selectedCustomer ? `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim() : '';
                  const addressParts = [
                    selectedCustomer?.address_line_1,
                    selectedCustomer?.address_line_2,
                    selectedCustomer?.postal_code,
                    selectedCustomer?.city,
                    selectedCustomer?.state
                  ].filter(Boolean);
                  const customerAddress = addressParts.join(', ') || '';
                  setNewDO({ ...newDO, customer_id: val, customer_name: customerName, delivery_address: customerAddress });
                }}
                options={customers.map(c => ({ value: c.id, label: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.company_name || 'Unknown' }))}
                placeholder="Select customer..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">DO Number</label>
              <input
                type="text"
                value={newDO.do_number}
                onChange={(e) => setNewDO({ ...newDO, do_number: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                placeholder="Auto-generated if empty"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Source Warehouse *</label>
              <SearchableSelect
                value={newDO.location_id}
                onChange={(val) => setNewDO({ ...newDO, location_id: val })}
                options={locations.map(l => ({ value: l.id, label: l.name }))}
                placeholder="Select warehouse..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Delivery Date</label>
              <input
                type="date"
                value={newDO.expected_delivery_date}
                onChange={(e) => setNewDO({ ...newDO, expected_delivery_date: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
              />
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Address *</label>
            <textarea
              value={newDO.delivery_address}
              onChange={(e) => setNewDO({ ...newDO, delivery_address: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all resize-none"
              rows="2"
              placeholder="Delivery address (auto-filled from customer)"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={newDO.notes}
              onChange={(e) => setNewDO({ ...newDO, notes: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all resize-none"
              rows="2"
              placeholder="Additional notes for this delivery order..."
            />
          </div>

          {/* Add Items Section */}
          <div className="border-t-2 border-gray-100 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delivery Order Items *</h3>

            {/* Add Item Form */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-12 gap-3">
                <div className="col-span-2 md:col-span-6">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Product</label>
                  <SearchableSelect
                    value={doItemToAdd.product_id}
                    onChange={(val) => {
                      const selectedProduct = products.find(p => p.id === val);
                      setDoItemToAdd({
                        ...doItemToAdd,
                        product_id: val,
                        unit: selectedProduct?.base_unit || selectedProduct?.unit || 'pcs'
                      });
                    }}
                    options={products.filter(p => !p.is_deleted).map(p => ({
                      value: p.id,
                      label: `${p.name} (${p.sku})`
                    }))}
                    placeholder="Select product..."
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={doItemToAdd.quantity === 0 ? '' : doItemToAdd.quantity}
                    onChange={(e) => setDoItemToAdd({ ...doItemToAdd, quantity: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm text-gray-900"
                    placeholder="0"
                    min="1"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">UOM</label>
                  {(() => {
                    const selectedProduct = products.find(p => p.id === doItemToAdd.product_id);
                    const productUnitsForDO = doItemToAdd.product_id
                      ? allProductUnits.filter(u => u.product_id === doItemToAdd.product_id)
                      : [];
                    const baseUnit = selectedProduct?.base_unit || 'pcs';
                    const availableUnits = [
                      baseUnit,
                      ...productUnitsForDO.map(u => u.unit_name).filter(u => u !== baseUnit)
                    ];
                    return (
                      <select
                        value={doItemToAdd.unit || baseUnit}
                        onChange={(e) => setDoItemToAdd({ ...doItemToAdd, unit: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm text-gray-900"
                        disabled={!doItemToAdd.product_id}
                      >
                        {availableUnits.map((unit) => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
                <div className="col-span-2 md:col-span-2 flex items-end">
                  <button
                    onClick={handleAddItem}
                    disabled={!doItemToAdd.product_id || !doItemToAdd.quantity || stockInfo?.isInsufficient}
                    className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden md:inline">Add Item</span>
                    <span className="md:hidden">Add</span>
                  </button>
                </div>
              </div>
              {stockInfo && (
                <p className={`text-xs mt-2 ${stockInfo.isInsufficient ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  Available: {stockInfo.remainingQty} in stock {stockInfo.alreadyAddedQty > 0 ? `(${stockInfo.alreadyAddedQty} already added)` : ''}
                  {stockInfo.isInsufficient && ' - Insufficient stock!'}
                </p>
              )}
            </div>

            {/* Items List with Scroll */}
            {newDO.items.length > 0 ? (
              <>
                {/* Scrollable Items Container */}
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2 mb-3">
                  {newDO.items.map((item, index) => {
                    const stockItem = items.find(i => i.product_id === item.product_id && i.location_id === newDO.location_id);
                    const availableQty = stockItem?.quantity || 0;
                    const isOverStock = item.quantity > availableQty;
                    return (
                      <div key={index} className={`flex items-center justify-between border-2 rounded-xl p-3 ${isOverStock ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">{item.product_name}</p>
                          <p className="text-xs text-gray-500">{item.product_sku}</p>
                          {isOverStock && <p className="text-xs text-red-600">Exceeds available stock ({availableQty})</p>}
                        </div>
                        <div className="text-center px-4">
                          <p className="text-xs text-gray-500">Quantity</p>
                          <p className="font-bold text-gray-900">{item.quantity} {item.unit || 'pcs'}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                {/* Items count indicator */}
                {newDO.items.length > 3 && (
                  <p className="text-xs text-gray-500 text-center mb-2">
                    Showing {newDO.items.length} items (scroll to see all)
                  </p>
                )}
                {/* Total Items Summary */}
                <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 sticky bottom-0">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Items:</span>
                    <span className="text-2xl font-bold text-gray-900">{newDO.items.length}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Truck className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No items added yet. Add at least one item to create the delivery order.</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 pb-8">
          {modalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{modalError}</p>
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={!newDO.customer_id || !newDO.location_id || !newDO.delivery_address?.trim() || newDO.items.length === 0}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              Create Delivery Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
