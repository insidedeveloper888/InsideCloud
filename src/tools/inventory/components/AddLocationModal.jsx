import React from 'react';
import { Warehouse } from 'lucide-react';
import Modal, { ModalFooter } from './Modal';
import FormField from './FormField';

/**
 * Modal for adding a new warehouse/location
 */
export default function AddLocationModal({
  isOpen,
  onClose,
  newLocation,
  setNewLocation,
  onSubmit,
  modalError
}) {
  const handleClose = () => {
    onClose();
    setNewLocation({
      name: '',
      code: '',
      address: ''
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Warehouse/Location"
      icon={Warehouse}
      iconBgColor="from-blue-600 to-blue-700"
      footer={
        <ModalFooter
          error={modalError}
          onCancel={handleClose}
          onSubmit={onSubmit}
          submitText="Add Warehouse"
          submitButtonClass="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        />
      }
    >
      <div className="space-y-5">
        <FormField
          label="Warehouse Name"
          required
          value={newLocation.name}
          onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
          placeholder="e.g., Main Warehouse, Site Storage, Truck 01"
          focusColor="focus:ring-blue-500 focus:border-blue-500"
        />

        <FormField
          label="Code (Optional)"
          value={newLocation.code}
          onChange={(e) => setNewLocation({ ...newLocation, code: e.target.value })}
          placeholder="e.g., MAIN, SITE-01, TRUCK-01"
          focusColor="focus:ring-blue-500 focus:border-blue-500"
        />

        <FormField
          label="Address (Optional)"
          type="textarea"
          value={newLocation.address}
          onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
          placeholder="Warehouse address..."
          focusColor="focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </Modal>
  );
}
