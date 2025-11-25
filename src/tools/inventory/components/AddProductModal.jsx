import React from 'react';
import { Plus, Warehouse } from 'lucide-react';
import Modal, { ModalFooter } from './Modal';
import FormField from './FormField';
import SearchableSelect from './SearchableSelect';

/**
 * Modal for adding a new product with optional initial stock
 */
export default function AddProductModal({
  isOpen,
  onClose,
  newProduct,
  setNewProduct,
  onSubmit,
  modalError,
  // Data & handlers
  customCategories,
  setCustomCategories,
  saveCustomCategories,
  customUnits,
  setCustomUnits,
  saveCustomUnits,
  locations
}) {
  const handleClose = () => {
    onClose();
  };

  const handleCategoryChange = (value) => {
    setNewProduct({ ...newProduct, category: value });
  };

  const handleAddNewCategory = (newCat) => {
    if (newCat && newCat.trim() && !customCategories.includes(newCat)) {
      const updatedCategories = [...customCategories, newCat];
      setCustomCategories(updatedCategories);
      setNewProduct({ ...newProduct, category: newCat });
      saveCustomCategories(updatedCategories);
    }
  };

  const handleAddNewUnit = (newUnit) => {
    if (newUnit && newUnit.trim() && !customUnits.includes(newUnit)) {
      const updatedUnits = [...customUnits, newUnit];
      setCustomUnits(updatedUnits);
      setNewProduct({ ...newProduct, base_unit: newUnit, unit: newUnit });
      saveCustomUnits(updatedUnits);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Item"
      icon={Plus}
      iconBgColor="from-emerald-500 to-cyan-600"
      footer={
        <ModalFooter
          error={modalError}
          onCancel={handleClose}
          onSubmit={onSubmit}
          submitText="Add Item"
          submitButtonClass="bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700"
        />
      }
    >
      <div className="space-y-5">
        <FormField
          label="SKU"
          value={newProduct.sku}
          onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value.toUpperCase() })}
          placeholder="e.g., CCTV-001"
          focusColor="focus:ring-emerald-500 focus:border-emerald-500"
        />

        <FormField
          label="Item Name"
          value={newProduct.name}
          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          placeholder="e.g., 1080P Camera"
          focusColor="focus:ring-emerald-500 focus:border-emerald-500"
        />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
          <SearchableSelect
            value={newProduct.category}
            onChange={handleCategoryChange}
            options={customCategories.filter(c => c && c.trim()).map(c => ({ value: c, label: c }))}
            placeholder="Select category..."
            allowAddNew={true}
            onAddNew={handleAddNewCategory}
            addNewLabel="+ Add New Category..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Base Unit</label>
          <SearchableSelect
            value={newProduct.base_unit}
            onChange={(val) => setNewProduct({ ...newProduct, base_unit: val, unit: val })}
            options={customUnits.filter(u => u && u.trim()).map(u => ({ value: u, label: u }))}
            placeholder="Select unit..."
            allowAddNew={true}
            onAddNew={handleAddNewUnit}
            addNewLabel="+ Add New Unit..."
          />
        </div>

        <FormField
          label="Description (Optional)"
          type="textarea"
          value={newProduct.description}
          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
          placeholder="Item description..."
          focusColor="focus:ring-emerald-500 focus:border-emerald-500"
        />

        {/* Initial Stock Section */}
        <div className="pt-5 border-t-2 border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Warehouse className="w-4 h-4 text-emerald-600" />
            <span>Initial Stock (Optional)</span>
          </h3>
          <div className="space-y-4">
            <FormField
              label="Location"
              type="select"
              value={newProduct.initial_location_id}
              onChange={(e) => setNewProduct({ ...newProduct, initial_location_id: e.target.value })}
              focusColor="focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Skip initial stock</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </FormField>

            {newProduct.initial_location_id && (
              <>
                <FormField
                  label="Quantity"
                  type="number"
                  value={newProduct.initial_quantity}
                  onChange={(e) => setNewProduct({ ...newProduct, initial_quantity: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  placeholder="0"
                  focusColor="focus:ring-emerald-500 focus:border-emerald-500"
                  inputProps={{ min: "1" }}
                />

                <FormField
                  label="Unit Cost"
                  type="number"
                  value={newProduct.initial_unit_cost}
                  onChange={(e) => setNewProduct({ ...newProduct, initial_unit_cost: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  placeholder="0.00"
                  focusColor="focus:ring-emerald-500 focus:border-emerald-500"
                  inputProps={{ step: "0.01" }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
