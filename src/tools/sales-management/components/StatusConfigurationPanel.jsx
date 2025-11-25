import React, { useState, useEffect } from 'react';
import { Check, Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react';

export default function StatusConfigurationPanel({
  statuses: initialStatuses,
  onSave,
  loading,
  embedded = false // New prop to control embedded mode
}) {
  const [editingStatuses, setEditingStatuses] = useState(initialStatuses);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditingStatuses(initialStatuses);
    setHasChanges(false);
  }, [initialStatuses]);

  const updateStatus = (index, field, value) => {
    const updated = [...editingStatuses];

    // If setting is_completed_status to true, unset all others
    if (field === 'is_completed_status' && value === true) {
      updated.forEach((s, i) => {
        s.is_completed_status = (i === index);
      });
    } else {
      updated[index][field] = value;
    }

    // Auto-generate status_key from label if not manually set
    if (field === 'status_label' && !updated[index].status_key_manual) {
      updated[index].status_key = value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }

    setEditingStatuses(updated);
    setHasChanges(true);

    // In embedded mode, immediately update parent state
    if (embedded) {
      onSave(updated);
    }
  };

  const addStatus = () => {
    const newStatus = {
      status_key: '',
      status_label: '',
      status_color: '#3B82F6',
      is_completed_status: false,
      sort_order: editingStatuses.length,
      is_active: true,
      isNew: true,
    };

    const updated = [...editingStatuses, newStatus];
    setEditingStatuses(updated);
    setHasChanges(true);

    // In embedded mode, immediately update parent state
    if (embedded) {
      onSave(updated);
    }
  };

  const removeStatus = (index) => {
    const status = editingStatuses[index];

    if (status.is_completed_status) {
      alert('Cannot delete the completed status. Please mark another status as completed first.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${status.status_label}" status?`)) {
      const updated = editingStatuses.filter((_, i) => i !== index);
      setEditingStatuses(updated);
      setHasChanges(true);

      // In embedded mode, immediately update parent state
      if (embedded) {
        onSave(updated);
      }
    }
  };

  const handleSave = async () => {
    // Validation: Must have exactly one completed status
    const completedCount = editingStatuses.filter(s => s.is_completed_status).length;
    if (completedCount === 0) {
      alert('Please mark one status as "Completed" for revenue calculation.');
      return;
    }
    if (completedCount > 1) {
      alert('Only one status can be marked as completed.');
      return;
    }

    // Validation: All must have labels
    if (editingStatuses.some(s => !s.status_label || !s.status_label.trim())) {
      alert('All statuses must have a label.');
      return;
    }

    try {
      await onSave(editingStatuses);
      setHasChanges(false);
    } catch (error) {
      alert(`Failed to save: ${error.message}`);
    }
  };

  const handleCancel = () => {
    setEditingStatuses(initialStatuses);
    setHasChanges(false);
  };

  const completedStatus = editingStatuses.find(s => s.is_completed_status);

  return (
    <div className="space-y-3">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
        <div className="flex items-start gap-2">
          <AlertCircle className="text-blue-600 mt-0.5" size={14} />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-0.5 text-xs">Completion Status</h4>
            <p className="text-[10px] text-blue-700 leading-tight">
              Mark one status as <strong>"Completed"</strong> to indicate the transaction is finalized.
              {completedStatus && (
                <span className="block mt-0.5 font-medium">
                  Currently: <span className="text-blue-900">{completedStatus.status_label}</span>
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Status List Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-900">Order Statuses</h3>
        <button
          onClick={addStatus}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[10px] font-medium"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {/* Status List */}
      <div className="space-y-2">
        {editingStatuses.map((status, index) => (
          <div
            key={index}
            className={`border rounded p-2 bg-white hover:shadow-sm transition-all ${status.is_completed_status ? 'border-green-300 bg-green-50' : ''
              }`}
          >
            <div className="grid grid-cols-12 gap-2 items-center">
              {/* Drag Handle */}
              <div className="col-span-1 flex justify-center">
                <GripVertical size={14} className="text-gray-400 cursor-move" />
              </div>

              {/* Status Label */}
              <div className="col-span-4">
                <input
                  type="text"
                  value={status.status_label}
                  onChange={(e) => updateStatus(index, 'status_label', e.target.value)}
                  placeholder="Status Name"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              {/* Color Picker */}
              <div className="col-span-2">
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={status.status_color}
                    onChange={(e) => updateStatus(index, 'status_color', e.target.value)}
                    className="w-6 h-6 rounded border border-gray-300 cursor-pointer p-0"
                  />
                  <div
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium flex-1 text-center truncate"
                    style={{
                      backgroundColor: status.status_color + '20',
                      color: status.status_color
                    }}
                  >
                    Preview
                  </div>
                </div>
              </div>

              {/* Completed Status Checkbox */}
              <div className="col-span-4">
                <label className="flex items-center gap-1.5 cursor-pointer p-1 rounded hover:bg-black/5">
                  <input
                    type="checkbox"
                    checked={status.is_completed_status}
                    onChange={(e) => updateStatus(index, 'is_completed_status', e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[10px] font-medium text-gray-700 whitespace-nowrap">
                    Mark as Completed
                  </span>
                  {status.is_completed_status && (
                    <Check size={12} className="text-green-600" />
                  )}
                </label>
              </div>

              {/* Delete Button */}
              <div className="col-span-1 flex justify-center">
                <button
                  onClick={() => removeStatus(index)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete Status"
                  disabled={status.is_completed_status}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {editingStatuses.length === 0 && (
          <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded">
            <p className="text-xs text-gray-500 mb-2">No statuses configured.</p>
            <button
              onClick={addStatus}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
            >
              <Plus size={14} />
              Add Status
            </button>
          </div>
        )}
      </div>

      {/* Save/Cancel Buttons - Only show in standalone mode */}
      {!embedded && hasChanges && (
        <div className="flex justify-end gap-3 pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Statuses'}
          </button>
        </div>
      )}
    </div>
  );
}
