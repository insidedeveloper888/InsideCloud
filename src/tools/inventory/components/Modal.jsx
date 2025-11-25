import React from 'react';

/**
 * Reusable Modal wrapper component
 * Provides consistent backdrop, animations, and structure for all modals
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  iconBgColor = 'from-blue-600 to-blue-700',
  children,
  footer,
  maxWidth = 'max-w-lg'
}) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} border border-gray-200/50 transform transition-all max-h-[90vh] overflow-y-auto my-auto animate-in zoom-in-95 fade-in duration-300`}>
        {/* Header */}
        <div className="sticky top-0 bg-white px-4 md:px-8 pt-4 md:pt-8 pb-4 border-b border-gray-100 z-10">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className={`p-2 bg-gradient-to-br ${iconBgColor} rounded-xl`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            )}
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 pb-8 pt-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="sticky bottom-0 bg-white px-8 py-4 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Reusable Modal Footer with error display and action buttons
 */
export function ModalFooter({
  error,
  onCancel,
  onSubmit,
  cancelText = 'Cancel',
  submitText = 'Submit',
  submitButtonClass = 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
}) {
  return (
    <>
      {error && (
        <div className="mb-3 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all"
        >
          {cancelText}
        </button>
        <button
          onClick={onSubmit}
          className={`px-6 py-3 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 ${submitButtonClass}`}
        >
          {submitText}
        </button>
      </div>
    </>
  );
}
