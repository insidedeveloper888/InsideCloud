import React from 'react';
import { FileText, Plus, Minus } from 'lucide-react';
import Modal from './Modal';
import SearchableSelect from './SearchableSelect';

/**
 * Modal for creating new Purchase Orders with line items
 */
export default function CreatePOModal({
  isOpen,
  onClose,
  newPO,
  setNewPO,
  poItemToAdd,
  setPoItemToAdd,
  onSubmit,
  onAddItem,
  onRemoveItem,
  modalError,
  setModalError,
  suppliers,
  products,
  locations,
  allProductUnits,
  onShowQuickAddProduct
}) {
  const handleClose = () => {
    onClose();
    setModalError('');
    setNewPO({
      supplier_id: '',
      po_number: '',
      expected_delivery_date: '',
      location_id: '',
      notes: '',
      items: []
    });
    setPoItemToAdd({ product_id: '', quantity: 0, unit_cost: 0, unit: 'pcs' });
  };

  const totalAmount = newPO.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Purchase Order"
      icon={FileText}
      iconBgColor="from-emerald-500 to-teal-600"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* PO Basic Info */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier *</label>
            <SearchableSelect
              value={newPO.supplier_id}
              onChange={(val) => setNewPO({ ...newPO, supplier_id: val })}
              options={suppliers.map(s => ({ value: s.id, label: s.name }))}
              placeholder="Select supplier..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">PO Number *</label>
            <input
              type="text"
              value={newPO.po_number}
              onChange={(e) => setNewPO({ ...newPO, po_number: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
              placeholder="e.g., PO-2025-001"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Delivery Date</label>
            <input
              type="date"
              value={newPO.expected_delivery_date}
              onChange={(e) => setNewPO({ ...newPO, expected_delivery_date: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Receiving Warehouse *</label>
            <SearchableSelect
              value={newPO.location_id}
              onChange={(val) => setNewPO({ ...newPO, location_id: val })}
              options={locations.map(l => ({ value: l.id, label: l.name }))}
              placeholder="Select warehouse..."
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
          <textarea
            value={newPO.notes}
            onChange={(e) => setNewPO({ ...newPO, notes: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 transition-all resize-none"
            rows="2"
            placeholder="Additional notes for this purchase order..."
          />
        </div>

        {/* Add Items Section */}
        <div className="border-t-2 border-gray-100 pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Purchase Order Items *</h3>

          {/* Add Item Form */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-12 gap-3">
              <div className="col-span-2 md:col-span-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Product</label>
                <SearchableSelect
                  value={poItemToAdd.product_id}
                  onChange={(val) => {
                    const selectedProduct = products.find(p => p.id === val);
                    setPoItemToAdd({
                      ...poItemToAdd,
                      product_id: val,
                      unit: selectedProduct?.base_unit || selectedProduct?.unit || 'pcs'
                    });
                  }}
                  options={products.filter(p => !p.is_deleted).map(p => ({
                    value: p.id,
                    label: `${p.name} (${p.sku})`
                  }))}
                  placeholder="Select product..."
                  allowAddNew={true}
                  onAddNew={onShowQuickAddProduct}
                  addNewLabel="+ Create New Product"
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  value={poItemToAdd.quantity === 0 ? '' : poItemToAdd.quantity}
                  onChange={(e) => setPoItemToAdd({ ...poItemToAdd, quantity: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm text-gray-900"
                  placeholder="0"
                  min="1"
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">UOM</label>
                {(() => {
                  const selectedProduct = products.find(p => p.id === poItemToAdd.product_id);
                  const productUnitsForPO = poItemToAdd.product_id
                    ? allProductUnits.filter(u => u.product_id === poItemToAdd.product_id)
                    : [];
                  const baseUnit = selectedProduct?.base_unit || 'pcs';
                  const availableUnits = [
                    baseUnit,
                    ...productUnitsForPO.map(u => u.unit_name).filter(u => u !== baseUnit)
                  ];
                  return (
                    <select
                      value={poItemToAdd.unit || baseUnit}
                      onChange={(e) => setPoItemToAdd({ ...poItemToAdd, unit: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm text-gray-900"
                      disabled={!poItemToAdd.product_id}
                    >
                      {availableUnits.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  );
                })()}
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Unit Cost</label>
                <input
                  type="number"
                  value={poItemToAdd.unit_cost === 0 ? '' : poItemToAdd.unit_cost}
                  onChange={(e) => setPoItemToAdd({ ...poItemToAdd, unit_cost: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm text-gray-900"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-span-1 md:col-span-2 flex items-end">
                <button
                  onClick={onAddItem}
                  className="w-full px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-all flex items-center justify-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">Add Item</span>
                  <span className="md:hidden">Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Items List with Scroll */}
          {newPO.items.length > 0 ? (
            <>
              {/* Scrollable Items Container */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-2 mb-3">
                {newPO.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{item.product_name}</p>
                      <p className="text-xs text-gray-500">{item.product_sku}</p>
                    </div>
                    <div className="text-center px-3">
                      <p className="text-xs text-gray-500">Qty</p>
                      <p className="font-bold text-gray-900">{item.quantity} {item.unit || 'pcs'}</p>
                    </div>
                    <div className="text-center px-3">
                      <p className="text-xs text-gray-500">Unit Cost</p>
                      <p className="font-bold text-gray-900">RM {item.unit_cost.toFixed(2)}</p>
                    </div>
                    <div className="text-right px-3">
                      <p className="text-xs text-gray-500">Subtotal</p>
                      <p className="font-bold text-emerald-600">RM {(item.quantity * item.unit_cost).toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => onRemoveItem(index)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {/* Items count indicator */}
              {newPO.items.length > 3 && (
                <p className="text-xs text-gray-500 text-center mb-2">
                  Showing {newPO.items.length} items (scroll to see all)
                </p>
              )}
              {/* Total - Always visible */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border-2 border-emerald-200 sticky bottom-0">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                    <span className="text-xs text-gray-600 ml-2">({newPO.items.length} items)</span>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">
                    RM {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No items added yet. Add at least one item to create the purchase order.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Outside main children, at modal bottom */}
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
            disabled={!newPO.supplier_id || !newPO.po_number || !newPO.location_id || newPO.items.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            Create Purchase Order
          </button>
        </div>
      </div>
    </Modal>
  );
}
