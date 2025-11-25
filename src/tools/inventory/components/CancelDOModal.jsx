import React from 'react';
import { X } from 'lucide-react';

/**
 * Modal for canceling a delivery order with reason
 */
export default function CancelDOModal({
  isOpen,
  onClose,
  selectedDO,
  cancelReason,
  setCancelReason,
  onSubmit
}) {
  if (!isOpen || !selectedDO) return null;

  const handleClose = () => {
    onClose();
    setCancelReason('');
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 fade-in duration-300">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 rounded-full">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Cancel Delivery Order</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to cancel <span className="font-semibold">{selectedDO.do_number}</span>?
            {(selectedDO.status === 'confirmed' || selectedDO.status === 'dispatched') && (
              <span className="block mt-2 text-amber-600 font-medium">Stock will be restored to inventory.</span>
            )}
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Reason *</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter reason for cancellation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
              rows={3}
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Go Back
            </button>
            <button
              onClick={onSubmit}
              disabled={!cancelReason.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
