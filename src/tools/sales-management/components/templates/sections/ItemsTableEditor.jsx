import React from 'react';
import ColorPicker from '../ui/ColorPicker';

export default function ItemsTableEditor({ config, onChange, documentType }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Items Table Settings</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure the line items table appearance and styling
        </p>
      </div>

      {/* Enable Items Table */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <input
          type="checkbox"
          id="items-enabled"
          checked={config.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="items-enabled" className="text-sm font-medium text-gray-900">
          Enable Items Table
        </label>
      </div>

      {config.enabled && (
        <>
          {/* Table Styling */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Table Styling</h4>

            <div className="space-y-4">
              <ColorPicker
                color={config.headerBackgroundColor}
                onChange={(color) => onChange({ headerBackgroundColor: color })}
                label="Header Background Color"
              />

              <ColorPicker
                color={config.headerTextColor}
                onChange={(color) => onChange({ headerTextColor: color })}
                label="Header Text Color"
              />

              <ColorPicker
                color={config.rowBackgroundColor}
                onChange={(color) => onChange({ rowBackgroundColor: color })}
                label="Row Background Color"
              />

              <ColorPicker
                color={config.alternateRowColor}
                onChange={(color) => onChange({ alternateRowColor: color })}
                label="Alternate Row Color"
              />

              <ColorPicker
                color={config.borderColor}
                onChange={(color) => onChange({ borderColor: color })}
                label="Border Color"
              />
            </div>
          </div>

          {/* Border Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Border Width (px)
              </label>
              <input
                type="number"
                value={config.borderWidth}
                onChange={(e) => onChange({ borderWidth: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="5"
              />
            </div>

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
          </div>

          {/* Show Borders Toggle */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="show-borders"
              checked={config.showBorders}
              onChange={(e) => onChange({ showBorders: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="show-borders" className="text-sm font-medium text-gray-900">
              Show Table Borders
            </label>
          </div>

          {/* Column Configuration - Simplified */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Column customization will be available in the full editor. Default columns are configured based on document type.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
