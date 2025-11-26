/**
 * ConfirmDialog Component
 * A reusable confirmation dialog for dangerous/important actions.
 * Consolidates multiple implementations across sales-management.
 *
 * @module components/ui/confirm-dialog
 */
import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, Info, AlertCircle, X } from 'lucide-react';
import { colors, radius, shadows } from '../../lib/design-tokens';

/**
 * ConfirmDialog - Unified confirmation dialog component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether dialog is visible
 * @param {function} props.onClose - Called when dialog should close (cancel, X, click outside, Escape)
 * @param {function} props.onConfirm - Called when user confirms action
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Dialog message/description
 * @param {string} [props.confirmText="Confirm"] - Text for confirm button
 * @param {string} [props.cancelText="Cancel"] - Text for cancel button
 * @param {string} [props.variant="danger"] - Visual variant: "danger" | "warning" | "info" | "default"
 * @param {boolean} [props.showIcon=true] - Whether to show variant icon
 * @param {boolean} [props.closeOnClickOutside=true] - Close when clicking backdrop
 * @param {boolean} [props.closeOnEscape=true] - Close when pressing Escape key
 *
 * @example
 * // Basic usage
 * <ConfirmDialog
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Product"
 *   message="Are you sure? This cannot be undone."
 *   variant="danger"
 * />
 *
 * @example
 * // Custom button text
 * <ConfirmDialog
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleArchive}
 *   title="Archive Invoice"
 *   message="This invoice will be moved to archives."
 *   confirmText="Archive"
 *   cancelText="Keep Active"
 *   variant="warning"
 * />
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  showIcon = true,
  closeOnClickOutside = true,
  closeOnEscape = true,
}) {
  const dialogRef = useRef(null);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Click outside handler
  useEffect(() => {
    if (!isOpen || !closeOnClickOutside) return;

    const handleClickOutside = (event) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, closeOnClickOutside]);

  if (!isOpen) return null;

  // Variant configurations using design tokens
  const variants = {
    danger: {
      icon: Trash2,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmButton: `${colors.danger.solid} ${colors.danger.solidHover} text-white`,
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      confirmButton: `${colors.warning.solid} ${colors.warning.solidHover} text-white`,
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      confirmButton: `${colors.info.solid} ${colors.info.solidHover} text-white`,
    },
    default: {
      icon: AlertCircle,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      confirmButton: `${colors.primary.solid} ${colors.primary.solidHover} text-white`,
    },
  };

  const variantConfig = variants[variant] || variants.default;
  const IconComponent = variantConfig.icon;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        ref={dialogRef}
        className={`bg-white ${radius.modal} ${shadows.modal} max-w-md w-full mx-4 overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          {showIcon && (
            <div className={`flex-shrink-0 w-10 h-10 ${variantConfig.iconBg} rounded-full flex items-center justify-center`}>
              <IconComponent className={`w-5 h-5 ${variantConfig.iconColor}`} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${radius.button} hover:bg-gray-50 transition-colors`}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium ${radius.button} transition-colors ${variantConfig.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
