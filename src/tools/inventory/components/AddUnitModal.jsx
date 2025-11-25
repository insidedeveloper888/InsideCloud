import React from 'react';
import { Plus } from 'lucide-react';
import Modal, { ModalFooter } from './Modal';

/**
 * Modal for adding custom units with optional unit conversion
 */
export default function AddUnitModal({
  isOpen,
  onClose,
  newCustomUnit,
  setNewCustomUnit,
  newUnitConversion,
  setNewUnitConversion,
  customUnits,
  onSubmit,
  modalError
}) {
  const handleClose = () => {
    onClose();
    setNewCustomUnit('');
    setNewUnitConversion({ to_unit: '', conversion_factor: '' });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Unit"
      icon={Plus}
      iconBgColor="from-orange-500 to-red-600"
      maxWidth="max-w-md"
      footer={
        <ModalFooter
          error={modalError}
          onCancel={handleClose}
          onSubmit={onSubmit}
          submitText="Add Unit"
          submitButtonClass="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          submitDisabled={!newCustomUnit.trim()}
        />
      }
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Name *</label>
          <input
            type="text"
            value={newCustomUnit}
            onChange={(e) => setNewCustomUnit(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && newCustomUnit.trim() && onSubmit()}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 transition-all placeholder:text-gray-400"
            placeholder="e.g., box, carton, roll"
            autoFocus
          />
        </div>

        {/* Optional Unit Conversion */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Unit Conversion (Optional)</label>
          <p className="text-xs text-gray-500 mb-3">Define how this unit converts to another unit</p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">1 {newCustomUnit || 'unit'} =</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newUnitConversion.conversion_factor}
              onChange={(e) => setNewUnitConversion({ ...newUnitConversion, conversion_factor: e.target.value })}
              className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center text-gray-900 bg-white placeholder:text-gray-400"
              placeholder="12"
            />
            <select
              value={newUnitConversion.to_unit}
              onChange={(e) => setNewUnitConversion({ ...newUnitConversion, to_unit: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white"
            >
              <option value="">Select unit...</option>
              {customUnits.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}
