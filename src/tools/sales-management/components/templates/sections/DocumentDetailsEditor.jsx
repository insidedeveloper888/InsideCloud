import React from 'react';
import ColorPicker from '../ui/ColorPicker';

export default function DocumentDetailsEditor({ config, onChange, documentType }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Details Settings</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure document information fields (invoice #, date, customer, etc.)
        </p>
      </div>

      {/* Enable Document Details */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <input
          type="checkbox"
          id="details-enabled"
          checked={config.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="details-enabled" className="text-sm font-medium text-gray-900">
          Enable Document Details Section
        </label>
      </div>

      {config.enabled && (
        <>
          {/* Layout */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Layout
            </label>
            <select
              value={config.layout}
              onChange={(e) => onChange({ layout: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="two-column">Two Column</option>
              <option value="single-column">Single Column</option>
              <option value="table">Table</option>
            </select>
          </div>

          {/* Font Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <input
                type="number"
                value={config.fontSize}
                onChange={(e) => onChange({ fontSize: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="6"
                max="18"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label Weight
              </label>
              <select
                value={config.labelWeight}
                onChange={(e) => onChange({ labelWeight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ColorPicker
              color={config.fontColor}
              onChange={(color) => onChange({ fontColor: color })}
              label="Text Color"
            />

            <ColorPicker
              color={config.labelColor}
              onChange={(color) => onChange({ labelColor: color })}
              label="Label Color"
            />
          </div>

          {/* Field Configuration - Simplified for now */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Field customization will be available in the full editor. Default fields are configured based on document type.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
