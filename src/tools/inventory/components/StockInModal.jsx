import React from 'react';
import { Plus } from 'lucide-react';
import Modal, { ModalFooter } from './Modal';
import SearchableSelect from './SearchableSelect';

/**
 * Modal for stock in operations
 * Supports both pre-selected item and manual product/location selection
 */
export default function StockInModal({
  isOpen,
  onClose,
  selectedStockItem,
  setSelectedStockItem,
  stockInData,
  setStockInData,
  onSubmit,
  modalError,
  setModalError,
  products,
  locations,
  allProductUnits,
  customStockInTypes,
  setCustomStockInTypes,
  onSaveStockInTypes
}) {
  const handleClose = () => {
    onClose();
    setSelectedStockItem(null);
    setModalError('');
    setStockInData({ quantity: 0, unit_cost: 0, reference_type: '', location_id: '', notes: '' });
  };

  const currentProductId = selectedStockItem?.product?.id || stockInData.product_id;
  const productUnitsForItem = currentProductId ? allProductUnits.filter(u => u.product_id === currentProductId) : [];
  const currentProduct = products.find(p => p.id === currentProductId);
  const baseUnit = currentProduct?.base_unit || 'pcs';

  const getBaseQuantityInfo = () => {
    if (stockInData.unit && stockInData.unit !== baseUnit) {
      const unitConv = allProductUnits.find(u => u.product_id === currentProductId && u.unit_name === stockInData.unit);
      if (unitConv && stockInData.quantity > 0) {
        const baseQty = stockInData.quantity * unitConv.conversion_to_base;
        return (
          <p className="text-xs text-blue-600 mt-1">
            = {baseQty} {baseUnit} (base unit)
          </p>
        );
      }
    }
    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Stock In"
      icon={Plus}
      iconBgColor="from-blue-500 to-blue-600"
      maxWidth="max-w-lg"
      footer={
        <ModalFooter
          error={modalError}
          onCancel={handleClose}
          onSubmit={onSubmit}
          submitText={
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Confirm Stock In</span>
            </div>
          }
          submitButtonClass="bg-blue-600 hover:bg-blue-700"
        />
      }
    >
      {/* Product Info - Only show if pre-selected */}
      {selectedStockItem && (
        <div className={`rounded-xl p-4 mb-6 border ${selectedStockItem.isVirtual ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Product</p>
              <p className="font-bold text-gray-900">{selectedStockItem.product?.name}</p>
              <p className="text-xs text-gray-600">{selectedStockItem.product?.sku}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Location</p>
              <p className={`font-bold ${selectedStockItem.isVirtual && !selectedStockItem.location_id ? 'text-purple-600' : 'text-gray-900'}`}>
                {selectedStockItem.isVirtual && !selectedStockItem.location_id
                  ? 'Select below'
                  : selectedStockItem.location?.name}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Current Stock</p>
              <p className={`font-bold ${selectedStockItem.isVirtual ? 'text-purple-600' : 'text-blue-600'}`}>
                {selectedStockItem.quantity} {selectedStockItem.product?.unit}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {/* Product Selector - Only show if no pre-selected item */}
        {!selectedStockItem && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Product *</label>
            <select
              value={stockInData.product_id || ''}
              onChange={(e) => setStockInData({ ...stockInData, product_id: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
            >
              <option value="">Select product...</option>
              {products.filter(p => !p.is_deleted).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Location Selector - Show if no pre-selected item OR virtual item without location */}
        {(!selectedStockItem || (selectedStockItem?.isVirtual && !selectedStockItem?.location_id)) && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Warehouse *</label>
            <select
              value={stockInData.location_id}
              onChange={(e) => setStockInData({ ...stockInData, location_id: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
            >
              <option value="">Select warehouse...</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} {location.code ? `(${location.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reference Type Dropdown */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Stock In Type *</label>
          <SearchableSelect
            value={stockInData.reference_type}
            onChange={(val) => setStockInData({ ...stockInData, reference_type: val })}
            options={customStockInTypes.map(t => ({ value: t, label: t }))}
            placeholder="Select type..."
            allowAddNew={true}
            onAddNew={(newType) => {
              const trimmedType = newType.trim();
              if (trimmedType && !customStockInTypes.includes(trimmedType)) {
                const updatedTypes = [...customStockInTypes, trimmedType];
                setCustomStockInTypes(updatedTypes);
                // Save to database
                if (onSaveStockInTypes) {
                  onSaveStockInTypes(updatedTypes);
                }
              }
              setStockInData({ ...stockInData, reference_type: trimmedType });
            }}
            addNewLabel="+ Add new type..."
          />
        </div>

        {/* Quantity Input with Unit Selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={stockInData.quantity === 0 ? '' : stockInData.quantity}
              onChange={(e) => setStockInData({ ...stockInData, quantity: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
              placeholder="Enter quantity"
              min="0.01"
              step="0.01"
            />
            {productUnitsForItem.length > 0 ? (
              <select
                value={stockInData.unit || baseUnit}
                onChange={(e) => setStockInData({ ...stockInData, unit: e.target.value })}
                className="w-32 px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                <option value={baseUnit}>{baseUnit}</option>
                {productUnitsForItem.filter(u => !u.is_base_unit).map(u => (
                  <option key={u.id} value={u.unit_name}>{u.unit_name}</option>
                ))}
              </select>
            ) : (
              <div className="w-32 px-3 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 text-center">
                {baseUnit}
              </div>
            )}
          </div>
          {getBaseQuantityInfo()}
        </div>

        {/* Unit Cost Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Cost <span className="text-gray-400 font-normal">(Optional)</span></label>
          <input
            type="number"
            value={stockInData.unit_cost === 0 ? '' : stockInData.unit_cost}
            onChange={(e) => setStockInData({ ...stockInData, unit_cost: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
            placeholder="Enter unit cost"
            min="0"
            step="0.01"
          />
        </div>

        {/* Notes Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Notes <span className="text-gray-400 font-normal">(Optional)</span></label>
          <textarea
            value={stockInData.notes}
            onChange={(e) => setStockInData({ ...stockInData, notes: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all resize-none"
            rows="2"
            placeholder="e.g., Returned from customer, Supplier refund..."
          />
        </div>
      </div>
    </Modal>
  );
}
