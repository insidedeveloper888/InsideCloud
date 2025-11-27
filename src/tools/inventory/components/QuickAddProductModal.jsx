import React from 'react';
import { Package } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

/**
 * Quick modal for adding a product during PO creation
 * Simpler version of AddProductModal with minimal fields
 */
export default function QuickAddProductModal({
  isOpen,
  onClose,
  quickProduct,
  setQuickProduct,
  onSubmit,
  customCategories,
  setCustomCategories,
  saveCustomCategories,
  customUnits,
  setCustomUnits,
  saveCustomUnits
}) {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setQuickProduct({
      sku: '',
      name: '',
      category: '',
      unit: ''
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-gray-200/50 transform transition-all max-h-[90vh] overflow-visible my-auto animate-in zoom-in-95 fade-in duration-300">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
            <Package className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Quick Add Product</h2>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">SKU *</label>
            <input
              type="text"
              value={quickProduct.sku}
              onChange={(e) => setQuickProduct({ ...quickProduct, sku: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
              placeholder="e.g., CAM-001"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
            <input
              type="text"
              value={quickProduct.name}
              onChange={(e) => setQuickProduct({ ...quickProduct, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
              placeholder="e.g., HD Camera 1080P"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <SearchableSelect
                value={quickProduct.category}
                onChange={(val) => setQuickProduct({ ...quickProduct, category: val })}
                options={customCategories.filter(c => c && c.trim()).map(cat => ({ value: cat, label: cat }))}
                placeholder="Select category..."
                allowAddNew={true}
                onAddNew={(newCat) => {
                  if (newCat && newCat.trim() && !customCategories.includes(newCat)) {
                    const updatedCategories = [...customCategories, newCat];
                    setCustomCategories(updatedCategories);
                    setQuickProduct({ ...quickProduct, category: newCat });
                    saveCustomCategories(updatedCategories);
                  }
                }}
                addNewLabel="Add new category..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
              <SearchableSelect
                value={quickProduct.unit}
                onChange={(val) => setQuickProduct({ ...quickProduct, unit: val })}
                options={customUnits.filter(u => u && u.trim()).map(u => ({ value: u, label: u }))}
                placeholder="Select unit..."
                allowAddNew={true}
                onAddNew={(newUnit) => {
                  if (newUnit && newUnit.trim() && !customUnits.includes(newUnit)) {
                    const updatedUnits = [...customUnits, newUnit];
                    setCustomUnits(updatedUnits);
                    setQuickProduct({ ...quickProduct, unit: newUnit });
                    saveCustomUnits(updatedUnits);
                  }
                }}
                addNewLabel="+ Add new unit..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t-2 border-gray-100">
          <button
            onClick={handleClose}
            className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!quickProduct.sku || !quickProduct.name}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Create & Add to PO
          </button>
        </div>
      </div>
    </div>
  );
}
