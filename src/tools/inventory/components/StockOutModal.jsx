import React from 'react';
import { Minus } from 'lucide-react';
import Modal, { ModalFooter } from './Modal';
import { FormLabel, TextArea } from './FormField';

/**
 * Modal for stock out operation
 * Supports both pre-selected item from inventory and manual selection
 */
export default function StockOutModal({
  isOpen,
  onClose,
  selectedStockItem,
  setSelectedStockItem,
  stockOutData,
  setStockOutData,
  onSubmit,
  modalError,
  setModalError,
  // Data dependencies
  products,
  items,
  locations,
  allProductUnits
}) {
  const handleClose = () => {
    onClose();
    setSelectedStockItem(null);
    setModalError('');
    setStockOutData({ quantity: 0, notes: '', product_id: '', location_id: '', unit: '' });
  };

  const currentProductId = selectedStockItem?.product?.id || stockOutData.product_id;
  const productUnitsForItem = currentProductId ? allProductUnits.filter(u => u.product_id === currentProductId) : [];
  const currentProduct = products.find(p => p.id === currentProductId);
  const baseUnit = currentProduct?.base_unit || 'pcs';

  // Calculate base quantity conversion
  const getBaseQuantityInfo = () => {
    if (!stockOutData.unit || stockOutData.unit === baseUnit || !stockOutData.quantity) {
      return null;
    }

    const unitConv = allProductUnits.find(u => u.product_id === currentProductId && u.unit_name === stockOutData.unit);
    if (unitConv && stockOutData.quantity > 0) {
      const baseQty = stockOutData.quantity * unitConv.conversion_to_base;
      return (
        <p className="text-xs text-red-600 mt-1">
          = {baseQty} {baseUnit} (base unit)
        </p>
      );
    }
    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Stock Out"
      icon={Minus}
      iconBgColor="from-red-500 to-orange-600"
      footer={
        <ModalFooter
          error={modalError}
          onCancel={handleClose}
          onSubmit={onSubmit}
          submitText="Stock Out"
          submitButtonClass="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
        />
      }
    >
      {/* Product Info - Only show if pre-selected */}
      {selectedStockItem && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Product</p>
              <p className="font-bold text-gray-900">{selectedStockItem.product?.name}</p>
              <p className="text-xs text-gray-600">{selectedStockItem.product?.sku}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Location</p>
              <p className="font-bold text-gray-900">{selectedStockItem.location?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Current Stock</p>
              <p className="font-bold text-gray-900">{selectedStockItem.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Available</p>
              <p className="font-bold text-emerald-600">{selectedStockItem.available_quantity}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {/* Product & Location Selectors - Only show if no pre-selected item */}
        {!selectedStockItem && (
          <>
            <div>
              <FormLabel required>Product</FormLabel>
              <select
                value={stockOutData.product_id || ''}
                onChange={(e) => {
                  const productId = e.target.value;
                  setStockOutData({ ...stockOutData, product_id: productId, location_id: '' });
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 transition-all"
              >
                <option value="">Select product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FormLabel required>Warehouse</FormLabel>
              <select
                value={stockOutData.location_id || ''}
                onChange={(e) => setStockOutData({ ...stockOutData, location_id: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 transition-all"
              >
                <option value="">Select warehouse...</option>
                {stockOutData.product_id
                  ? items.filter(item => item.product_id === stockOutData.product_id && item.quantity > 0).map(item => (
                      <option key={item.location_id} value={item.location_id}>
                        {item.location?.name} (Available: {item.available_quantity})
                      </option>
                    ))
                  : locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))
                }
              </select>
            </div>
          </>
        )}

        {/* Quantity Input with Unit Selector */}
        <div>
          <FormLabel required>Quantity</FormLabel>
          <div className="flex space-x-2">
            <input
              type="number"
              value={stockOutData.quantity === 0 ? '' : stockOutData.quantity}
              onChange={(e) => setStockOutData({ ...stockOutData, quantity: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 transition-all"
              placeholder="Enter quantity"
              min="0.01"
              step="0.01"
            />
            {productUnitsForItem.length > 0 ? (
              <select
                value={stockOutData.unit || baseUnit}
                onChange={(e) => setStockOutData({ ...stockOutData, unit: e.target.value })}
                className="w-32 px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900"
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
          {selectedStockItem && (
            <p className="text-xs text-gray-500 mt-1">
              Available: {selectedStockItem.available_quantity} {selectedStockItem.product?.base_unit || selectedStockItem.product?.unit}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <FormLabel>Notes <span className="text-gray-400 font-normal">(Optional)</span></FormLabel>
          <TextArea
            value={stockOutData.notes}
            onChange={(e) => setStockOutData({ ...stockOutData, notes: e.target.value })}
            placeholder="e.g., Shipped to customer, Used in project..."
            focusColor="focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>
    </Modal>
  );
}
