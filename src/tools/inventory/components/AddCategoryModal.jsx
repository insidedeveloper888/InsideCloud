import React from 'react';
import { Plus } from 'lucide-react';
import Modal, { ModalFooter } from './Modal';
import FormField from './FormField';

/**
 * Modal for adding a new custom category
 */
export default function AddCategoryModal({
  isOpen,
  onClose,
  value,
  onChange,
  onSubmit
}) {
  const handleClose = () => {
    onClose();
    onChange('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && value.trim()) {
      onSubmit();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Category"
      icon={Plus}
      iconBgColor="from-purple-500 to-indigo-600"
      maxWidth="max-w-md"
      footer={
        <ModalFooter
          onCancel={handleClose}
          onSubmit={onSubmit}
          submitText="Add Category"
          submitButtonClass="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        />
      }
    >
      <FormField
        label="Category Name"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., Smart Home, Security Systems"
        focusColor="focus:ring-purple-500 focus:border-purple-500"
        inputProps={{ onKeyPress: handleKeyPress, autoFocus: true }}
      />
    </Modal>
  );
}
